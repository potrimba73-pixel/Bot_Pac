/* ========== DEFAULT CONFIG ========== */
const DEFAULT_CONFIG = {
  welcome: {
    enabled: true,
    channelId: "1146439899063529582",
    message: "Entrou um novo membro, {user} !! Diverte-te connosco, mas segue as {rules}! Agora ha **{membercount}** membros! 💪",
    useEmbed: true,
    embedColor: "#57F287",
    imageEnabled: true,
    bgImage: "",
    welcomeText: "Bem-Vindo a Portugal Alfa Community",
    layout: "classic",
    avatarShape: "circle",
    usernameColor: "#FFFFFF",
    welcomeColor: "#FFD700",
    avatarBorderColor: "#FFFFFF",
    overlayColor: "#000000",
    overlayOpacity: 35
  },
  leave: {
    enabled: true,
    channelId: "1146439899063529582",
    message: "Oh, o **{username}** saiu do servidor 😔, faz boa viagem! Ainda restam **{membercount}** membros.",
    useEmbed: true,
    embedColor: "#2F3136"
  },
  placeholders: [
    { key: "{user}", desc: "Mencao ao membro (@user)" },
    { key: "{username}", desc: "Nome do utilizador" },
    { key: "{userid}", desc: "ID do utilizador" },
    { key: "{membercount}", desc: "Numero total de membros" },
    { key: "{server}", desc: "Nome do servidor" },
    { key: "{rules}", desc: "Mencao ao canal de regras" }
  ]
};

/* ========== STATE ========== */
let config = {};

/* ========== INIT ========== */
function init() {
  const saved = localStorage.getItem("pac_dashboard_config");
  try {
    config = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  } catch {
    config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  fillForm();
  updatePreview();
  fillPlaceholders();
  updateExport();
}

/* ========== TABS ========== */
function switchTab(tab) {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add("active");
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");

  const titles = {
    welcome: ["Entrada", "Configura a mensagem de boas-vindas com imagem gerada"],
    leave: ["Saida", "Configura a mensagem quando um membro sai do servidor"],
    placeholders: ["Placeholders", "Codigos especiais para usar nas mensagens"],
    export: ["Exportar / Importar", "Guarda ou restaura as tuas configuracoes"]
  };
  document.getElementById("page-title").textContent = titles[tab][0];
  document.getElementById("page-desc").textContent = titles[tab][1];
}

/* ========== FILL FORM ========== */
function fillForm() {
  const w = config.welcome;
  setVal("w-enabled", w.enabled);
  setVal("w-channel", w.channelId);
  setVal("w-message", w.message);
  setVal("w-embed", w.useEmbed);
  setVal("w-embed-color", w.embedColor);
  setVal("w-image-enabled", w.imageEnabled);
  setVal("w-bg-image", w.bgImage);
  setVal("w-welcome-text", w.welcomeText);
  setVal("w-layout", w.layout);
  setVal("w-avatar-shape", w.avatarShape);
  setVal("w-username-color", w.usernameColor);
  setVal("w-welcome-color", w.welcomeColor);
  setVal("w-border-color", w.avatarBorderColor);
  setVal("w-overlay-color", w.overlayColor);
  setVal("w-overlay-opacity", w.overlayOpacity);
  document.getElementById("w-overlay-val").textContent = w.overlayOpacity + "%";
  document.getElementById("w-embed-color-val").textContent = w.embedColor;

  const l = config.leave;
  setVal("l-enabled", l.enabled);
  setVal("l-channel", l.channelId);
  setVal("l-message", l.message);
  setVal("l-embed", l.useEmbed);
  setVal("l-embed-color", l.embedColor);
  document.getElementById("l-embed-color-val").textContent = l.embedColor;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === "checkbox") el.checked = !!val;
  else el.value = val ?? "";
}

/* ========== UPDATE PREVIEW ========== */
function updatePreview() {
  // Welcome text
  const msg = document.getElementById("w-message").value || "";
  document.getElementById("preview-text").innerHTML = escapeHtml(msg)
    .replace(/{user}/g, '<span style="color:#5865F2;">@user</span>')
    .replace(/{username}/g, "Username")
    .replace(/{userid}/g, "123456789")
    .replace(/{membercount}/g, "514")
    .replace(/{server}/g, "Portugal Alfa Community")
    .replace(/{rules}/g, "#regras")
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Embed color
  const embedColor = document.getElementById("w-embed-color").value;
  document.getElementById("preview-embed-color").style.background = embedColor;
  document.getElementById("w-embed-color-val").textContent = embedColor;

  // Image preview
  const imgEnabled = document.getElementById("w-image-enabled").checked;
  const imgBox = document.getElementById("preview-img-box");
  imgBox.style.display = imgEnabled ? "block" : "none";

  if (imgEnabled) {
    const fakeImg = document.getElementById("preview-fake-img");
    const bgUrl = document.getElementById("w-bg-image").value;
    const opacity = document.getElementById("w-overlay-opacity").value / 100;
    const overlayColor = document.getElementById("w-overlay-color").value;

    const baseBg = bgUrl
      ? `url('${bgUrl}') center/cover`
      : `linear-gradient(135deg, #1e1b4b, #312e81)`;
    fakeImg.style.background = `linear-gradient(${hexToRgba(overlayColor, opacity)}, ${hexToRgba(overlayColor, opacity)}), ${baseBg}`;

    // Avatar shape
    const shape = document.getElementById("w-avatar-shape").value;
    const avatar = document.getElementById("preview-fake-avatar");
    if (shape === "circle") avatar.style.borderRadius = "50%";
    else if (shape === "rounded") avatar.style.borderRadius = "20px";
    else avatar.style.borderRadius = "4px";

    // Colors
    document.getElementById("preview-fake-name").style.color = document.getElementById("w-username-color").value;
    document.getElementById("preview-fake-welcome").style.color = document.getElementById("w-welcome-color").value;
    avatar.style.borderColor = document.getElementById("w-border-color").value;
    document.getElementById("preview-fake-welcome").textContent = document.getElementById("w-welcome-text").value;
  }

  // Leave preview
  const lMsg = document.getElementById("l-message").value || "";
  document.getElementById("preview-leave-text").innerHTML = escapeHtml(lMsg)
    .replace(/{username}/g, "Username")
    .replace(/{userid}/g, "123456789")
    .replace(/{membercount}/g, "513")
    .replace(/{server}/g, "Portugal Alfa Community")
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  const leaveColor = document.getElementById("l-embed-color").value;
  document.getElementById("preview-leave-color").style.background = leaveColor;
  document.getElementById("l-embed-color-val").textContent = leaveColor;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateRange(el) {
  document.getElementById("w-overlay-val").textContent = el.value + "%";
}

/* ========== PLACEHOLDERS ========== */
function fillPlaceholders() {
  const grid = document.getElementById("placeholders-grid");
  grid.innerHTML = "";
  (config.placeholders || []).forEach(ph => {
    const div = document.createElement("div");
    div.className = "ph-card";
    div.innerHTML = `<span class="ph-key">${ph.key}</span><span class="ph-desc">${ph.desc}</span>`;
    grid.appendChild(div);
  });
}

/* ========== SAVE ========== */
function saveConfig() {
  config.welcome = {
    enabled: document.getElementById("w-enabled").checked,
    channelId: document.getElementById("w-channel").value,
    message: document.getElementById("w-message").value,
    useEmbed: document.getElementById("w-embed").checked,
    embedColor: document.getElementById("w-embed-color").value,
    imageEnabled: document.getElementById("w-image-enabled").checked,
    bgImage: document.getElementById("w-bg-image").value,
    welcomeText: document.getElementById("w-welcome-text").value,
    layout: document.getElementById("w-layout").value,
    avatarShape: document.getElementById("w-avatar-shape").value,
    usernameColor: document.getElementById("w-username-color").value,
    welcomeColor: document.getElementById("w-welcome-color").value,
    avatarBorderColor: document.getElementById("w-border-color").value,
    overlayColor: document.getElementById("w-overlay-color").value,
    overlayOpacity: parseInt(document.getElementById("w-overlay-opacity").value)
  };
  config.leave = {
    enabled: document.getElementById("l-enabled").checked,
    channelId: document.getElementById("l-channel").value,
    message: document.getElementById("l-message").value,
    useEmbed: document.getElementById("l-embed").checked,
    embedColor: document.getElementById("l-embed-color").value
  };

  localStorage.setItem("pac_dashboard_config", JSON.stringify(config));
  updateExport();
  showToast("✅ Configuracoes guardadas no navegador!");

  const status = document.getElementById("save-status");
  status.textContent = "Guardado!";
  setTimeout(() => status.textContent = "", 2000);
}

/* ========== EXPORT / IMPORT ========== */
function updateExport() {
  document.getElementById("export-json").value = JSON.stringify(config, null, 2);
}

function copyExport() {
  const el = document.getElementById("export-json");
  el.select();
  document.execCommand("copy");
  showToast("📋 JSON copiado para a clipboard!");
}

function importConfig() {
  const raw = document.getElementById("import-json").value.trim();
  if (!raw) return showToast("❌ Cole um JSON primeiro!", true);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.welcome || !parsed.leave) throw new Error("JSON invalido");
    config = parsed;
    localStorage.setItem("pac_dashboard_config", JSON.stringify(config));
    fillForm();
    updatePreview();
    fillPlaceholders();
    updateExport();
    showToast("✅ Configuracoes importadas com sucesso!");
  } catch (e) {
    showToast("❌ JSON invalido! Verifica o formato.", true);
  }
}

/* ========== TOAST ========== */
function showToast(msg, isError) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast" + (isError ? " error" : "");
  setTimeout(() => toast.classList.add("hidden"), 3000);
}

/* ========== START ========== */
init();
