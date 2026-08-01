






a039152d-3c29-41a3-a058-78a4bba24126.png
teper v dnevnom otchete nado ukazivat i skolko istratil user. vot na 2 skrine. i lzhen byt napisan kak Polzivateli : cena

2cf75b71-d95d-4929-b2cb-7b920ce54978.png

2aa78e2e-18e6-4a47-bd9d-997b35128ca0.png
vot statistics const axios = require("axios");

const API =
    "https://en.awoara.com.cn/mer/store/order/smart_order/lst";

async function getOrders() {

    const res = await axios.get(API, {

        headers: {
            "X-Token": process.env.AWORA_TOKEN,
            Accept: "application/json"
        },

        params: {
            order_sn:"",
            order_type:-1,
            keywords:"",
            membercard:"",
            status:"",
            date:"",
            page:1,
            limit:500,
            type:1,
            username:"",
            order_id:"",
            activity_type:"",
            location_id:"",
            device_id:"",
            pay_type:"",
            open_type:"",
            min:0,
            max:0,
            machine_type:"",
            order_ch:"",
            is_api:0
        }

    });

    return res.data.data.list || [];

}

async function getDetail(orderSn) {

    const res = await axios.get(
        "https://en.awoara.com.cn/mer/store/order/smart_order/detail",
        {
            headers: {
                "X-Token": process.env.AWORA_TOKEN,
                Accept: "application/json"
            },
            params: {
                id: orderSn
            }
        }
    );

    return res.data.data;

}

function sameDay(date){

    const now = new Date();

    return (

        date.getDate()==now.getDate() &&
        date.getMonth()==now.getMonth() &&
        date.getFullYear()==now.getFullYear()

    );

}

async function getStatistics(startDate, endDate) {

    const orders = await getOrders();

    let total = 0;
    let count = 0;

    let firstOrder = "";
    let lastOrder = "";

    let card = 0;
    let coin = 0;

    let vip = 0;
    let vipTotal = 0;
    let usersTotal = 0;

    let revenuePerHour = 0;
    let carsPerHour = 0;

    const today=[];

    for(const order of orders){

        let d = new Date(
            order.create_time.replace(" ","T")
        );

        d.setHours(d.getHours()-3);

        if (d < startDate || d > endDate)
            continue;

        today.push(order);

    }

    today.reverse();

    for (const order of today) {

        let amount = 0;
        let info = null;

        try {

            const detail = await getDetail(order.order_sn);

            info = detail?.body?.data?.order_info;

            if (info) {

                // VIP-карта
                if (
                    Number(info.card_type) === 2 &&
                    Number(info.amount_receivable || 0) > 0
                ) {

                    amount =
                        Number(info.amount_receivable) / 100;

                    vip++;
                    vipTotal += amount;

                } else {

                    amount =
                        Number(info.amount_received || 0) / 100;

                }

            } else {

                amount =
                    parseFloat(order.amount_received || 0);

            }

        } catch {

            amount =
                parseFloat(order.amount_received || 0);

        }

        total += amount;

        count++;

        if(order.pay_type==="coin")
            coin += amount;

        if(order.pay_type==="credit"){
            card += amount;
            usersTotal += amount;
        }

    }

    if(today.length){

        firstOrder=today[0].order_sn;
        lastOrder=today[today.length-1].order_sn;

    }

    const hours = Math.max(
        1,
        (endDate - startDate) / (1000 * 60 * 60)
    );

    revenuePerHour = total / hours;
    carsPerHour = count / hours;

    return{

        total,

        count,

        average:
            count ? total/count : 0,

        revenuePerHour,

        carsPerHour,

        firstOrder,

        lastOrder,

        card,

        coin,

        vip,

        vipTotal,

        usersTotal

    };

}

module.exports = {
    getStatistics
};

Я внимательно просмотрел оба файла.

telegramBot.js синтаксически правильный. Ошибки в шаблонных строках или скобках я не вижу.

Но вот что меня смущает:

На Render написано:

Exited with status 1 because of an internal system error

Такое сообщение обычно появляется не из-за JS-кода, а потому что приложение падает при запуске.

Давай проверим по шагам.
1. Локальная проверка
В терминале проекта выполни:

node telegramBot.js
или если запускается через:

npm start
то

npm start
Там сразу появится настоящая ошибка.

2. На Render открой именно Logs
Не Events.

Слева:

Logs
и нажми Refresh после нового деплоя.

3. Еще одна вещь
Покажи, пожалуйста, package.json.

Иногда после изменения файлов Render начинает запускать другой файл.

4. Еще проверь
В telegramBot.js ты подключаешь

const {
    getStatistics
} = require("./statistics");
Файл называется именно

statistics.js
с маленькой буквы?

На GitHub иногда бывает

Statistics.js
или

Statistic.js
На Windows это работает, а на Linux (Render) — нет.

5. Самое вероятное
По моему опыту (90% случаев) это одна из этих причин:

❌ неправильное имя файла (statistics.js ↔ Statistics.js);

❌ package.json запускает не тот файл;

❌ Render использует старую ветку/старый коммит;

❌ ошибка при require("./statistics").

Пришли еще:

package.json;

список файлов проекта (как они называются на GitHub).

По этим двум вещам можно будет почти наверняка найти проблему.


{
  "name": "stripe-telegram-webhook",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "express": "^4.19.2",
    "stripe": "^18.0.0",
    "node-telegram-bot-api": "^0.66.0"
  }
}

Вот, нашел самое подозрительное.

У тебя в package.json:

"scripts": {
  "start": "node server.js"
}
То есть Render вообще не запускает telegramBot.js. Он запускает только server.js.

Если в server.js есть:

require("./telegramBot");
то ошибка может быть там.

Нужно проверить server.js.
Пришли, пожалуйста, полностью server.js.

Еще одна важная проверка
Если server.js подключает так:

require("./telegramBot");
то убедись, что файл действительно называется:

telegramBot.js
с точно такой же буквой B.

На Windows неважно:

telegramBot.js
telegrambot.js
TelegramBot.js
всё работает.

На Render (Linux) это разные файлы, и приложение падает.

Я почти уверен, что проблема именно здесь.
Пришли:

server.js.

Как называется файл на GitHub: telegramBot.js или telegrambot.js.

Это позволит сразу определить причину.



Pasted text(7).txt
Document

Нашел проблему.

telegramBot.js и statistics.js выглядят нормально. Но ты изменил только telegramBot.js, а в server.js остались старые обращения к stat.vip.

Например, ежедневый отчет:

👑 VIP: ${stat.vip}
находится в server.js около ежедневого отчета. 


И тестовый отчет:

👑 VIP: ${stat.vip}
находится еще ниже. 


Если ты уже переделал statistics.js, то лучше заменить эти строки тоже.

Например:

💶 Выручка: ${stat.total.toFixed(2)} EUR
💳 Карты: ${stat.card.toFixed(2)} EUR
🪙 Монеты: ${stat.coin.toFixed(2)} EUR
👥 Пользователи: ${stat.usersTotal.toFixed(2)} EUR
👑 VIP карты: ${stat.vipTotal.toFixed(2)} EUR
Но это не объясняет падение деплоя.
Есть еще одна вещь, которую нужно проверить.

В самом конце server.js есть:

require("./telegramBot");
require("./scheduler");


Если файла scheduler.js нет в репозитории, то Render сразу падает с ошибкой:

Error: Cannot find module './scheduler'
Проверь:
Есть ли в проекте файл scheduler.js?

Есть ли файл telegramBot.js именно с такой буквой B (не telegrambot.js)?

И последнее
На скриншоте Render видно только Events. Настоящая причина всегда находится в Logs.

Открой:

Render → Logs

и пришли первые строки после Starting service....

Там почти наверняка будет одна строка вроде:

Error: Cannot find module ...
или

SyntaxError ...
Именно она покажет точную причину падения.


const express = require("express");
const Stripe = require("stripe");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const NIGHT_FILE = path.join(__dirname, "data", "nightQueue.json");
const { getStatistics } = require("./statistics");

if (!fs.existsSync(path.join(__dirname, "data"))) {
fs.mkdirSync(path.join(__dirname, "data"));
}

if (!fs.existsSync(NIGHT_FILE)) {
fs.writeFileSync(NIGHT_FILE, "[]");
}
async function loginAwoara(account, password) {

const res = await axios({
    method: "POST",
    url: "https://en.awoara.com.cn/api/auth/login",
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    data: {
        account: account,
        password: password,
        mer_id: 120
    }
});

console.log(res.data);

return res.data;
}

const checkOrders = require("./awora");
const app = express();
// ---------- Stripe ----------
app.post(
"/stripe-webhook",
express.raw({ type: "application/json" }),
async (req, res) => {

try {

  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers["stripe-signature"],
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === "checkout.session.completed") {

    const s = event.data.object;
    const c = s.customer_details || {};

    await sendTelegram(
`💳 Stripe

💶 ${((s.amount_total || 0) / 100).toFixed(2)} EUR

👤 ${c.name || "-"}

📧 ${c.email || "-"}

📱 ${c.phone || "-"}

🆔 ${s.id}`
);

  } else {

    await sendTelegram(
`ℹ️ Stripe Event

${event.type}

🕒 ${new Date().toLocaleString("lv-LV")}`
);

  }

  res.json({ received: true });

} catch (e) {

  console.error("❌ Stripe Webhook Error:", e);

  try {

    await sendTelegram(
`🚨 STRIPE WEBHOOK ERROR

❌ ${e.message}

🕒 ${new Date().toLocaleString("lv-LV")}`
);

  } catch {}

  res.status(400).send(e.message);

}
}
);
app.use(express.json());
const USERS_FILE = path.join(__dirname, "data", "users.json");

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/test-login/", protect, async (req, res) => {

const users = loadUsers();

const user = users[req.params.phone];

if (!user) {
    return res.status(404).json({
        ok:false
    });
}

try{
const data = await loginAwoara(user.account, user.password);

res.json(data);
return;

    res.json({
        ok:true,
        token
    });

}catch(e){

    res.json({
        ok:false,
        error:e.response?.data || e.message
    });

}
});

// ---------- ADMIN LOGIN ----------

function protect(req, res, next) {
const auth = req.headers.authorization;

if (!auth) {
res.setHeader("WWW-Authenticate", 'Basic realm="ALB Admin"');
return res.status(401).send("Authorization required");
}

const encoded = auth.split(" ")[1];
const decoded = Buffer.from(encoded, "base64").toString("utf8");

const [login, password] = decoded.split(":");

if (
login === process.env.ADMIN_LOGIN &&
password === process.env.ADMIN_PASSWORD
) {
return next();
}

res.setHeader("WWW-Authenticate", 'Basic realm="ALB Admin"');
return res.status(401).send("Wrong login or password");
}
function isAdmin(req) {
const auth = req.headers.authorization || "";

return auth === "Bearer " + process.env.ADMIN_TOKEN;
}

function requireAdmin(req, res, next) {
if (!isAdmin(req)) {
return res.status(401).json({
ok: false,
message: "Unauthorized",
});
}

next();
}
function isAdmin(req) {
return req.headers.authorization === "Bearer " + process.env.ADMIN_TOKEN;
}
let lastTestTime = 0;
let checkingOrders = false;

app.get("/control", protect, (req, res) => {
res.sendFile(path.join(__dirname, "public", "control.html"));
});
app.get("/users", protect, (req, res) => {
res.sendFile(path.join(__dirname, "public", "users.html"));
});
//----------color change---------
app.post("/api/color/", express.json(), (req, res) => {
automationCommand.light = true;
automationCommand.color = req.params.color;

console.log("Color:", req.params.color);

res.json({
ok: true,
command: automationCommand,
});
});
const COIN_FILE = path.join(__dirname, "data", "coinProfile.json");

function loadCoinProfile() {
try {
return JSON.parse(fs.readFileSync(COIN_FILE, "utf8"));
} catch {
return {
color: "off",
music: "",
relay1: false,
relay2: false,
};
}
}

async function saveCoinProfile(profile) {

fs.writeFileSync(
    COIN_FILE,
    JSON.stringify(profile, null, 2)
);

await uploadCoinProfileToGitHub(profile);
}
//----------TEST mojka---------
app.get("/test", async (req, res) => {
const phone = req.query.phone;

if (!phone) {
return res.status(400).json({
ok: false,
error: "phone required",
});
}

try {
const users = loadUsers();

const profile = users[phone];

if (!profile) {
  return res.status(404).json({
    ok: false,
    error: "User not found",
  });
}

automationCommand = {
  light: profile.color !== "off",
  color: profile.color,
  music: !!profile.music,
  song: profile.music || "",
  relay1: !!profile.relay1,
  relay2: !!profile.relay2,
};

lastAutomationEvent = {
  user: profile.name || phone,
  phone,
  amount: "TEST",
  water: 0,
  foam: 0,
  coat: 0,
  music: profile.music || "-",
  light: profile.color || "-",
};

res.json({
  ok: true,
  phone,
  profile,
  automationCommand,
});
} catch (e) {
res.status(500).json({
ok: false,
error: e.message,
});
}
});
// ---------- COIN PROFILE ----------
app.post("/api/coin", protect, async (req, res) => {
console.log("SAVE COIN");
console.log(req.body);
console.log(COIN_FILE);

await saveCoinProfile({
color: req.body.color || "off",
music: req.body.music || "",
relay1: !!req.body.relay1,
relay2: !!req.body.relay2,
vip: req.body.vip,
});

res.json({
ok: true,
});
});
// получить настройки
app.get("/api/coin", protect, (req, res) => {
res.json(loadCoinProfile());
});
// ---------- Automation ----------
let lastAutomationEvent = null;
let automationCommand = {
light: false,
music: false,
relay1: false,
relay2: false,
color: "off",
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
function loadUsers() {
try {
return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
} catch {
return {};
}
}

function saveUsers(users) {
fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

uploadUsersToGitHub(users).catch((err) =>
console.error("GitHub upload:", err.message)
);
}
async function uploadUsersToGitHub(users) {
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

const path = "data/users.json";

const headers = {
Authorization: Bearer ${token},
Accept: "application/vnd.github+json",
};

// Получаем SHA текущего файла
const current = await axios.get(
https://api.github.com/repos/${owner}/${repo}/contents/${path},
{ headers }
);

const sha = current.data.sha;

const content = Buffer.from(JSON.stringify(users, null, 2)).toString(
"base64"
);

// Обновляем файл
await axios.put(
https://api.github.com/repos/${owner}/${repo}/contents/${path},
{
message: "Update users.json",
content,
sha,
},
{ headers }
);

console.log("users.json updated in GitHub");
}
async function uploadCoinProfileToGitHub(profile) {

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

const githubPath = "data/coinProfile.json";

const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
};

const current = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath}`,
    { headers }
);

const sha = current.data.sha;

const content = Buffer
    .from(JSON.stringify(profile, null, 2))
    .toString("base64");

await axios.put(
    `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath}`,
    {
        message: "Update coinProfile.json",
        content,
        sha
    },
    { headers }
);

console.log("coinProfile.json updated in GitHub");
}

// ---------- Telegram ----------
async function sendTelegram(text) {

const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Riga",
    hour: "2-digit",
    hour12: false
}).formatToParts(new Date());

const hour = Number(
    parts.find(x => x.type === "hour").value
);
if (hour >= 23 || hour < 8) {

const queue = JSON.parse(
    fs.readFileSync(NIGHT_FILE, "utf8")
);

queue.push(text);

fs.writeFileSync(
    NIGHT_FILE,
    JSON.stringify(queue, null, 2)
);

console.log("🌙 Сообщение сохранено в ночную очередь");

return;
}
console.log("SEND TELEGRAM");
try {
await axios.post(
https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage,
{
chat_id: process.env.TELEGRAM_CHAT_ID,
text,
}
);
console.log("Telegram OK");
} catch (err) {
console.error("Telegram ERROR:", err.response?.data || err.message);
}
}
const REPORT_FILE = path.join(__dirname, "data", "nightReport.json");

if (!fs.existsSync(REPORT_FILE)) {
fs.writeFileSync(REPORT_FILE, JSON.stringify({ date: "" }));
}

setInterval(async () => {

const now = new Date();

const parts = new Intl.DateTimeFormat("en-GB", {
timeZone: "Europe/Riga",
year: "numeric",
month: "2-digit",
day: "2-digit",
hour: "2-digit",
hour12: false
}).formatToParts(now);

const hour = Number(parts.find(p => p.type === "hour").value);

const year = parts.find(p => p.type === "year").value;
const month = parts.find(p => p.type === "month").value;
const day = parts.find(p => p.type === "day").value;

const today = ${year}-${month}-${day};

// Ждем 08:00 по Риге
if (hour < 8) return;

let lastReport = "";

try {
    lastReport = JSON.parse(
        fs.readFileSync(REPORT_FILE, "utf8")
    ).date;
} catch {}
// Уже отправляли сегодня
if (lastReport === today) return;

let queue = [];

try {
queue = JSON.parse(
fs.readFileSync(NIGHT_FILE, "utf8")
);
} catch {
return;
}

// Ночью ничего не произошло
if (queue.length === 0) {

fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify({ date: today }, null, 2)
);

return;
}

let report =
`🌙 ALB CARWASH
НОЧНОЙ ОТЧЕТ

🕚 23:00 → 08:00
📊 Всего событий: ${queue.length}

────────────────────`;

queue.forEach((item, index) => {

report += `
${index + 1}️⃣

${item}

────────────────────`;

});

const reportTime = new Intl.DateTimeFormat("lv-LV", {
timeZone: "Europe/Riga",
dateStyle: "short",
timeStyle: "medium"
}).format(now);

report += `

✅ Конец отчета
🕗 ${reportTime}`;

try {

await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: report
    }
);

// Очищаем очередь
fs.writeFileSync(NIGHT_FILE, "[]");

// Запоминаем дату отправки
fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify({ date: today }, null, 2)
);

console.log("🌙 Ночной отчет отправлен");
} catch (e) {

console.log("Ошибка отправки:", e.message);
}

}, 60000);

// ---------- Awora ----------
checkOrders(sendTelegram);

setInterval(async () => {
if (checkingOrders) {
console.log("Previous check still running");
return;
}
checkingOrders = true;
try {
await checkOrders(sendTelegram);
} finally {
checkingOrders = false;
}
}, 10000);

// ---------- DAILY REPORT ----------

const DAILY_REPORT_FILE = path.join(__dirname, "data", "dailyReport.json");

if (!fs.existsSync(DAILY_REPORT_FILE)) {
fs.writeFileSync(
DAILY_REPORT_FILE,
JSON.stringify({ date: "" }, null, 2)
);
}

setInterval(async () => {

const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
}).formatToParts(new Date());

const get = (type) =>
    parts.find(x => x.type === type).value;

const hour = Number(get("hour"));
const minute = Number(get("minute"));
if (hour !== 8 || minute < 5 || minute > 9)
return;

const today =
    `${get("year")}-${get("month")}-${get("day")}`;

let lastDate = "";

try {
    lastDate = JSON.parse(
        fs.readFileSync(DAILY_REPORT_FILE, "utf8")
    ).date;
} catch {}

if (lastDate === today)
    return;
// Текущее время Риги
const rigaNow = new Date(
new Date().toLocaleString("en-US", {
timeZone: "Europe/Riga"
})
);

// Конец периода: сегодня 08:00 по Риге
const end = new Date(rigaNow);
end.setHours(8, 0, 0, 0);

// Если сейчас ещё не наступило 08:00 по Риге,
// то берём 08:00 предыдущего дня
if (rigaNow < end) {
end.setDate(end.getDate() - 1);
}

// Начало периода: вчера 08:00 по Риге
const start = new Date(end);
start.setDate(start.getDate() - 1);

const stat = await getStatistics(start, end);

const incomePerHour = stat.total / 24;
const carsPerHour = stat.count / 24;

const report =
    
`🌅 ALB CARWASH
📊 ЕЖЕДНЕВНЫЙ ОТЧЁТ
📅 ${today}

💶 Выручка: ${stat.total.toFixed(2)} EUR
💳 Карты: ${stat.card.toFixed(2)} EUR
🪙 Монеты: ${stat.coin.toFixed(2)} EUR
👑 VIP: ${stat.vip}

🧾 Чеков: ${stat.count}
💶 Средний чек: ${stat.average.toFixed(2)} EUR

📈 Выручка/час: ${incomePerHour.toFixed(2)} EUR
🚗 Машин/час: ${carsPerHour.toFixed(2)}

🆔 Первый: ${stat.firstOrder || "-"}
🆔 Последний: ${stat.lastOrder || "-"}

🕗 ${start.toLocaleString("lv-LV")} → ${end.toLocaleString("lv-LV")}`;

await sendTelegram(report);

fs.writeFileSync(
    DAILY_REPORT_FILE,
    JSON.stringify({ date: today }, null, 2)
);

console.log("✅ Daily report sent");
}, 30000);

// ---------- Basic ----------
app.get("/", (, res) => res.send("Bot is running"));
app.get("/ping", (, res) => res.send("OK"));

// ---------- TEST ----------
app.get("/test/boris", async (req, res) => {
const now = Date.now();

if (now - lastTestTime < 5000) {
return res.json({ ok: false, message: "Test already executed" });
}

lastTestTime = now;

const test = {
user: "ВАСЯ",
phone: "+37100000000",
amount: "3.00 EUR",
water: 120,
foam: 80,
coat: 50,
payType: "card",
device: "BOX 1",
location: "ALB Wash",
order: "TEST",
time: new Date().toISOString(),
};

lastAutomationEvent = test;

automationCommand = {
light: true,
music: true,
relay1: true,
relay2: false,
color: "blue",
};
const music = automationCommand.music ? "🟢 ON" : "🔴 OFF";
const light = automationCommand.light
? automationCommand.color.toUpperCase()
: "OFF";
await sendTelegram(🧪 ТЕСТ 👤 ${test.user} 💶 ${test.amount} 💦 Water: ${test.water} сек 🫧 Foam: ${test.foam} сек ✨ Wax: ${test.coat} сек 🎵 Music: ${music} 💡 Light: ${light});
res.json({ ok: true, test });
});
app.get("/test/wash", async (req, res) => {
const wash = {
user: "ВАСЯ",
phone: "+37122112211",
amount: "5.00 EUR",
water: 184,
foam: 72,
coat: 51,
payType: "card",
device: "BOX 2",
location: "ALB Wash",
order: "TEST-" + Date.now(),
time: new Date().toISOString(),
};

lastAutomationEvent = wash;

automationCommand = {
light: true,
music: true,
relay1: true,
relay2: false,
color: "blue",
};

await sendTelegram(
🚿 НОВЫЙ ЗАКАЗ 💳 Тип: ${wash.payType} 📍 ${wash.location} 🔧 ${wash.device} 👤 ${wash.user} 📞 ${wash.phone} 💶 ${wash.amount} 💦 Water: ${wash.water} сек 🫧 Foam: ${wash.foam} сек ✨ Wax: ${wash.coat} сек 🆔 ${wash.order} 🕒 ${wash.time}
);

res.json({
ok: true,
wash,
automationCommand,
});
});
app.get("/test/coin", async (req, res) => {
const wash = {
user: "ГОСТЬ",
phone: "-",
amount: "2.00 EUR",
water: 142,
foam: 63,
coat: 38,
payType: "coin",
device: "BOX 2",
location: "ALB Wash",
order: "COIN-" + Date.now(),
time: new Date().toISOString(),
};

lastAutomationEvent = wash;
const coin = loadCoinProfile();
lastAutomationEvent.music = coin.music;
lastAutomationEvent.light = coin.color;

automationCommand = {
light: coin.color !== "off",
music: !!coin.music,
relay1: coin.relay1,
relay2: coin.relay2,
color: coin.color,
song: coin.music || ""
};

await sendTelegram(
🚿 НОВЫЙ ЗАКАЗ 💳 Тип: ${wash.payType} 📍 ${wash.location} 🔧 ${wash.device} 👤 ${wash.user} 📞 ${wash.phone} 💶 ${wash.amount} 💦 Water: ${wash.water} сек 🫧 Foam: ${wash.foam} сек ✨ Wax: ${wash.coat} сек 🆔 ${wash.order} 🕒 ${wash.time}
);

res.json({
ok: true,
wash,
automationCommand,
});
});
// ---------- Automation API ----------
app.get("/automation/status", (req, res) => {
res.json(lastAutomationEvent || {});
});

const CURRENT_FILE = path.join(__dirname, "data", "currentProfile.json");

app.get("/automation/command", (req, res) => {
try {
const profile = JSON.parse(fs.readFileSync(CURRENT_FILE, "utf8"));

res.json(profile);
} catch {
res.json({
phone: "",
music: "",
color: "off",
relay1: false,
relay2: false,
vip: false,
});
}
});
// ---------- USERS ----------
app.get("/api/vision/plate/", (req, res) => {
const plate = req.params.plate.replace(/[\s-]/g, "").toUpperCase();

const users = loadUsers();

for (const phone in users) {

    const user = users[phone];

    const plates = user.plates || [];

    if (
        plates.some(p => p.replace(/[\s-]/g, "").toUpperCase() === plate)
    ) {
        return res.json({
            ok: true,
            user
        });
    }
}

res.status(404).json({
    ok: false
});
});
// получить admin polzovatel

app.get("/api/users", protect, (req, res) => {
res.json(loadUsers());
});
app.get("/api/vision/user", (req, res) => {
const plate = (req.query.plate || "")
.replace(/[\s-]/g, "")
.toUpperCase();

const users = loadUsers();

for (const phone in users) {
const user = users[phone];

const vehicle = (user.vehicle_number || "")
  .replace(/[\s-]/g, "")
  .toUpperCase();

if (vehicle === plate) {
  return res.json({
    ok: true,
    user,
  });
}
}

return res.status(404).json({
ok: false,
message: "Vehicle not found",
});
});
// сохранить пользователя

app.post("/api/users", protect, (req, res) => {
const users = loadUsers();

const user = {
...req.body,
plates: Array.isArray(req.body.plates)
? req.body.plates.map(p =>
String(p)
.replace(/[\s-]/g, "")
.toUpperCase()
)
: [],
};

users[user.phone] = user;

saveUsers(users);

res.json({
ok: true,
});
});
app.delete("/api/users/", protect, (req, res) => {
const users = loadUsers();
const phone = decodeURIComponent(req.params.phone);

if (!users[phone]) {
return res.status(404).json({
ok: false,
message: "User not found",
});
}

delete users[phone];

saveUsers(users);

res.json({
ok: true,
message: "User deleted",
});
});
app.post("/api/control", protect, (req, res) => {
automationCommand = {
...automationCommand,
...req.body,
};

console.log("NEW COMMAND");
console.log(automationCommand);

res.json({
ok: true,
command: automationCommand,
});
});

app.post("/automation/event", express.json(), (req, res) => {
lastAutomationEvent = {
...req.body,
receivedAt: new Date().toISOString(),
};

res.json({ ok: true });
});
app.post("/login", (req, res) => {
const { login, password } = req.body;

if (
login === process.env.ADMIN_LOGIN &&
password === process.env.ADMIN_PASSWORD
) {
return res.json({
token: process.env.ADMIN_TOKEN,
});
}

res.status(401).json({
error: "Invalid login",
});
});
// ---------- LOGIN ----------

app.listen(process.env.PORT || 3000, () => {
console.log("Server started");
});
app.use(async (err, req, res, next) => {

console.error(err);

try {

    await sendTelegram(
`🚨 SERVER ERROR

${req.method} ${req.originalUrl}

${err.message}`
);

} catch {}

res.status(500).send("Internal Server Error");
});

app.get("/test/daily-report", async (req, res) => {

const now = new Date();

const end = new Date(
now.toLocaleString("en-US", {
timeZone: "Europe/Riga"
})
);

end.setHours(8, 0, 0, 0);

const start = new Date(end);
start.setDate(start.getDate() - 1);

const stat = await getStatistics(start, end);

const report =
`🌅 ALB CARWASH

📊 ТЕСТ ЕЖЕДНЕВНОГО ОТЧЁТА

💶 Общая выручка: ${stat.total.toFixed(2)} EUR
💳 Карты: ${stat.card.toFixed(2)} EUR
🪙 Монеты: ${stat.coin.toFixed(2)} EUR

🧾 Чеков: ${stat.count}
💶 Средний чек: ${stat.average.toFixed(2)} EUR

👑 VIP: ${stat.vip}

🆔 Первый заказ:
${stat.firstOrder || "-"}

🆔 Последний заказ:
${stat.lastOrder || "-"}`;

await sendTelegram(report);

res.send("Daily report sent.");
});

require("./telegramBot");
require("./scheduler");


Close
