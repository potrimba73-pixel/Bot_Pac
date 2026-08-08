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
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

console.log('=== PAC Dashboard Pro iniciado ===');
console.log('PORT:', PORT);
console.log('TOKEN:', TOKEN ? 'OK' : 'N/A');

const defaultConfig = {
  entrada: {
    enabled: true,
    channel: "1146439899063529582",
    message: "Entrou um novo membro, {user} !! Diverte-te connosco, mas segue as {rules}! Agora ha **{membercount}** membros! 💪",
    sendAsEmbed: false,
    embedColor: "#57f287",
    image: {
      enabled: true,
      width: 1024,
      height: 500,
      backgroundUrl: "",
      backgroundColor: "#1a1a2e",
      overlayColor: "#000000",
      overlayOpacity: 35,
      elements: [
        { id: "avatar", type: "avatar", x: 180, y: 160, size: 180, shape: "circle", borderColor: "#FFFFFF", borderWidth: 6, visible: true },
        { id: "username", type: "text", x: 400, y: 200, text: "{username}", fontSize: 50, fontFamily: "sans-serif", color: "#FFFFFF", bold: true, visible: true },
        { id: "discriminator", type: "text", x: 400, y: 250, text: "#{discriminator}", fontSize: 35, fontFamily: "sans-serif", color: "#aaaaaa", bold: false, visible: true },
        { id: "welcome", type: "text", x: 400, y: 320, text: "Bem-Vindo a Portugal Alfa Community", fontSize: 35, fontFamily: "sans-serif", color: "#FFD700", bold: true, visible: true },
        { id: "count", type: "text", x: 400, y: 370, text: "Membro nº {membercount}", fontSize: 28, fontFamily: "sans-serif", color: "#FFFFFF", bold: false, visible: true }
      ]
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
  try { if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch (e) { console.error(e); }
  return JSON.parse(JSON.stringify(defaultConfig));
}
function saveConfig(cfg) { fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)); }

async function generateWelcomeImage(cfg, mockData) {
  const img = cfg.entrada.image;
  const w = img.width || 1024;
  const h = img.height || 500;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  if (img.backgroundUrl) {
    try { const bg = await loadImage(img.backgroundUrl); ctx.drawImage(bg, 0, 0, w, h); }
    catch { ctx.fillStyle = img.backgroundColor || '#1a1a2e'; ctx.fillRect(0, 0, w, h); }
  } else {
    ctx.fillStyle = img.backgroundColor || '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = img.overlayColor || '#000000';
  ctx.globalAlpha = (img.overlayOpacity || 35) / 100;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  const elements = img.elements || defaultConfig.entrada.image.elements;
  for (const el of elements) {
    if (!el || el.visible === false) continue;
    if (el.type === 'avatar') {
      const s = el.size || 180;
      const ax = el.x; const ay = el.y;
      ctx.save();
      if (el.shape === 'circle') {
        ctx.beginPath(); ctx.arc(ax + s/2, ay + s/2, s/2, 0, Math.PI*2); ctx.closePath(); ctx.clip();
      } else if (el.shape === 'rounded') {
        const r = s * 0.15;
        ctx.beginPath(); ctx.moveTo(ax+r, ay); ctx.lineTo(ax+s-r, ay); ctx.quadraticCurveTo(ax+s, ay, ax+s, ay+r);
        ctx.lineTo(ax+s, ay+s-r); ctx.quadraticCurveTo(ax+s, ay+s, ax+s-r, ay+s); ctx.lineTo(ax+r, ay+s);
        ctx.quadraticCurveTo(ax, ay+s, ax, ay+s-r); ctx.lineTo(ax, ay+r); ctx.quadraticCurveTo(ax, ay, ax+r, ay);
        ctx.closePath(); ctx.clip();
      }
      ctx.fillStyle = '#5865F2';
      ctx.fillRect(ax, ay, s, s);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.floor(s*0.45)}px ${el.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mockData.username.charAt(0).toUpperCase(), ax + s/2, ay + s/2);
      ctx.restore();
      if (el.borderColor && el.borderWidth) {
        ctx.save(); ctx.strokeStyle = el.borderColor; ctx.lineWidth = el.borderWidth;
        if (el.shape === 'circle') { ctx.beginPath(); ctx.arc(ax+s/2, ay+s/2, s/2 + el.borderWidth/2, 0, Math.PI*2); ctx.stroke(); }
        else { ctx.strokeRect(ax - el.borderWidth/2, ay - el.borderWidth/2, s + el.borderWidth, s + el.borderWidth); }
        ctx.restore();
      }
    } else if (el.type === 'text') {
      let txt = (el.text || '').replace(/{username}/g, mockData.username).replace(/{discriminator}/g, mockData.discriminator).replace(/{membercount}/g, mockData.memberCount).replace(/{server}/g, 'Portugal Alfa Community');
      ctx.save();
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.font = `${el.bold ? 'bold ' : ''}${el.fontSize || 30}px ${el.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(txt, el.x, el.y);
      ctx.restore();
    }
  }
  return canvas.encode('png');
}

app.get('/api/bot-status', async (req, res) => {
  if (!TOKEN) return res.json({ online: false, error: 'Token nao configurado' });
  try {
    const r = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bot ${TOKEN}` } });
    if (r.ok) { const d = await r.json(); return res.json({ online: true, username: d.username }); }
    res.json({ online: false, error: 'Token invalido' });
  } catch (e) { res.json({ online: false, error: e.message }); }
});

app.get('/api/config', (req, res) => res.json(loadConfig()));
app.post('/api/save-config', (req, res) => { saveConfig(req.body); res.json({ success: true }); });

app.post('/api/test-welcome', async (req, res) => {
  if (!TOKEN) return res.status(500).json({ error: 'TOKEN nao configurado' });
  const cfg = req.body.config || loadConfig();
  const mock = { username: req.body.mockUsername || 'TestUser', discriminator: '1234', memberCount: 514, userId: '123456789012345678' };
  const ch = cfg.entrada.channel; if (!ch) return res.status(400).json({ error: 'Canal nao configurado' });
  let content = cfg.entrada.message.replace(/{user}/g, `<@${mock.userId}>`).replace(/{username}/g, mock.username).replace(/{userid}/g, mock.userId).replace(/{membercount}/g, mock.memberCount).replace(/{server}/g, 'Portugal Alfa Community').replace(/{rules}/g, '<#CANAL_REGRAS>');
  try {
    const form = new FormData();
    if (cfg.entrada.sendAsEmbed) {
      form.append('payload_json', JSON.stringify({ embeds: [{ color: parseInt(cfg.entrada.embedColor.replace('#',''),16), description: content, image: { url: 'attachment://welcome.png' } }] }));
    } else { form.append('payload_json', JSON.stringify({ content })); }
    if (cfg.entrada.image && cfg.entrada.image.enabled) {
      const buf = await generateWelcomeImage(cfg, mock);
      form.append('file', buf, { filename: 'welcome.png', contentType: 'image/png' });
    }
    const r = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, { method: 'POST', headers: { Authorization: `Bot ${TOKEN}`, ...form.getHeaders() }, body: form });
    if (!r.ok) { const err = await r.text(); return res.status(r.status).json({ error: err }); }
    res.json({ success: true, message: 'Mensagem enviada! Verifica o Discord.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/test-leave', async (req, res) => {
  if (!TOKEN) return res.status(500).json({ error: 'TOKEN nao configurado' });
  const cfg = req.body.config || loadConfig();
  const mock = { username: req.body.mockUsername || 'TestUser', memberCount: 513 };
  const ch = cfg.saida.channel; if (!ch) return res.status(400).json({ error: 'Canal nao configurado' });
  let content = cfg.saida.message.replace(/{username}/g, mock.username).replace(/{membercount}/g, mock.memberCount).replace(/{server}/g, 'Portugal Alfa Community');
  try {
    const body = cfg.saida.sendAsEmbed ? { embeds: [{ color: parseInt(cfg.saida.embedColor.replace('#',''),16), description: content }] } : { content };
    const r = await fetch(`https://discord.com/api/v10/channels/${ch}/messages`, { method: 'POST', headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { const err = await r.text(); return res.status(r.status).json({ error: err }); }
    res.json({ success: true, message: 'Mensagem de saida enviada!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('*', (req, res) => {
  const p = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(p)) res.sendFile(p);
  else res.status(404).send('index.html nao encontrado');
});

app.listen(PORT, () => console.log(`PAC Dashboard Pro na porta ${PORT}`));
