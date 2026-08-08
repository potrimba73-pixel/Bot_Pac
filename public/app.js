const API = '';

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

let config = JSON.parse(JSON.stringify(defaultConfig));
let selectedEl = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let bgImage = null;

const els = {
  entEnabled: document.getElementById('entEnabled'),
  entChannel: document.getElementById('entChannel'),
  entMessage: document.getElementById('entMessage'),
  entEmbed: document.getElementById('entEmbed'),
  entEmbedColor: document.getElementById('entEmbedColor'),
  entImgEnabled: document.getElementById('entImgEnabled'),
  entBgUrl: document.getElementById('entBgUrl'),
  entBgColor: document.getElementById('entBgColor'),
  entOverlayColor: document.getElementById('entOverlayColor'),
  entOverlayOp: document.getElementById('entOverlayOp'),
  opVal: document.getElementById('opVal'),
  entTestUser: document.getElementById('entTestUser'),
  entPreviewText: document.getElementById('entPreviewText'),

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
  toast: document.getElementById('toast'),

  editorCanvas: document.getElementById('editorCanvas'),
  previewCanvas: document.getElementById('previewCanvas'),
  selectionBox: document.getElementById('selectionBox'),
  canvasContainer: document.getElementById('canvasContainer'),
  propForm: document.getElementById('propForm'),
  noSel: document.getElementById('noSel'),

  pId: document.getElementById('pId'),
  pType: document.getElementById('pType'),
  pText: document.getElementById('pText'),
  pX: document.getElementById('pX'),
  pY: document.getElementById('pY'),
  pSize: document.getElementById('pSize'),
  pBorderW: document.getElementById('pBorderW'),
  pColor: document.getElementById('pColor'),
  pBorderColor: document.getElementById('pBorderColor'),
  pFont: document.getElementById('pFont'),
  pShape: document.getElementById('pShape'),
  pBold: document.getElementById('pBold'),
  pVisible: document.getElementById('pVisible')
};

const editorCtx = els.editorCanvas.getContext('2d');
const previewCtx = els.previewCanvas.getContext('2d');

// ============ TABS ============
function initTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'editor') drawEditor();
    });
  });
}

// ============ CONFIG ============
async function loadConfig() {
  try {
    const r = await fetch(API + '/api/config');
    if (r.ok) {
      const data = await r.json();
      config = mergeDeep(JSON.parse(JSON.stringify(defaultConfig)), data);
    }
  } catch (e) { console.log('Usando config local'); }
  applyToUI();
}

function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

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
  els.entBgColor.value = img.backgroundColor || '#1a1a2e';
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
  loadBgImage();
}

function readFromUI() {
  config.entrada = {
    enabled: els.entEnabled.checked,
    channel: els.entChannel.value,
    message: els.entMessage.value,
    sendAsEmbed: els.entEmbed.checked,
    embedColor: els.entEmbedColor.value,
    image: {
      enabled: els.entImgEnabled.checked,
      width: 1024,
      height: 500,
      backgroundUrl: els.entBgUrl.value,
      backgroundColor: els.entBgColor.value,
      overlayColor: els.entOverlayColor.value,
      overlayOpacity: parseInt(els.entOverlayOp.value),
      elements: config.entrada.image.elements
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

// ============ PREVIEW ============
function updatePreviews() {
  const mockUser = els.entTestUser.value || 'TestUser';
  const mockCount = 514;

  let entText = els.entMessage.value
    .replace(/{user}/g, '<span class="mention">@' + mockUser + '</span>')
    .replace(/{username}/g, mockUser)
    .replace(/{membercount}/g, mockCount)
    .replace(/{server}/g, 'Portugal Alfa Community')
    .replace(/{rules}/g, '<span class="mention">#regras</span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  els.entPreviewText.innerHTML = entText;

  let saiText = els.saiMessage.value
    .replace(/{username}/g, '<strong>' + (els.saiTestUser.value || 'TestUser') + '</strong>')
    .replace(/{membercount}/g, 513)
    .replace(/{server}/g, 'Portugal Alfa Community')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  els.saiPreviewText.innerHTML = saiText;

  drawPreview();
}

function drawPreview() {
  const c = els.previewCanvas;
  const ctx = previewCtx;
  const w = c.width, h = c.height;
  const img = config.entrada.image;
  const scale = w / 1024;

  ctx.clearRect(0, 0, w, h);

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, w, h);
  } else {
    ctx.fillStyle = img.backgroundColor || '#1a1a2e';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.fillStyle = img.overlayColor || '#000000';
  ctx.globalAlpha = (img.overlayOpacity || 35) / 100;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  const elements = img.elements || [];
  const mock = { username: els.entTestUser.value || 'TestUser', discriminator: '1234', memberCount: 514 };

  for (const el of elements) {
    if (!el || el.visible === false) continue;
    if (el.type === 'avatar') {
      const s = (el.size || 180) * scale;
      const ax = el.x * scale;
      const ay = el.y * scale;
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
      ctx.font = 'bold ' + Math.floor(s*0.45) + 'px ' + (el.fontFamily || 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mock.username.charAt(0).toUpperCase(), ax + s/2, ay + s/2);
      ctx.restore();
      if (el.borderColor && el.borderWidth) {
        ctx.save(); ctx.strokeStyle = el.borderColor; ctx.lineWidth = el.borderWidth * scale;
        if (el.shape === 'circle') { ctx.beginPath(); ctx.arc(ax+s/2, ay+s/2, s/2 + (el.borderWidth*scale)/2, 0, Math.PI*2); ctx.stroke(); }
        else { ctx.strokeRect(ax - (el.borderWidth*scale)/2, ay - (el.borderWidth*scale)/2, s + el.borderWidth*scale, s + el.borderWidth*scale); }
        ctx.restore();
      }
    } else if (el.type === 'text') {
      let txt = (el.text || '').replace(/{username}/g, mock.username).replace(/{discriminator}/g, mock.discriminator).replace(/{membercount}/g, mock.memberCount);
      ctx.save();
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.font = (el.bold ? 'bold ' : '') + Math.floor((el.fontSize || 30) * scale) + 'px ' + (el.fontFamily || 'sans-serif');
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(txt, el.x * scale, el.y * scale);
      ctx.restore();
    }
  }
}

function loadBgImage() {
  const url = els.entBgUrl.value;
  if (!url) { bgImage = null; drawPreview(); drawEditor(); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { bgImage = img; drawPreview(); drawEditor(); };
  img.onerror = () => { bgImage = null; drawPreview(); drawEditor(); };
  img.src = url;
}

// ============ EDITOR VISUAL ============
function getCanvasScale() {
  const rect = els.editorCanvas.getBoundingClientRect();
  return rect.width / 1024;
}

function drawEditor() {
  const ctx = editorCtx;
  const img = config.entrada.image;

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, 1024, 500);
  } else {
    ctx.fillStyle = img.backgroundColor || '#1a1a2e';
    ctx.fillRect(0, 0, 1024, 500);
  }

  ctx.fillStyle = img.overlayColor || '#000000';
  ctx.globalAlpha = (img.overlayOpacity || 35) / 100;
  ctx.fillRect(0, 0, 1024, 500);
  ctx.globalAlpha = 1;

  const elements = img.elements || [];
  const mock = { username: els.entTestUser.value || 'TestUser', discriminator: '1234', memberCount: 514 };

  for (const el of elements) {
    if (!el || el.visible === false) continue;
    if (el.type === 'avatar') {
      const s = el.size || 180;
      ctx.save();
      if (el.shape === 'circle') {
        ctx.beginPath(); ctx.arc(el.x + s/2, el.y + s/2, s/2, 0, Math.PI*2); ctx.closePath(); ctx.clip();
      } else if (el.shape === 'rounded') {
        const r = s * 0.15;
        ctx.beginPath(); ctx.moveTo(el.x+r, el.y); ctx.lineTo(el.x+s-r, el.y); ctx.quadraticCurveTo(el.x+s, el.y, el.x+s, el.y+r);
        ctx.lineTo(el.x+s, el.y+s-r); ctx.quadraticCurveTo(el.x+s, el.y+s, el.x+s-r, el.y+s); ctx.lineTo(el.x+r, el.y+s);
        ctx.quadraticCurveTo(el.x, el.y+s, el.x, el.y+s-r); ctx.lineTo(el.x, el.y+r); ctx.quadraticCurveTo(el.x, el.y, el.x+r, el.y);
        ctx.closePath(); ctx.clip();
      }
      ctx.fillStyle = '#5865F2';
      ctx.fillRect(el.x, el.y, s, s);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold ' + Math.floor(s*0.45) + 'px ' + (el.fontFamily || 'sans-serif');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mock.username.charAt(0).toUpperCase(), el.x + s/2, el.y + s/2);
      ctx.restore();
      if (el.borderColor && el.borderWidth) {
        ctx.save(); ctx.strokeStyle = el.borderColor; ctx.lineWidth = el.borderWidth;
        if (el.shape === 'circle') { ctx.beginPath(); ctx.arc(el.x+s/2, el.y+s/2, s/2 + el.borderWidth/2, 0, Math.PI*2); ctx.stroke(); }
        else { ctx.strokeRect(el.x - el.borderWidth/2, el.y - el.borderWidth/2, s + el.borderWidth, s + el.borderWidth); }
        ctx.restore();
      }
    } else if (el.type === 'text') {
      let txt = (el.text || '').replace(/{username}/g, mock.username).replace(/{discriminator}/g, mock.discriminator).replace(/{membercount}/g, mock.memberCount);
      ctx.save();
      ctx.fillStyle = el.color || '#FFFFFF';
      ctx.font = (el.bold ? 'bold ' : '') + (el.fontSize || 30) + 'px ' + (el.fontFamily || 'sans-serif');
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(txt, el.x, el.y);
      ctx.restore();
    }
  }

  // Draw selection
  if (selectedEl) {
    const sel = selectedEl;
    const scale = getCanvasScale();
    const box = els.selectionBox;
    let bx, by, bw, bh;
    if (sel.type === 'avatar') {
      bx = sel.x * scale; by = sel.y * scale; bw = sel.size * scale; bh = sel.size * scale;
    } else {
      ctx.font = (sel.bold ? 'bold ' : '') + (sel.fontSize || 30) + 'px ' + (sel.fontFamily || 'sans-serif');
      let txt = (sel.text || '').replace(/{username}/g, mock.username).replace(/{discriminator}/g, mock.discriminator).replace(/{membercount}/g, mock.memberCount);
      const metrics = ctx.measureText(txt);
      bx = sel.x * scale; by = sel.y * scale; bw = metrics.width * scale; bh = (sel.fontSize || 30) * scale;
    }
    box.style.display = 'block';
    box.style.left = bx + 'px';
    box.style.top = by + 'px';
    box.style.width = bw + 'px';
    box.style.height = bh + 'px';
  } else {
    els.selectionBox.style.display = 'none';
  }
}

function getElementAt(x, y) {
  const scale = getCanvasScale();
  const canvasX = x / scale;
  const canvasY = y / scale;
  const elements = config.entrada.image.elements || [];

  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (!el || el.visible === false) continue;
    if (el.type === 'avatar') {
      if (canvasX >= el.x && canvasX <= el.x + el.size && canvasY >= el.y && canvasY <= el.y + el.size) return el;
    } else if (el.type === 'text') {
      editorCtx.font = (el.bold ? 'bold ' : '') + (el.fontSize || 30) + 'px ' + (el.fontFamily || 'sans-serif');
      const txt = (el.text || '').replace(/{username}/g, 'TestUser').replace(/{discriminator}/g, '1234').replace(/{membercount}/g, '514');
      const metrics = editorCtx.measureText(txt);
      if (canvasX >= el.x && canvasX <= el.x + metrics.width && canvasY >= el.y && canvasY <= el.y + (el.fontSize || 30)) return el;
    }
  }
  return null;
}

function selectElement(el) {
  selectedEl = el;
  if (!el) {
    els.propForm.style.display = 'none';
    els.noSel.style.display = 'block';
    els.selectionBox.style.display = 'none';
    return;
  }
  els.noSel.style.display = 'none';
  els.propForm.style.display = 'block';
  els.pId.value = el.id;
  els.pType.value = el.type;
  els.pText.value = el.text || '';
  els.pX.value = el.x;
  els.pY.value = el.y;
  els.pSize.value = el.size || el.fontSize || 30;
  els.pBorderW.value = el.borderWidth || 0;
  els.pColor.value = el.color || '#FFFFFF';
  els.pBorderColor.value = el.borderColor || '#FFFFFF';
  els.pFont.value = el.fontFamily || 'sans-serif';
  els.pShape.value = el.shape || 'circle';
  els.pBold.checked = el.bold || false;
  els.pVisible.checked = el.visible !== false;
  drawEditor();
}

function initEditor() {
  const canvas = els.editorCanvas;

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = getCanvasScale();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const el = getElementAt(x, y);
    if (el) {
      selectElement(el);
      isDragging = true;
      dragOffset.x = x / scale - el.x;
      dragOffset.y = y / scale - el.y;
    } else {
      selectElement(null);
    }
    drawEditor();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !selectedEl) return;
    const rect = canvas.getBoundingClientRect();
    const scale = getCanvasScale();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    selectedEl.x = Math.round((x / scale) - dragOffset.x);
    selectedEl.y = Math.round((y / scale) - dragOffset.y);
    els.pX.value = selectedEl.x;
    els.pY.value = selectedEl.y;
    drawEditor();
    drawPreview();
    updateExport();
  });

  canvas.addEventListener('mouseup', () => { isDragging = false; });
  canvas.addEventListener('mouseleave', () => { isDragging = false; });

  // Prop changes
  const propInputs = [els.pText, els.pX, els.pY, els.pSize, els.pBorderW, els.pColor, els.pBorderColor, els.pFont, els.pShape];
  propInputs.forEach(inp => {
    inp.addEventListener('input', () => {
      if (!selectedEl) return;
      selectedEl.text = els.pText.value;
      selectedEl.x = parseInt(els.pX.value) || 0;
      selectedEl.y = parseInt(els.pY.value) || 0;
      if (selectedEl.type === 'avatar') selectedEl.size = parseInt(els.pSize.value) || 180;
      else selectedEl.fontSize = parseInt(els.pSize.value) || 30;
      selectedEl.borderWidth = parseInt(els.pBorderW.value) || 0;
      selectedEl.color = els.pColor.value;
      selectedEl.borderColor = els.pBorderColor.value;
      selectedEl.fontFamily = els.pFont.value;
      selectedEl.shape = els.pShape.value;
      drawEditor();
      drawPreview();
      updateExport();
    });
  });

  els.pBold.addEventListener('change', () => {
    if (selectedEl) { selectedEl.bold = els.pBold.checked; drawEditor(); drawPreview(); updateExport(); }
  });
  els.pVisible.addEventListener('change', () => {
    if (selectedEl) { selectedEl.visible = els.pVisible.checked; drawEditor(); drawPreview(); updateExport(); }
  });

  // Buttons
  document.getElementById('addText').addEventListener('click', () => {
    const newId = 'text_' + Date.now();
    config.entrada.image.elements.push({
      id: newId, type: 'text', x: 400, y: 250,
      text: 'Novo Texto', fontSize: 30, fontFamily: 'sans-serif',
      color: '#FFFFFF', bold: false, visible: true
    });
    selectElement(config.entrada.image.elements[config.entrada.image.elements.length - 1]);
    drawEditor();
    drawPreview();
    updateExport();
  });

  document.getElementById('delEl').addEventListener('click', () => {
    if (!selectedEl) return;
    const idx = config.entrada.image.elements.findIndex(e => e.id === selectedEl.id);
    if (idx > -1) {
      config.entrada.image.elements.splice(idx, 1);
      selectElement(null);
      drawEditor();
      drawPreview();
      updateExport();
    }
  });

  document.getElementById('resetPos').addEventListener('click', () => {
    config.entrada.image.elements = JSON.parse(JSON.stringify(defaultConfig.entrada.image.elements));
    selectElement(null);
    drawEditor();
    drawPreview();
    updateExport();
  });
}

// ============ EXPORT / EVENTS ============
function updateExport() {
  els.exportArea.value = JSON.stringify(config, null, 2);
}

function showToast(msg, type) {
  els.toast.textContent = msg;
  els.toast.className = 'toast show ' + (type || 'success');
  setTimeout(() => els.toast.classList.remove('show'), 3000);
}

async function checkBotStatus() {
  try {
    const r = await fetch(API + '/api/bot-status');
    const data = await r.json();
    if (data.online) {
      els.statusBar.className = 'status-bar online';
      els.botStatus.innerHTML = '✅ Bot conectado: <strong>' + data.username + '</strong>';
    } else {
      els.statusBar.className = 'status-bar offline';
      els.botStatus.textContent = '❌ Bot offline: ' + (data.error || 'Token invalido');
    }
  } catch {
    els.statusBar.className = 'status-bar offline';
    els.botStatus.textContent = '❌ Backend offline';
  }
}

function initEvents() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(inp => {
    if (inp.id.startsWith('p')) return;
    inp.addEventListener('input', () => { readFromUI(); updatePreviews(); updateExport(); });
  });

  els.entOverlayOp.addEventListener('input', () => {
    els.opVal.textContent = els.entOverlayOp.value + '%';
    readFromUI(); updatePreviews(); updateExport();
  });

  document.getElementById('btnSave').addEventListener('click', async () => {
    readFromUI();
    try {
      const r = await fetch(API + '/api/save-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config)
      });
      if (r.ok) { showToast('✅ Configuracoes guardadas!'); }
      else { localStorage.setItem('pacConfig', JSON.stringify(config)); showToast('⚠️ Guardado localmente', 'warn'); }
    } catch {
      localStorage.setItem('pacConfig', JSON.stringify(config));
      showToast('⚠️ Guardado localmente', 'warn');
    }
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (!confirm('Tens a certeza?')) return;
    config = JSON.parse(JSON.stringify(defaultConfig));
    applyToUI();
    selectElement(null);
    drawEditor();
    showToast('Configuracoes resetadas!');
  });

  document.getElementById('btnTestEntrada').addEventListener('click', async () => {
    readFromUI();
    const btn = document.getElementById('btnTestEntrada');
    btn.textContent = '⏳ A enviar...'; btn.disabled = true;
    try {
      const r = await fetch(API + '/api/test-welcome', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mockUsername: els.entTestUser.value || 'TestUser' })
      });
      const data = await r.json();
      if (data.success) showToast('✅ ' + data.message);
      else showToast('❌ Erro: ' + (data.error || 'Desconhecido'), 'error');
    } catch { showToast('❌ Backend offline', 'error'); }
    btn.textContent = '🧪 Enviar Teste no Discord'; btn.disabled = false;
  });

  document.getElementById('btnTestSaida').addEventListener('click', async () => {
    readFromUI();
    const btn = document.getElementById('btnTestSaida');
    btn.textContent = '⏳ A enviar...'; btn.disabled = true;
    try {
      const r = await fetch(API + '/api/test-leave', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, mockUsername: els.saiTestUser.value || 'TestUser' })
      });
      const data = await r.json();
      if (data.success) showToast('✅ ' + data.message);
      else showToast('❌ Erro: ' + (data.error || 'Desconhecido'), 'error');
    } catch { showToast('❌ Backend offline', 'error'); }
    btn.textContent = '🧪 Enviar Teste no Discord'; btn.disabled = false;
  });

  document.getElementById('btnCopy').addEventListener('click', () => {
    els.exportArea.select(); document.execCommand('copy'); showToast('📋 JSON copiado!');
  });

  document.getElementById('btnImport').addEventListener('click', () => {
    try {
      const data = JSON.parse(els.importArea.value);
      config = mergeDeep(JSON.parse(JSON.stringify(defaultConfig)), data);
      applyToUI();
      selectElement(null);
      drawEditor();
      showToast('📥 Config importada!');
    } catch { showToast('❌ JSON invalido!', 'error'); }
  });
}

// ============ INIT ============
initTabs();
initEvents();
initEditor();
loadConfig();
checkBotStatus();
setInterval(checkBotStatus, 30000);
