const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DATA_DIR = path.join(__dirname, "data", "temperature");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const LATEST_FILE = path.join(DATA_DIR, "latest.json");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const RECORDS_FILE = path.join(DATA_DIR, "records.json");

const DEVICE_OFFLINE_MS = Number(process.env.TEMP_DEVICE_OFFLINE_MS || 120000);
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;
const NORMAL_HYSTERESIS = 1;

function ensureFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const defaults = {
    sensors: {
      sensor1: { name: "Датчик 1", min: 5, max: 35, enabled: true },
      sensor2: { name: "Датчик 2", min: 5, max: 35, enabled: true }
    },
    devices: { esp32_1: { name: "ESP32-C3", lastSeen: null, online: false } }
  };
  for (const [file, value] of [
    [SETTINGS_FILE, defaults],
    [LATEST_FILE, {}],
    [HISTORY_FILE, []],
    [RECORDS_FILE, {}]
  ]) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(value, null, 2));
  }
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}
function settings() { return readJson(SETTINGS_FILE, { sensors: {}, devices: {} }); }
function latest() { return readJson(LATEST_FILE, {}); }
function history() { return readJson(HISTORY_FILE, []); }
function records() { return readJson(RECORDS_FILE, {}); }
function nowIso() { return new Date().toISOString(); }
function localTime(value = new Date()) {
  return new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga", dateStyle: "short", timeStyle: "medium"
  }).format(value);
}
let botRef;

async function notify(text) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botRef || !chatId) {
    console.log("Temperature notification skipped: bot/chat not configured");
    return;
  }
  try { await botRef.sendMessage(chatId, text); }
  catch (e) { console.error("Temperature Telegram error:", e.message); }
}

function recordReading(sensorId, value, timestamp) {
  const r = records();
  if (!r[sensorId]) r[sensorId] = { min: null, max: null };
  const time = new Date(timestamp).getTime();
  if (r[sensorId].min === null || value < r[sensorId].min.value)
    r[sensorId].min = { value, at: timestamp };
  if (r[sensorId].max === null || value > r[sensorId].max.value)
    r[sensorId].max = { value, at: timestamp };
  writeJson(RECORDS_FILE, r);
}

async function processReadings(body) {
  ensureFiles();
  const cfg = settings();
  const deviceId = String(body.deviceId || "esp32_1");
  const timestamp = nowIso();
  const incoming = body.sensors && Array.isArray(body.sensors)
    ? Object.fromEntries(body.sensors.map(x => [String(x.id), Number(x.temperature)]))
    : Object.fromEntries(Object.entries(body.readings || {}).map(([k, v]) => [k, Number(v)]));
  if (!Object.keys(incoming).length) throw new Error("No sensor readings supplied");

  const last = latest();
  const hist = history();
  const device = cfg.devices[deviceId] || { name: deviceId, online: false, lastSeen: null };
  const wasOffline = !device.online && device.lastSeen;
  device.lastSeen = timestamp;
  device.online = true;
  cfg.devices[deviceId] = device;

  const messages = [];
  for (const [sensorId, value] of Object.entries(incoming)) {
    if (!Number.isFinite(value) || value < -80 || value > 150) continue;
    const sensorCfg = cfg.sensors[sensorId] || {
      name: sensorId, min: 5, max: 35, enabled: true
    };
    cfg.sensors[sensorId] = sensorCfg;
    const previous = last[sensorId] || {};
    let status = value < Number(sensorCfg.min) ? "low"
      : value > Number(sensorCfg.max) ? "high" : "normal";
    const previousStatus = previous.status || "normal";
    // Add 1 °C hysteresis so readings hovering around a limit do not flap.
    if (previousStatus === "low" && value < Number(sensorCfg.min) + NORMAL_HYSTERESIS) status = "low";
    if (previousStatus === "high" && value > Number(sensorCfg.max) - NORMAL_HYSTERESIS) status = "high";
    const lastAlertAt = previous.lastAlertAt ? new Date(previous.lastAlertAt).getTime() : 0;
    const canAlert = Date.now() - lastAlertAt >= ALERT_COOLDOWN_MS;

    if (sensorCfg.enabled && status !== "normal" && (status !== previousStatus || canAlert)) {
      messages.push(
        `🌡 ALB CARWASH — ПРЕДУПРЕЖДЕНИЕ\n\n` +
        `📍 ${sensorCfg.name} (${sensorId})\n` +
        `🌡 Сейчас: ${value.toFixed(1)} °C\n` +
        `⚠️ ${status === "low" ? "Ниже минимума" : "Выше максимума"}\n` +
        `Допустимо: ${sensorCfg.min}…${sensorCfg.max} °C\n🕒 ${localTime(new Date(timestamp))}`
      );
      previous.lastAlertAt = timestamp;
    } else if (sensorCfg.enabled && previousStatus !== "normal" && status === "normal") {
      messages.push(
        `✅ Температура вернулась в норму\n\n📍 ${sensorCfg.name}\n` +
        `🌡 Сейчас: ${value.toFixed(1)} °C\n🕒 ${localTime(new Date(timestamp))}`
      );
    }

    last[sensorId] = {
      value, at: timestamp, status,
      lastAlertAt: previous.lastAlertAt || null,
      deviceId
    };
    recordReading(sensorId, value, timestamp);
    hist.push({ sensorId, value, at: timestamp, deviceId });
  }

  // Keep last 10,000 samples to avoid unbounded JSON growth.
  if (hist.length > 10000) hist.splice(0, hist.length - 10000);
  writeJson(SETTINGS_FILE, cfg);
  writeJson(LATEST_FILE, last);
  writeJson(HISTORY_FILE, hist);

  if (wasOffline) messages.unshift(`🟢 Датчик температуры на связи🕒 ${localTime()}`);
  for (const message of messages) await notify(message);
  return { ok: true, received: Object.keys(incoming).length };
}

function getStatusText() {
  ensureFiles();
  const cfg = settings();
  const last = latest();
  const lines = ["🌡 МОНИТОРИНГ ТЕМПЕРАТУРЫ", ""];
  for (const [id, s] of Object.entries(cfg.sensors || {})) {
    const r = last[id];
    lines.push(`${s.enabled ? "🟢" : "⚪"} ${s.name} (${id})`);
    lines.push(r ? `🌡 ${Number(r.value).toFixed(1)} °C — ${r.status === "normal" ? "норма" : r.status === "low" ? "ниже минимума" : "выше максимума"}` : "Нет данных");
    lines.push(`⚙️ Мин: ${s.min} °C | Макс: ${s.max} °C`);
    lines.push("");
  }
  for (const [id, d] of Object.entries(cfg.devices || {})) {
    const online = d.lastSeen && Date.now() - new Date(d.lastSeen).getTime() <= DEVICE_OFFLINE_MS;
    lines.push(`📡 ${d.name}: ${online ? "🟢 Online" : "🔴 Offline"}`);
    if (d.lastSeen) lines.push(`Последний сигнал: ${localTime(new Date(d.lastSeen))}`);
  }
  return lines.join("\n");
}

function setLimit(sensorId, type, value) {
  ensureFiles();
  if (!["min", "max"].includes(type) || !Number.isFinite(value) || value < -50 || value > 100)
    throw new Error("Укажите корректное значение от -50 до 100");
  const cfg = settings();
  if (!cfg.sensors[sensorId]) cfg.sensors[sensorId] = {
    name: sensorId, min: 5, max: 35, enabled: true
  };
  cfg.sensors[sensorId][type] = value;
  if (Number(cfg.sensors[sensorId].min) >= Number(cfg.sensors[sensorId].max))
    throw new Error("Минимум должен быть меньше максимума");
  writeJson(SETTINGS_FILE, cfg);
  return cfg.sensors[sensorId];
}

function getHistoryText(period = "day") {
  const h = history();
  const now = Date.now();
  const duration = period === "week" ? 7 * 86400000 :
    period === "month" ? 30 * 86400000 : 86400000;
  const selected = h.filter(x => now - new Date(x.at).getTime() <= duration);
  if (!selected.length) return "За выбранный период данных пока нет.";
  const grouped = {};
  for (const item of selected) {
    if (!grouped[item.sensorId]) grouped[item.sensorId] = [];
    grouped[item.sensorId].push(item.value);
  }
  const title = period === "week" ? "НЕДЕЛЯ" : period === "month" ? "МЕСЯЦ" : "СЕГОДНЯ";
  const lines = [`📊 ТЕМПЕРАТУРНАЯ СТАТИСТИКА — ${title}`, ""];
  for (const [id, values] of Object.entries(grouped)) {
    lines.push(`${id}:`);
    lines.push(`Минимум: ${Math.min(...values).toFixed(1)} °C`);
    lines.push(`Максимум: ${Math.max(...values).toFixed(1)} °C`);
    lines.push(`Средняя: ${(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)} °C`);
    lines.push(`Измерений: ${values.length}`, "");
  }
  return lines.join("\n");
}

function getAllTimeRecordsText() {
  const r = records();
  const lines = ["🏆 РЕКОРДЫ ЗА ВСЁ ВРЕМЯ", ""];
  for (const [id, item] of Object.entries(r)) {
    lines.push(`${id}:`);
    if (item.min) lines.push(`🔵 Мин: ${item.min.value.toFixed(1)} °C — ${localTime(new Date(item.min.at))}`);
    if (item.max) lines.push(`🔴 Макс: ${item.max.value.toFixed(1)} °C — ${localTime(new Date(item.max.at))}`);
  }
  return lines.join("\n");
}

function start(bot) {
  botRef = bot;
  ensureFiles();
  setInterval(async () => {
    const cfg = settings();
    for (const [id, device] of Object.entries(cfg.devices || {})) {
      if (!device.lastSeen || !device.online) continue;
      if (Date.now() - new Date(device.lastSeen).getTime() > DEVICE_OFFLINE_MS) {
        device.online = false;
        writeJson(SETTINGS_FILE, cfg);
        await notify(`🚨 ESP32 НЕ В СЕТИ\n📡 ${device.name} (${id})\n🕒 ${localTime()}\nНет данных более ${Math.round(DEVICE_OFFLINE_MS/60000)} мин.`);
      }
    }
  }, 30000);
}

module.exports = { start, processReadings, getStatusText, setLimit, getHistoryText, getAllTimeRecordsText };
