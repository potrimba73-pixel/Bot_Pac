import express from "express";
import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
app.use(express.json({ limit: "10mb" }));
app.use(express.static(join(__dirname, "public")));

const CONFIG_PATH = join(__dirname, "dashboard-config.json");
const BOT_TOKEN = process.env.TOKEN;

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    const defaults = {
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
      leave: { enabled: true, channelId: "1146439899063529582", message: "Oh, o **{username}** saiu do servidor 😔, faz boa viagem! Ainda restam **{membercount}** membros.", useEmbed: true, embedColor: "#2F3136" }
    };
    writeFileSync(CONFIG_PATH, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

function saveConfig(cfg) { writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)); }

app.get("/api/config", (req, res) => res.json(loadConfig()));
app.post("/api/config", (req, res) => { saveConfig(req.body); res.json({ ok: true }); });

app.post("/api/generate-image", async (req, res) => {
  try {
    const { canvas: canvasCfg, elements, testUser } = req.body;
    const canvas = createCanvas(canvasCfg.width, canvasCfg.height);
    const ctx = canvas.getContext("2d");

    if (canvasCfg.bgImage) {
      try { const bg = await loadImage(canvasCfg.bgImage); ctx.drawImage(bg, 0, 0, canvasCfg.width, canvasCfg.height); }
      catch { ctx.fillStyle = canvasCfg.bgColor || "#1a1a2e"; ctx.fillRect(0, 0, canvasCfg.width, canvasCfg.height); }
    } else { ctx.fillStyle = canvasCfg.bgColor || "#1a1a2e"; ctx.fillRect(0, 0, canvasCfg.width, canvasCfg.height); }

    const opacity = (canvasCfg.overlayOpacity ?? 35) / 100;
    ctx.fillStyle = canvasCfg.overlayColor || "#000000";
    ctx.globalAlpha = opacity; ctx.fillRect(0, 0, canvasCfg.width, canvasCfg.height); ctx.globalAlpha = 1;

    for (const el of elements) {
      if (!el.enabled) continue;
      if (el.type === "avatar") {
        ctx.save();
        const rx = el.width / 2, ry = el.height / 2;
        const cx = el.x, cy = el.y;
        if (el.shape === "circle") { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); }
        else if (el.shape === "rounded") { const r = 20; ctx.beginPath(); ctx.moveTo(cx - rx + r, cy - ry); ctx.lineTo(cx + rx - r, cy - ry); ctx.quadraticCurveTo(cx + rx, cy - ry, cx + rx, cy - ry + r); ctx.lineTo(cx + rx, cy + ry - r); ctx.quadraticCurveTo(cx + rx, cy + ry, cx + rx - r, cy + ry); ctx.lineTo(cx - rx + r, cy + ry); ctx.quadraticCurveTo(cx - rx, cy + ry, cx - rx, cy + ry - r); ctx.lineTo(cx - rx, cy - ry + r); ctx.quadraticCurveTo(cx - rx, cy - ry, cx - rx + r, cy - ry); ctx.closePath(); ctx.clip(); }
        else { ctx.beginPath(); ctx.rect(cx - rx, cy - ry, el.width, el.height); ctx.closePath(); ctx.clip(); }
        try { const avatarUrl = testUser?.avatar ? `https://cdn.discordapp.com/avatars/${testUser.id}/${testUser.avatar}.png` : "https://cdn.discordapp.com/embed/avatars/0.png"; const avatar = await loadImage(avatarUrl); ctx.drawImage(avatar, cx - rx, cy - ry, el.width, el.height); }
        catch { ctx.fillStyle = "#5865F2"; ctx.fillRect(cx - rx, cy - ry, el.width, el.height); }
        ctx.restore();
        if (el.borderWidth > 0) { ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); if (el.shape === "circle") ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); else if (el.shape === "rounded") { const r = 20; ctx.moveTo(-rx + r, -ry); ctx.lineTo(rx - r, -ry); ctx.quadraticCurveTo(rx, -ry, rx, -ry + r); ctx.lineTo(rx, ry - r); ctx.quadraticCurveTo(rx, ry, rx - r, ry); ctx.lineTo(-rx + r, ry); ctx.quadraticCurveTo(-rx, ry, -rx, ry - r); ctx.lineTo(-rx, -ry + r); ctx.quadraticCurveTo(-rx, -ry, -rx + r, -ry); } else ctx.rect(-rx, -ry, el.width, el.height); ctx.closePath(); ctx.lineWidth = el.borderWidth; ctx.strokeStyle = el.borderColor; ctx.stroke(); ctx.restore(); }
      } else if (el.type === "text") {
        let text = el.text.replace(/{username}/g, testUser?.username || "Username").replace(/{discriminator}/g, testUser?.discriminator || "0000").replace(/{membercount}/g, "514").replace(/{server}/g, "Portugal Alfa Community");
        ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`;
        ctx.fillStyle = el.color; ctx.textAlign = "left"; ctx.textBaseline = "middle";
        ctx.fillText(text, el.x, el.y);
      }
    }
    const buffer = await canvas.encode("png");
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) { console.error("[Generate]", err); res.status(500).json({ error: err.message }); }
});

app.post("/api/test/welcome", async (req, res) => {
  if (!BOT_TOKEN) return res.status(500).json({ error: "TOKEN nao configurado" });
  const cfg = loadConfig(); const w = cfg.welcome; const channelId = req.body.channelId || w.channelId;
  let msgText = w.message.replace(/{user}/g, "<@849132183112384573>").replace(/{username}/g, "TestUser").replace(/{userid}/g, "849132183112384573").replace(/{membercount}/g, "515").replace(/{server}/g, "Portugal Alfa Community").replace(/{rules}/g, "<#1120317573624512646>");
  try {
    const embed = { description: msgText, color: parseInt(w.embedColor.replace("#", ""), 16) };
    const body = w.useEmbed ? { embeds: [embed] } : { content: msgText };
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { "Authorization": `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err.message }); }
    res.json({ ok: true, message: "Mensagem de teste enviada!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/test/leave", async (req, res) => {
  if (!BOT_TOKEN) return res.status(500).json({ error: "TOKEN nao configurado" });
  const cfg = loadConfig(); const l = cfg.leave; const channelId = req.body.channelId || l.channelId;
  let msgText = l.message.replace(/{username}/g, "TestUser").replace(/{userid}/g, "849132183112384573").replace(/{membercount}/g, "514").replace(/{server}/g, "Portugal Alfa Community");
  try {
    const embed = { description: msgText, color: parseInt(l.embedColor.replace("#", ""), 16) };
    const body = l.useEmbed ? { embeds: [embed] } : { content: msgText };
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { "Authorization": `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err.message }); }
    res.json({ ok: true, message: "Mensagem de saida enviada!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/bot/status", async (req, res) => {
  if (!BOT_TOKEN) return res.json({ connected: false, error: "TOKEN nao configurado" });
  try { const response = await fetch("https://discord.com/api/v10/users/@me", { headers: { "Authorization": `Bot ${BOT_TOKEN}` } }); if (!response.ok) throw new Error("Token invalido"); const bot = await response.json(); res.json({ connected: true, bot: { id: bot.id, username: bot.username, avatar: bot.avatar } }); }
  catch (err) { res.json({ connected: false, error: err.message }); }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.get("*", (req, res) => res.sendFile(join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`[PAC Dashboard Pro] Online em http://localhost:${PORT}`); });
