const API = '';

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

let config = JSON.parse(JSON.stringify(defaultConfig));

// DOM refs
const els = {
  entEnabled: document.getElementById('entEnabled'),
  entChannel: document.getElementById('entChannel'),
  entMessage: document.getElementById('entMessage'),
  entEmbed: document.getElementById('entEmbed'),
  entEmbedColor: document.getElementById('entEmbedColor'),
  entImgEnabled: document.getElementById('entImgEnabled'),
  entBgUrl: document.getElementById('entBgUrl'),
  entWelcomeText: document.getElementById('entWelcomeText'),
  entLayout: document.getElementById('entLayout'),
  entAvatarShape: document.getElementById('entAvatarShape'),
  entNameColor: document.getElementById('entNameColor'),
  entWelcomeColor: document.getElementById('entWelcomeColor'),
  entBorderColor: document.getElementById('entBorderColor'),
  entOverlayColor: document.getElementById('entOverlayColor'),
  entOverlayOp: document.getElementById('entOverlayOp'),
  opVal: document.getElementById('opVal'),
  entTestUser: document.getElementById('entTestUser'),
  entPreviewText: document.getElementById('entPreviewText'),
  prevUsername: document.getElementById('prevUsername'),
  prevWelcome: document.getElementById('prevWelcome'),

  saiEnabled: document.getElementById('saiEnabled'),
  saiChannel: document.getElementById('saiChannel'),
  saiMessage: document.getElementById('saiMessage'),
  saiEmbed: document.getElementById('saiEmbed'),
  saiEmbedColor: document.getElementById('saiEmbedColor'),
  saiTestUser: document.getElementById('saiTestUser'),
  saiPreviewText: document.getElementById('saiPreviewText'),

  exportArea: document.getElementById('exportArea'),
  importArea: document.getElementById('importArea'),
  statusBar: document.getElementById('statusBar'),
  botStatus: document.getElementById('botStatus'),
  toast: document.getElementById('toast')
};

// Tabs
function initTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });
}

// Load config from server
async function loadConfig() {
  try {
    const r = await fetch(API + '/api/config');
    if (r.ok) {
      const data = await r.json();
      config = { ...defaultConfig, ...data };
      if (data.entrada) config.entrada = { ...defaultConfig.entrada, ...data.entrada };
      if (data.saida) config.saida = { ...defaultConfig.saida, ...data.saida };
    }
  } catch (e) {
    console.log('Usando config local');
  }
  applyToUI();
}

// Apply config to UI
function applyToUI() {
  const e = config.entrada;
  els.entEnabled.checked = e.enabled;
  els.entChannel.value = e.channel || '';
  els.entMessage.value = e.message || '';
  els.entEmbed.checked = e.sendAsEmbed;
  els.entEmbedColor.value = e.embedColor || '#57f287';

  const img = e.image || {};
  els.entImgEnabled.checked = img.enabled !== false;
  els.entBgUrl.value = img.backgroundUrl || '';
  els.entWelcomeText.value = img.welcomeText || '';
  els.entLayout.value = img.layout || 'classic';
  els.entAvatarShape.value = img.avatarShape || 'circle';
  els.entNameColor.value = img.nameColor || '#FFFFFF';
  els.entWelcomeColor.value = img.welcomeColor || '#FFD700';
  els.entBorderColor.value = img.borderColor || '#FFFFFF';
  els.entOverlayColor.value = img.overlayColor || '#000000';
  els.entOverlayOp.value = img.overlayOpacity || 35;
  els.opVal.textContent = (img.overlayOpacity || 35) + '%';

  const s = config.saida;
  els.saiEnabled.checked = s.enabled;
  els.saiChannel.value = s.channel || '';
  els.saiMessage.value = s.message || '';
  els.saiEmbed.checked = s.sendAsEmbed;
  els.saiEmbedColor.value = s.embedColor || '#2F3136';

  updatePreviews();
  updateExport();
}

// Read from UI to config
function readFromUI() {
  config.entrada = {
    enabled: els.entEnabled.checked,
    channel: els.entChannel.value,
    message: els.entMessage.value,
    sendAsEmbed: els.entEmbed.checked,
    embedColor: els.entEmbedColor.value,
    image: {
      enabled: els.entImgEnabled.checked,
      backgroundUrl: els.entBgUrl.value,
      welcomeText: els.entWelcomeText.value,
      layout: els.entLayout.value,
      avatarShape: els.entAvatarShape.value,
      nameColor: els.entNameColor.value,
      welcomeColor: els.entWelcomeColor.value,
      borderColor: els.entBorderColor.value,
      overlayColor: els.entOverlayColor.value,
      overlayOpacity: parseInt(els.entOverlayOp.value)
    }
  };
  config.saida = {
    enabled: els.saiEnabled.checked,
    channel: els.saiChannel.value,
    message: els.saiMessage.value,
    sendAsEmbed: els.saiEmbed.checked,
    embedColor: els.saiEmbedColor.value
  };
}

// Update previews
function updatePreviews() {
  const mockUser = els.entTestUser.value || 'TestUser';
  const mockCount = 514;

  // Entrada text
  let entText = els.entMessage.value
    .replace(/{user}/g, '<span class="mention">@' + mockUser + '</span>')
    .replace(/{username}/g, mockUser)
    .replace(/{membercount}/g, mockCount)
    .replace(/{server}/g, 'Portugal Alfa Community')
    .replace(/{rules}/g, '<span class="mention">#regras</span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  els.entPreviewText.innerHTML = entText;

  // Preview image colors
  els.prevUsername.textContent = mockUser;
  els.prevUsername.style.color = els.entNameColor.value;
  els.prevWelcome.textContent = els.entWelcomeText.value;
  els.prevWelcome.style.color = els.entWelcomeColor.value;
  document.querySelector('.w-avatar').style.borderColor = els.entBorderColor.value;
  document.querySelector('.w-overlay').style.background = els.entOverlayColor.value;
  document.querySelector('.w-overlay').style.opacity = els.entOverlayOp.value / 100;

  const shape = els.entAvatarShape.value;
  const av = document.querySelector('.w-avatar');
  av.style.borderRadius = shape === 'circle' ? '50%' : shape === 'rounded' ? '20px' : '0';

  // Saída
  let saiText = els.saiMessage.value
    .replace(/{username}/g, '<strong>' + (els.saiTestUser.value || 'TestUser') + '</strong>')
    .replace(/{membercount}/g, 513)
    .replace(/{server}/g, 'Portugal Alfa Community')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  els.saiPreviewText.innerHTML = saiText;
}

function updateExport() {
  els.exportArea.value = JSON.stringify(config, null, 2);
}

// Toast
function showToast(msg, type = 'success') {
  els.toast.textContent = msg;
  els.toast.className = 'toast show ' + type;
  setTimeout(() => els.toast.classList.remove('show'), 3000);
}

// Bot status
async function checkBotStatus() {
  try {
    const r = await fetch(API + '/api/bot-status');
    const data = await r.json();
    if (data.online) {
      els.statusBar.className = 'status-bar online';
      els.botStatus.innerHTML = `✅ Bot conectado: <strong>${data.username}</strong>`;
    } else {
      els.statusBar.className = 'status-bar offline';
      els.botStatus.textContent = '❌ Bot offline: ' + (data.error || 'Token não configurado');
    }
  } catch {
    els.statusBar.className = 'status-bar offline';
    els.botStatus.textContent = '❌ Backend offline — verifica se o servidor está a correr';
  }
}

// Event listeners
function initEvents() {
  // Auto-update on input
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(inp => {
    inp.addEventListener('input', () => { readFromUI(); updatePreviews(); updateExport(); });
  });

  els.entOverlayOp.addEventListener('input', () => {
    els.opVal.textContent = els.entOverlayOp.value + '%';
  });

  // Save
  document.getElementById('btnSave').addEventListener('click', async () => {
    readFromUI();
    try {
      const r = await fetch(API + '/api/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (r.ok) {
        showToast('✅ Configurações guardadas no servidor!');
      } else {
        showToast('⚠️ Guardado localmente (backend offline)', 'warn');
        localStorage.setItem('pacConfig', JSON.stringify(config));
      }
    } catch {
      localStorage.setItem('pacConfig', JSON.stringify(config));
      showToast('⚠️ Guardado localmente (backend offline)', 'warn');
    }
  });

  // Reset
  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Tens a certeza? Vai apagar todas as configurações!')) return;
    config = JSON.parse(JSON.stringify(defaultConfig));
    applyToUI();
    showToast('Configurações resetadas!');
  });

  // Test Entrada
  document.getElementById('btnTestEntrada').addEventListener('click', async () => {
    readFromUI();
    const btn = document.getElementById('btnTestEntrada');
    btn.textContent = '⏳ A enviar...';
    btn.disabled = true;
    try {
      const r = await fetch(API + '/api/test-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mockUsername: els.entTestUser.value || 'TestUser' })
      });
      const data = await r.json();
      if (data.success) {
        showToast('✅ ' + data.message);
      } else {
        showToast('❌ Erro: ' + (data.error || 'Desconhecido'), 'error');
      }
    } catch (e) {
      showToast('❌ Backend offline — não foi possível enviar', 'error');
    }
    btn.textContent = '🧪 Enviar Teste no Discord';
    btn.disabled = false;
  });

  // Test Saída
  document.getElementById('btnTestSaida').addEventListener('click', async () => {
    readFromUI();
    const btn = document.getElementById('btnTestSaida');
    btn.textContent = '⏳ A enviar...';
    btn.disabled = true;
    try {
      const r = await fetch(API + '/api/test-leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mockUsername: els.saiTestUser.value || 'TestUser' })
      });
      const data = await r.json();
      if (data.success) {
        showToast('✅ ' + data.message);
      } else {
        showToast('❌ Erro: ' + (data.error || 'Desconhecido'), 'error');
      }
    } catch {
      showToast('❌ Backend offline — não foi possível enviar', 'error');
    }
    btn.textContent = '🧪 Enviar Teste no Discord';
    btn.disabled = false;
  });

  // Copy JSON
  document.getElementById('btnCopy').addEventListener('click', () => {
    els.exportArea.select();
    document.execCommand('copy');
    showToast('📋 JSON copiado!');
  });

  // Import
  document.getElementById('btnImport').addEventListener('click', () => {
    try {
      const data = JSON.parse(els.importArea.value);
      config = { ...defaultConfig, ...data };
      applyToUI();
      showToast('📥 Config importada!');
    } catch {
      showToast('❌ JSON inválido!', 'error');
    }
  });
}

// Init
initTabs();
initEvents();
loadConfig();
checkBotStatus();
setInterval(checkBotStatus, 30000);
