const DEFAULT_CONFIG = {
  welcome: {
    enabled: true, channelId: "1146439899063529582",
    message: "Entrou um novo membro, {user} !! Diverte-te connosco, mas segue as {rules}! Agora ha **{membercount}** membros! 💪",
    useEmbed: true, embedColor: "#57F287",
    canvas: { width: 1024, height: 500, bgImage: "", bgColor: "#1a1a2e", overlayColor: "#000000", overlayOpacity: 35 },
    elements: [
      { id: "avatar", type: "avatar", enabled: true, x: 180, y: 250, width: 180, height: 180, shape: "circle", borderColor: "#FFFFFF", borderWidth: 6 },
      { id: "username", type: "text", enabled: true, x: 400, y: 220, text: "{username}", fontSize: 55, fontWeight: "bold", color: "#FFFFFF", fontFamily: "sans-serif" },
      { id: "discriminator", type: "text", enabled: true, x: 400, y: 265, text: "#{discriminator}", fontSize: 30, fontWeight: "normal", color: "#CCCCCC", fontFamily: "sans-serif" },
      { id: "welcome", type: "text", enabled: true, x: 400, y: 330, text: "Bem-Vindo a", fontSize: 38, fontWeight: "bold", color: "#FFD700", fontFamily: "sans-serif" },
      { id: "welcome2", type: "text", enabled: true, x: 400, y: 375, text: "Portugal Alfa Community", fontSize: 38, fontWeight: "bold", color: "#FFD700", fontFamily: "sans-serif" },
      { id: "membercount", type: "text", enabled: true, x: 400, y: 420, text: "Membro nº {membercount}", fontSize: 28, fontWeight: "normal", color: "#AAAAAA", fontFamily: "sans-serif" }
    ]
  },
  leave: { enabled: true, channelId: "1146439899063529582", message: "Oh, o **{username}** saiu do servidor 😔, faz boa viagem! Ainda restam **{membercount}** membros.", useEmbed: true, embedColor: "#2F3136" },
  placeholders: [
    { key: "{user}", desc: "Mencao ao membro (@user)" },
    { key: "{username}", desc: "Nome do utilizador" },
    { key: "{discriminator}", desc: "Tag #0000" },
    { key: "{userid}", desc: "ID do utilizador" },
    { key: "{membercount}", desc: "Numero total de membros" },
    { key: "{server}", desc: "Nome do servidor" },
    { key: "{rules}", desc: "Mencao ao canal de regras" }
  ]
};

let config = {};
let selectedElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let elementCounter = 0;

/* ========== INIT ========== */
async function init() {
  await checkBotStatus();
  await loadConfig();
  fillForm();
  updatePreview();
  fillPlaceholders();
  updateExport();
  initCanvasEditor();
}

async function checkBotStatus() {
  const bar = document.getElementById("bot-status-bar");
  const icon = document.getElementById("bot-status-icon");
  const text = document.getElementById("bot-status-text");
  try {
    const res = await fetch("/api/bot/status");
    const data = await res.json();
    if (data.connected) { bar.className = "bot-status-bar connected"; icon.textContent = "✅"; text.textContent = `Bot: ${data.bot.username}`; }
    else { bar.className = "bot-status-bar error"; icon.textContent = "❌"; text.textContent = `Bot: ${data.error}`; }
  } catch { bar.className = "bot-status-bar error"; icon.textContent = "❌"; text.textContent = "Servidor offline"; }
}

async function loadConfig() {
  try { const res = await fetch("/api/config"); config = await res.json(); }
  catch { config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); }
}

/* ========== TABS ========== */
function switchTab(tab) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add("active");
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  const titles = { welcome: ["Entrada", "Configura a mensagem de boas-vindas"], leave: ["Saida", "Configura a mensagem de saida"], editor: ["Editor Visual", "Arrasta e edita elementos na imagem"], placeholders: ["Placeholders", "Codigos especiais para as mensagens"], export: ["Exportar / Importar", "Guarda ou restaura configuracoes"] };
  document.getElementById("page-title").textContent = titles[tab][0];
  document.getElementById("page-desc").textContent = titles[tab][1];
  document.getElementById("btn-test-welcome").classList.toggle("hidden", tab !== "welcome");
  document.getElementById("btn-test-leave").classList.toggle("hidden", tab !== "leave");
  document.getElementById("btn-preview-img").classList.toggle("hidden", tab !== "editor");
  if (tab === "editor") renderCanvas();
}

/* ========== FILL FORM ========== */
function fillForm() {
  const w = config.welcome;
  setVal("w-enabled", w.enabled);
  setVal("w-channel", w.channelId);
  setVal("w-message", w.message);
  setVal("w-embed", w.useEmbed);
  setVal("w-embed-color", w.embedColor);
  setVal("w-bg-image", w.canvas?.bgImage || "");
  setVal("w-bg-color", w.canvas?.bgColor || "#1a1a2e");
  setVal("w-overlay-color", w.canvas?.overlayColor || "#000000");
  setVal("w-overlay-opacity", w.canvas?.overlayOpacity ?? 35);
  setVal("canvas-width", w.canvas?.width || 1024);
  setVal("canvas-height", w.canvas?.height || 500);
  document.getElementById("w-overlay-val").textContent = (w.canvas?.overlayOpacity ?? 35) + "%";
  document.getElementById("w-embed-color-val").textContent = w.embedColor;
  const l = config.leave;
  setVal("l-enabled", l.enabled);
  setVal("l-channel", l.channelId);
  setVal("l-message", l.message);
  setVal("l-embed", l.useEmbed);
  setVal("l-embed-color", l.embedColor);
  document.getElementById("l-embed-color-val").textContent = l.embedColor;
}
function setVal(id, val) { const el = document.getElementById(id); if (!el) return; if (el.type === "checkbox") el.checked = !!val; else el.value = val ?? ""; }

/* ========== CANVAS EDITOR ========== */
function initCanvasEditor() {
  const canvas = document.getElementById("editor-canvas");
  canvas.addEventListener("mousedown", onCanvasMouseDown);
  canvas.addEventListener("mousemove", onCanvasMouseMove);
  canvas.addEventListener("mouseup", onCanvasMouseUp);
  canvas.addEventListener("mouseleave", onCanvasMouseUp);
}

function renderCanvas() {
  const canvas = document.getElementById("editor-canvas");
  const ctx = canvas.getContext("2d");
  const w = config.welcome;
  const c = w.canvas || { width: 1024, height: 500, bgColor: "#1a1a2e", overlayColor: "#000000", overlayOpacity: 35 };
  canvas.width = c.width; canvas.height = c.height;
  ctx.fillStyle = c.bgColor || "#1a1a2e"; ctx.fillRect(0, 0, c.width, c.height);
  const opacity = (c.overlayOpacity ?? 35) / 100;
  ctx.fillStyle = c.overlayColor || "#000000"; ctx.globalAlpha = opacity; ctx.fillRect(0, 0, c.width, c.height); ctx.globalAlpha = 1;

  (w.elements || []).forEach(el => {
    if (!el.enabled) return;
    if (el.type === "avatar") {
      const rx = el.width / 2, ry = el.height / 2;
      ctx.save(); ctx.translate(el.x, el.y);
      if (el.shape === "circle") { ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); }
      else if (el.shape === "rounded") { const r = 20; ctx.beginPath(); ctx.moveTo(-rx + r, -ry); ctx.lineTo(rx - r, -ry); ctx.quadraticCurveTo(rx, -ry, rx, -ry + r); ctx.lineTo(rx, ry - r); ctx.quadraticCurveTo(rx, ry, rx - r, ry); ctx.lineTo(-rx + r, ry); ctx.quadraticCurveTo(-rx, ry, -rx, ry - r); ctx.lineTo(-rx, -ry + r); ctx.quadraticCurveTo(-rx, -ry, -rx + r, -ry); ctx.closePath(); ctx.clip(); }
      else { ctx.beginPath(); ctx.rect(-rx, -ry, el.width, el.height); ctx.closePath(); ctx.clip(); }
      ctx.fillStyle = "#5865F2"; ctx.fillRect(-rx, -ry, el.width, el.height); ctx.restore();
      if (el.borderWidth > 0) { ctx.save(); ctx.translate(el.x, el.y); ctx.beginPath(); if (el.shape === "circle") ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); else if (el.shape === "rounded") { const r = 20; ctx.moveTo(-rx + r, -ry); ctx.lineTo(rx - r, -ry); ctx.quadraticCurveTo(rx, -ry, rx, -ry + r); ctx.lineTo(rx, ry - r); ctx.quadraticCurveTo(rx, ry, rx - r, ry); ctx.lineTo(-rx + r, ry); ctx.quadraticCurveTo(-rx, ry, -rx, ry - r); ctx.lineTo(-rx, -ry + r); ctx.quadraticCurveTo(-rx, -ry, -rx + r, -ry); } else ctx.rect(-rx, -ry, el.width, el.height); ctx.closePath(); ctx.lineWidth = el.borderWidth; ctx.strokeStyle = el.borderColor; ctx.stroke(); ctx.restore(); }
    } else if (el.type === "text") {
      let text = el.text.replace(/{username}/g, "Username").replace(/{discriminator}/g, "0000").replace(/{membercount}/g, "514");
      ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
      ctx.fillStyle = el.color; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(text, el.x, el.y);
    }
  });

  if (selectedElement) {
    const el = selectedElement;
    ctx.save(); ctx.strokeStyle = "#5865F2"; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    if (el.type === "avatar") ctx.strokeRect(el.x - el.width/2 - 4, el.y - el.height/2 - 4, el.width + 8, el.height + 8);
    else { ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`; const metrics = ctx.measureText(el.text.replace(/{.*?}/g, "Username")); ctx.strokeRect(el.x - 4, el.y - el.fontSize/2 - 4, metrics.width + 8, el.fontSize + 8); }
    ctx.restore();
  }
  updateElementsList();
}

function onCanvasMouseDown(e) {
  const canvas = document.getElementById("editor-canvas");
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const elements = [...(config.welcome.elements || [])].reverse();
  for (const el of elements) {
    if (!el.enabled) continue;
    let hit = false;
    if (el.type === "avatar") hit = x >= el.x - el.width/2 && x <= el.x + el.width/2 && y >= el.y - el.height/2 && y <= el.y + el.height/2;
    else { ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`; const metrics = ctx.measureText(el.text.replace(/{.*?}/g, "Username")); hit = x >= el.x && x <= el.x + metrics.width && y >= el.y - el.fontSize/2 && y <= el.y + el.fontSize/2; }
    if (hit) { selectedElement = el; isDragging = true; dragOffset = { x: x - el.x, y: y - el.y }; renderCanvas(); showProperties(el); return; }
  }
  selectedElement = null; renderCanvas();
  document.getElementById("properties-content").innerHTML = '<p class="panel-subtitle">Seleciona um elemento no canvas para editar.</p>';
}

function onCanvasMouseMove(e) {
  if (!isDragging || !selectedElement) return;
  const canvas = document.getElementById("editor-canvas");
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  selectedElement.x = Math.round((e.clientX - rect.left) * scaleX - dragOffset.x);
  selectedElement.y = Math.round((e.clientY - rect.top) * scaleY - dragOffset.y);
  renderCanvas(); updatePropertiesInputs();
}
function onCanvasMouseUp() { isDragging = false; }

function updateElementsList() {
  const list = document.getElementById("elements-list");
  if (!list) return;
  list.innerHTML = "";
  (config.welcome.elements || []).forEach(el => {
    const div = document.createElement("div");
    div.className = "element-item" + (selectedElement?.id === el.id ? " selected" : "");
    div.innerHTML = `<span class="el-icon">${el.type === "avatar" ? "👤" : "T"}</span><span class="el-name">${el.id}</span><span class="el-type">${el.type}</span>`;
    div.onclick = () => { selectedElement = el; renderCanvas(); showProperties(el); };
    list.appendChild(div);
  });
}

function showProperties(el) {
  const container = document.getElementById("properties-content");
  let html = `<div class="prop-group"><label>ID</label><div class="prop-full"><input type="text" value="${el.id}" onchange="updateElementProp('id', this.value)"></div></div>`;
  html += `<div class="prop-group"><label>Posicao</label><div class="prop-row"><input type="number" value="${el.x}" id="prop-x" placeholder="X" onchange="updateElementProp('x', parseInt(this.value))"><input type="number" value="${el.y}" id="prop-y" placeholder="Y" onchange="updateElementProp('y', parseInt(this.value))"></div></div>`;
  if (el.type === "avatar") {
    html += `<div class="prop-group"><label>Tamanho</label><div class="prop-row"><input type="number" value="${el.width}" placeholder="Largura" onchange="updateElementProp('width', parseInt(this.value))"><input type="number" value="${el.height}" placeholder="Altura" onchange="updateElementProp('height', parseInt(this.value))"></div></div>`;
    html += `<div class="prop-group"><label>Forma</label><div class="prop-full"><select onchange="updateElementProp('shape', this.value)"><option value="circle" ${el.shape === "circle" ? "selected" : ""}>Circulo</option><option value="rounded" ${el.shape === "rounded" ? "selected" : ""}>Arredondado</option><option value="square" ${el.shape === "square" ? "selected" : ""}>Quadrado</option></select></div></div>`;
    html += `<div class="prop-group"><label>Borda</label><div class="prop-row"><input type="color" value="${el.borderColor}" onchange="updateElementProp('borderColor', this.value)"><input type="number" value="${el.borderWidth}" placeholder="Largura" onchange="updateElementProp('borderWidth', parseInt(this.value))"></div></div>`;
  } else if (el.type === "text") {
    html += `<div class="prop-group"><label>Texto</label><div class="prop-full"><input type="text" value="${el.text}" onchange="updateElementProp('text', this.value)"></div></div>`;
    html += `<div class="prop-group"><label>Fonte</label><div class="prop-row"><input type="number" value="${el.fontSize}" placeholder="Tamanho" onchange="updateElementProp('fontSize', parseInt(this.value))"><select onchange="updateElementProp('fontWeight', this.value)"><option value="normal" ${el.fontWeight === "normal" ? "selected" : ""}>Normal</option><option value="bold" ${el.fontWeight === "bold" ? "selected" : ""}>Bold</option></select></div></div>`;
    html += `<div class="prop-group"><label>Cor</label><div class="prop-full"><input type="color" value="${el.color}" onchange="updateElementProp('color', this.value)"></div></div>`;
  }
  html += `<div class="prop-group"><label class="switch-label"><span>Ativo</span><label class="switch"><input type="checkbox" ${el.enabled ? "checked" : ""} onchange="updateElementProp('enabled', this.checked)"><span class="slider"></span></label></label></div>`;
  container.innerHTML = html;
}

function updateElementProp(key, value) { if (!selectedElement) return; selectedElement[key] = value; renderCanvas(); if (key === "id") updateElementsList(); }
function updatePropertiesInputs() { const x = document.getElementById("prop-x"); const y = document.getElementById("prop-y"); if (x) x.value = selectedElement.x; if (y) y.value = selectedElement.y; }

function addTextElement() { elementCounter++; config.welcome.elements.push({ id: `texto_${elementCounter}`, type: "text", enabled: true, x: 512, y: 250, text: "Novo Texto", fontSize: 30, fontWeight: "bold", color: "#FFFFFF", fontFamily: "sans-serif" }); renderCanvas(); }
function addAvatarElement() { elementCounter++; config.welcome.elements.push({ id: `avatar_${elementCounter}`, type: "avatar", enabled: true, x: 512, y: 250, width: 120, height: 120, shape: "circle", borderColor: "#FFFFFF", borderWidth: 4 }); renderCanvas(); }
function deleteSelectedElement() { if (!selectedElement) return showToast("Seleciona um elemento!", true); if (!confirm(`Eliminar "${selectedElement.id}"?`)) return; config.welcome.elements = config.welcome.elements.filter(e => e.id !== selectedElement.id); selectedElement = null; renderCanvas(); document.getElementById("properties-content").innerHTML = '<p class="panel-subtitle">Seleciona um elemento no canvas para editar.</p>'; }

/* ========== CANVAS CONFIG ========== */
function updateCanvasConfig() {
  if (!config.welcome.canvas) config.welcome.canvas = {};
  const c = config.welcome.canvas;
  c.bgImage = document.getElementById("w-bg-image").value;
  c.bgColor = document.getElementById("w-bg-color").value;
  c.overlayColor = document.getElementById("w-overlay-color").value;
  c.overlayOpacity = parseInt(document.getElementById("w-overlay-opacity").value);
  c.width = parseInt(document.getElementById("canvas-width").value) || 1024;
  c.height = parseInt(document.getElementById("canvas-height").value) || 500;
}

/* ========== GENERATE PREVIEW IMAGE ========== */
async function generatePreview() {
  const btn = document.getElementById("btn-preview-img");
  btn.disabled = true; btn.textContent = "⏳ A gerar...";
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canvas: config.welcome.canvas, elements: config.welcome.elements, testUser: { id: "0", username: "TestUser", discriminator: "0000", avatar: null } })
    });
    if (!res.ok) throw new Error("Erro ao gerar");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:99999;";
    modal.innerHTML = `<div style="background:#1a1a1c;padding:20px;border-radius:16px;max-width:90%;max-height:90%;"><h3 style="margin-bottom:12px;font-size:16px;">🖼️ Preview</h3><img src="${url}" style="max-width:100%;max-height:70vh;border-radius:8px;border:1px solid #333;"><div style="margin-top:12px;display:flex;gap:10px;justify-content:center;"><button onclick="this.closest('.modal').remove()" style="background:#5865F2;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;">Fechar</button><a href="${url}" download="welcome-preview.png" style="background:#57F287;color:#0f0f10;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;text-decoration:none;font-weight:600;">📥 Download</a></div></div>`;
    modal.className = "modal"; modal.onclick = (e) => { if (e.target === modal) modal.remove(); }; document.body.appendChild(modal);
    showToast("✅ Imagem gerada!");
  } catch (err) { showToast("❌ " + err.message, true); }
  btn.disabled = false; btn.textContent = "🖼️ Gerar Preview";
}

/* ========== PREVIEW ========== */
function updatePreview() {
  const msg = document.getElementById("w-message").value || "";
  let previewMsg = escapeHtml(msg).replace(/{user}/g, '<span style="color:#5865F2;font-weight:500;">@user</span>').replace(/{username}/g, "Username").replace(/{userid}/g, "123456789").replace(/{membercount}/g, "514").replace(/{server}/g, "Portugal Alfa Community").replace(/{rules}/g, "#regras");
  previewMsg = previewMsg.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const pt = document.getElementById("preview-text"); if (pt) pt.innerHTML = previewMsg;
  const ec = document.getElementById("w-embed-color"); if (ec) { const pec = document.getElementById("preview-embed-color"); if (pec) pec.style.background = ec.value; const ev = document.getElementById("w-embed-color-val"); if (ev) ev.textContent = ec.value; }
  const lMsg = document.getElementById("l-message").value || "";
  let lp = escapeHtml(lMsg).replace(/{username}/g, "Username").replace(/{userid}/g, "123456789").replace(/{membercount}/g, "513").replace(/{server}/g, "Portugal Alfa Community");
  lp = lp.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const plt = document.getElementById("preview-leave-text"); if (plt) plt.innerHTML = lp;
  const lec = document.getElementById("l-embed-color"); if (lec) { const plc = document.getElementById("preview-leave-color"); if (plc) plc.style.background = lec.value; const lev = document.getElementById("l-embed-color-val"); if (lev) lev.textContent = lec.value; }
}
function escapeHtml(text) { const div = document.createElement("div"); div.textContent = text; return div.innerHTML; }
function updateRange(el) { document.getElementById("w-overlay-val").textContent = el.value + "%"; }

/* ========== PLACEHOLDERS ========== */
function fillPlaceholders() {
  const grid = document.getElementById("placeholders-grid"); if (!grid) return;
  grid.innerHTML = "";
  (config.placeholders || []).forEach(ph => { const div = document.createElement("div"); div.className = "ph-card"; div.innerHTML = `<span class="ph-key">${ph.key}</span><span class="ph-desc">${ph.desc}</span>`; grid.appendChild(div); });
}

/* ========== SAVE ========== */
async function saveConfig() {
  updateCanvasConfig();
  config.welcome.enabled = document.getElementById("w-enabled").checked;
  config.welcome.channelId = document.getElementById("w-channel").value;
  config.welcome.message = document.getElementById("w-message").value;
  config.welcome.useEmbed = document.getElementById("w-embed").checked;
  config.welcome.embedColor = document.getElementById("w-embed-color").value;
  config.leave.enabled = document.getElementById("l-enabled").checked;
  config.leave.channelId = document.getElementById("l-channel").value;
  config.leave.message = document.getElementById("l-message").value;
  config.leave.useEmbed = document.getElementById("l-embed").checked;
  config.leave.embedColor = document.getElementById("l-embed-color").value;
  try { await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) }); showToast("✅ Guardado!"); const status = document.getElementById("save-status"); status.textContent = "Guardado!"; setTimeout(() => status.textContent = "", 2000); }
  catch { showToast("❌ Erro ao guardar", true); }
  updateExport();
}
function resetDefaults() { if (!confirm("Tens a certeza?")) return; config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); fillForm(); updatePreview(); fillPlaceholders(); updateExport(); selectedElement = null; renderCanvas(); showToast("🔄 Resetado!"); }

/* ========== TEST ========== */
async function testWelcome() { const btn = document.getElementById("btn-test-welcome"); btn.disabled = true; btn.textContent = "⏳ A enviar..."; try { const res = await fetch("/api/test/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: document.getElementById("w-channel").value }) }); const data = await res.json(); showToast(data.ok ? "✅ Teste enviado!" : "❌ " + data.error, !data.ok); } catch { showToast("❌ Erro de conexao", true); } btn.disabled = false; btn.textContent = "🧪 Testar Entrada"; }
async function testLeave() { const btn = document.getElementById("btn-test-leave"); btn.disabled = true; btn.textContent = "⏳ A enviar..."; try { const res = await fetch("/api/test/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: document.getElementById("l-channel").value }) }); const data = await res.json(); showToast(data.ok ? "✅ Teste enviado!" : "❌ " + data.error, !data.ok); } catch { showToast("❌ Erro de conexao", true); } btn.disabled = false; btn.textContent = "🧪 Testar Saida"; }

/* ========== EXPORT / IMPORT ========== */
function updateExport() { const el = document.getElementById("export-json"); if (el) el.value = JSON.stringify(config, null, 2); }
function copyExport() { const el = document.getElementById("export-json"); if (!el) return; el.select(); document.execCommand("copy"); showToast("📋 Copiado!"); }
function importConfig() { const raw = document.getElementById("import-json").value.trim(); if (!raw) return showToast("❌ Cole um JSON!", true); try { const parsed = JSON.parse(raw); if (!parsed.welcome || !parsed.leave) throw new Error("Invalid"); config = parsed; fillForm(); updatePreview(); fillPlaceholders(); updateExport(); selectedElement = null; renderCanvas(); showToast("✅ Importado!"); } catch { showToast("❌ JSON invalido!", true); } }

/* ========== TOAST ========== */
function showToast(msg, isError) { const toast = document.getElementById("toast"); toast.textContent = msg; toast.className = "toast" + (isError ? " error" : ""); setTimeout(() => toast.classList.add("hidden"), 3000); }

/* ========== START ========== */
init();
