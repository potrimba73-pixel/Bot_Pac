const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Caminho absoluto para a pasta public
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

console.log('=== PAC Dashboard iniciado ===');
console.log('PORT:', PORT);
console.log('TOKEN:', TOKEN ? 'configurado ✅' : 'NÃO configurado ❌');
console.log('PUBLIC_DIR:', PUBLIC_DIR);
console.log('PUBLIC exists:', fs.existsSync(PUBLIC_DIR));

// Config default
const defaultConfig = {
  entrada: {
    enabled: true,
    channel: "1146439899063529582",
    message: "Entrou um novo membro, {user} !! Diverte-te connosco, mas segue as {rules}! Agora há **{membercount}** membros! 💪",
    sendAsEmbed: false,
    embedColor: "#57f287",
    image: {
      enabled: true,
      backgroundUrl: "",
      welcomeText: "Bem-Vindo a Portugal Alfa Community",
      layout: "classic",
      avatarShape: "circle",
      nameColor: "#FFFFFF",
      welcomeColor: "#FFD700",
      borderColor: "#FFFFFF",
      overlayColor: "#000000",
      overlayOpacity: 35
    }
  },
  saida: {
    enabled: true,
    channel: "1146439899063529582",
    message: "Oh, o **{username}** saiu do servidor 😔, faz boa viagem! Ainda restam **{membercount}** membros.",
    sendAsEmbed: false,
    embedColor: "#2F3136"
  }
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Erro ao ler config:', e);
  }
  return defaultConfig;
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// ===== GERAR IMAGEM DE BOAS-VINDAS =====
async function generateWelcomeImage(config, mockData) {
  const { image } = config.entrada;
  const width = 1024;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo
  if (image.backgroundUrl) {
    try {
      const bg = await loadImage(image.backgroundUrl);
      ctx.drawImage(bg, 0, 0, width, height);
    } catch {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
  }

  // Overlay escuro
  ctx.fillStyle = image.overlayColor || '#000000';
  ctx.globalAlpha = (image.overlayOpacity || 35) / 100;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  // Avatar
  const avatarSize = 180;
  const avatarX = 180;
  const avatarY = height / 2 - avatarSize / 2;

  ctx.save();
  if (image.avatarShape === 'circle') {
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else if (image.avatarShape === 'rounded') {
    const r = 30;
    ctx.beginPath();
    ctx.moveTo(avatarX + r, avatarY);
    ctx.lineTo(avatarX + avatarSize - r, avatarY);
    ctx.quadraticCurveTo(avatarX + avatarSize, avatarY, avatarX + avatarSize, avatarY + r);
    ctx.lineTo(avatarX + avatarSize, avatarY + avatarSize - r);
    ctx.quadraticCurveTo(avatarX + avatarSize, avatarY + avatarSize, avatarX + avatarSize - r, avatarY + avatarSize);
    ctx.lineTo(avatarX + r, avatarY + avatarSize);
    ctx.quadraticCurveTo(avatarX, avatarY + avatarSize, avatarX, avatarY + avatarSize - r);
    ctx.lineTo(avatarX, avatarY + r);
    ctx.quadraticCurveTo(avatarX, avatarY, avatarX + r, avatarY);
    ctx.closePath();
    ctx.clip();
  }

  // Avatar placeholder (círculo cinza com inicial)
  ctx.fillStyle = '#5865F2';
  ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mockData.username.charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2);
  ctx.restore();

  // Borda do avatar
  if (image.borderColor && image.borderColor !== 'transparent') {
    ctx.save();
    ctx.strokeStyle = image.borderColor;
    ctx.lineWidth = 6;
    if (image.avatarShape === 'circle') {
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(avatarX - 3, avatarY - 3, avatarSize + 6, avatarSize + 6);
    }
    ctx.restore();
  }

  // Username
  ctx.fillStyle = image.nameColor || '#FFFFFF';
  ctx.font = 'bold 50px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(mockData.username, 400, 200);

  // Discriminator
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '35px sans-serif';
  ctx.fillText('#' + mockData.discriminator, 400, 250);

  // Texto de boas-vindas
  ctx.fillStyle = image.welcomeColor || '#FFD700';
  ctx.font = 'bold 35px sans-serif';
  ctx.fillText(image.welcomeText || 'Bem-Vindo a Portugal Alfa Community', 400, 320);

  // Contador
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '28px sans-serif';
  ctx.fillText(`Membro nº ${mockData.memberCount}`, 400, 370);

  return canvas.encode('png');
}

// ===== ENDPOINTS API =====

// Status do bot
app.get('/api/bot-status', async (req, res) => {
  if (!TOKEN) return res.json({ online: false, error: 'Token não configurado' });
  try {
    const r = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${TOKEN}` }
    });
    if (r.ok) {
      const data = await r.json();
      return res.json({ online: true, username: data.username });
    }
    res.json({ online: false, error: 'Token inválido' });
  } catch (e) {
    res.json({ online: false, error: e.message });
  }
});

// Ler config
app.get('/api/config', (req, res) => {
  res.json(loadConfig());
});

// Guardar config
app.post('/api/save-config', (req, res) => {
  saveConfig(req.body);
  res.json({ success: true });
});

// Enviar teste de entrada
app.post('/api/test-welcome', async (req, res) => {
  if (!TOKEN) return res.status(500).json({ error: 'TOKEN não configurado no servidor' });

  const config = req.body.config || loadConfig();
  const mockData = {
    username: req.body.mockUsername || 'TestUser',
    discriminator: '1234',
    memberCount: 514,
    userId: '123456789012345678'
  };

  const channelId = config.entrada.channel;
  if (!channelId) return res.status(400).json({ error: 'Canal não configurado' });

  // Substituir placeholders
  let content = config.entrada.message
    .replace(/{user}/g, `<@${mockData.userId}>`)
    .replace(/{username}/g, mockData.username)
    .replace(/{userid}/g, mockData.userId)
    .replace(/{membercount}/g, mockData.memberCount)
    .replace(/{server}/g, 'Portugal Alfa Community')
    .replace(/{rules}/g, '<#CANAL_REGRAS>');

  try {
    const form = new FormData();

    // Se embed ativado
    if (config.entrada.sendAsEmbed) {
      const embed = {
        color: parseInt(config.entrada.embedColor.replace('#', ''), 16),
        description: content,
        image: { url: 'attachment://welcome.png' }
      };
      form.append('payload_json', JSON.stringify({ embeds: [embed] }));
    } else {
      // Mensagem normal + imagem
      form.append('payload_json', JSON.stringify({ content: content }));
    }

    // Gerar imagem
    if (config.entrada.image && config.entrada.image.enabled) {
      const imageBuffer = await generateWelcomeImage(config, mockData);
      form.append('file', imageBuffer, { filename: 'welcome.png', contentType: 'image/png' });
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${TOKEN}`, ...form.getHeaders() },
      body: form
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    res.json({ success: true, message: 'Mensagem enviada! Verifica o Discord.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Enviar teste de saída
app.post('/api/test-leave', async (req, res) => {
  if (!TOKEN) return res.status(500).json({ error: 'TOKEN não configurado' });

  const config = req.body.config || loadConfig();
  const mockData = {
    username: req.body.mockUsername || 'TestUser',
    memberCount: 513
  };

  const channelId = config.saida.channel;
  if (!channelId) return res.status(400).json({ error: 'Canal não configurado' });

  let content = config.saida.message
    .replace(/{username}/g, mockData.username)
    .replace(/{membercount}/g, mockData.memberCount)
    .replace(/{server}/g, 'Portugal Alfa Community');

  try {
    const body = config.saida.sendAsEmbed
      ? { embeds: [{ color: parseInt(config.saida.embedColor.replace('#', ''), 16), description: content }] }
      : { content };

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    res.json({ success: true, message: 'Mensagem de saída enviada!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fallback: serve index.html para qualquer rota (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html não encontrado em: ' + indexPath);
  }
});

app.listen(PORT, () => {
  console.log(`PAC Dashboard rodando na porta ${PORT}`);
  console.log(`Bot token ${TOKEN ? 'configurado ✅' : 'NÃO configurado ❌'}`);
});
