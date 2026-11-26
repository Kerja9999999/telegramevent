const axios = require("axios");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TelegramBot =
require("node-telegram-bot-api");

const {
    getStatistics
}=require("./statistics");
const temperature = require("./temperature");

const bot =
new TelegramBot(

process.env.TELEGRAM_BOT_TOKEN,

{
    polling:true
}

);

bot.setMyCommands([
    { command: "vyruchka", description: "💶 Сегодня / Šodien" },
    { command: "vchera", description: "📆 Вчера / Vakar" },
    { command: "nedelya", description: "📈 Последние 7 дней / Pēdējās 7 dienas" },
    { command: "mesyac", description: "🗓 Текущий месяц / Šis mēnesis" },
    { command: "god", description: "📊 Текущий год / Šis gads" },
    { command: "status", description: "📍 Состояние мойки / Mazgātavas statuss" },
    { command: "temperatura", description: "🌡 Мониторинг температуры" },
    { command: "help", description: "📋 Помощь / Palīdzība" },
    { command: "gv", description: "📋 Все команды / Visas komandas" }
])
.then(() => {
    console.log("✅ Telegram Menu настроено");
})
.catch(err => {
    console.log("❌ Ошибка Telegram Menu:", err.message);
});

const keyboard = {
  reply_markup: {
    resize_keyboard: true,
    one_time_keyboard: false,
    keyboard: [
      [
        { text: "/vyruchka" },
        { text: "/vchera" }
      ],
      [
        { text: "/nedelya" },
        { text: "/mesyac" }
      ],
      [
        { text: "/god" },
        { text: "/status" }
      ],
      [
        { text: "/temperatura" }
      ],
      [
        { text: "/help" },
        { text: "/gv" }
      ]
    ]
  }
};
function todayRange() {

    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    return { start, end };

}
bot.onText(/\/start/, (msg) => {

    bot.sendMessage(
        msg.chat.id,

`🚿 ALB CARWASH

Добро пожаловать!
Laipni lūdzam!

📋 Доступные команды / Pieejamās komandas

💶 /vyruchka — Сегодня / Šodien
📆 /vchera — Вчера / Vakar
📈 /nedelya — Последние 7 дней / Pēdējās 7 dienas
🗓 /mesyac — Текущий месяц / Šis mēnesis
📊 /god — Текущий год / Šis gads
📍 /status — Состояние мойки / Mazgātavas statuss
📋 /help — Помощь / Palīdzība
🌡 /temperatura — Мониторинг температуры
📋 /gv — Все команды / Visas komandas`,

        keyboard

    );

});
bot.onText(/\/help/, (msg) => {

bot.sendMessage(msg.chat.id,

`📋 ALB CARWASH

💶 /vyruchka
Сегодня / Šodien

📆 /vchera
Вчера / Vakar

📈 /nedelya
Последние 7 дней / Pēdējās 7 dienas

🗓 /mesyac
Текущий месяц / Šis mēnesis

📊 /god
Текущий год / Šis gads

📍 /status
Состояние автомойки / Mazgātavas statuss

🌡 /temperatura
Мониторинг температуры

📋 /gv
Все команды / Visas komandas`

);

});
bot.onText(/\/gv/, (msg) => {

bot.sendMessage(msg.chat.id,

`🚿 ALB CARWASH

📋 Все команды / Visas komandas

💶 /vyruchka — Сегодня / Šodien

📆 /vchera — Вчера / Vakar

📈 /nedelya — Последние 7 дней / Pēdējās 7 dienas

🗓 /mesyac — Текущий месяц / Šis mēnesis

📊 /god — Текущий год / Šis gads

📍 /status — Состояние мойки / Mazgātavas statuss

🌡 /temperatura — Мониторинг температуры

📋 /help — Помощь / Palīdzība`

);

});
bot.onText(/\/vyruchka/,async msg=>{

const { start, end } = todayRange();

const s = await getStatistics(start, end);

bot.sendMessage(

msg.chat.id,

`📊 ALB CARWASH

💶 Общая выручка:
${s.total.toFixed(2)} €

👤 Кредиты:
${s.card.toFixed(2)} €

🪙 Монеты:
${s.coin.toFixed(2)} €

👥 Пользователи:
${s.usersTotal.toFixed(2)} €

👑 VIP карты:
${s.vipTotal.toFixed(2)} €

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

🆔 Первый Order:
${s.firstOrder}

🆔 Последний Order:
${s.lastOrder}`


);

});
bot.onText(/\/vchera/, async (msg) => {

    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23,59,59,999);

    const s = await getStatistics(start, end);

    bot.sendMessage(msg.chat.id,

`📊 ALB CARWASH
📅 Вчера
💶 Общая выручка:
${s.total.toFixed(2)} €

👤 Кредиты:
${s.card.toFixed(2)} €

🪙 Монеты:
${s.coin.toFixed(2)} €

👥 Пользователи:
${s.usersTotal.toFixed(2)} €

👑 VIP карты:
${s.vipTotal.toFixed(2)} €

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

📈 Выручка / час:
${s.revenuePerHour.toFixed(2)} €

🚗 Машин / час:
${s.carsPerHour.toFixed(2)}

🆔 Первый Order:
${s.firstOrder}
🆔 Последний Order:
${s.lastOrder}`);

});
bot.onText(/\/nedelya/, async (msg) => {

    const end = new Date();
    end.setHours(23,59,59,999);

    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0,0,0,0);

    const s = await getStatistics(start, end);

    bot.sendMessage(msg.chat.id,

`📊 ALB CARWASH
📅 Последние 7 дней

💶 Общая выручка:
${s.total.toFixed(2)} €

👤 Кредиты:
${s.card.toFixed(2)} €

🪙 Монеты:
${s.coin.toFixed(2)} €

👥 Пользователи:
${s.usersTotal.toFixed(2)} €

👑 VIP карты:
${s.vipTotal.toFixed(2)} €

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

📈 Выручка / день:
${(s.total / 7).toFixed(2)} €

🚗 Машин / день:
${(s.count / 7).toFixed(1)}

🆔 Первый Order:
${s.firstOrder}
🆔 Последний Order:
${s.lastOrder}`);

});
bot.onText(/\/mesyac/, async (msg) => {

    const start = new Date();
    start.setDate(1);
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const s = await getStatistics(start, end);

    bot.sendMessage(msg.chat.id,

`📊 ALB CARWASH

🗓 Текущий месяц

💶 Общая выручка:
${s.total.toFixed(2)} €

👤 Кредиты:
${s.card.toFixed(2)} €

🪙 Монеты:
${s.coin.toFixed(2)} €

👥 Пользователи:
${s.usersTotal.toFixed(2)} €

👑 VIP карты:
${s.vipTotal.toFixed(2)} €

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

📈 Выручка / день:
${(s.total / 7).toFixed(2)} €
🚗 Машин / день:
${(s.count / 7).toFixed(1)}

🆔 Первый Order:
${s.firstOrder}

🆔 Последний Order:
${s.lastOrder}`);

});
bot.onText(/\/god/, async (msg) => {

    const start = new Date();
    start.setMonth(0);
    start.setDate(1);
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    const s = await getStatistics(start, end);

    bot.sendMessage(msg.chat.id,

`📊 ALB CARWASH

📅 Текущий год

💶 Общая выручка:
${s.total.toFixed(2)} €

👤 Кредиты:
${s.card.toFixed(2)} €

🪙 Монеты:
${s.coin.toFixed(2)} €

👥 Пользователи:
${s.usersTotal.toFixed(2)} €

👑 VIP карты:
${s.vipTotal.toFixed(2)} €

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

🆔 Первый Order:
${s.firstOrder}

🆔 Последний Order:
${s.lastOrder}`);
    });
const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join(__dirname, "data", "users.json");

function getUsersCount() {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
        return Object.keys(users).length;
    } catch {
        return 0;
    }
}
async function getSystemStatus() {

    let awoara = "❌ Offline";
    let stripeStatus = "❌ Offline";

    // Проверка AWOARA
    try {

        const start = Date.now();

        await axios.get(
            "https://en.awoara.com.cn/mer/store/order/smart_order/lst",
            {
                headers: {
                    "X-Token": process.env.AWORA_TOKEN
                },
                params: {
                    page: 1,
                    limit: 1,
                    type: 1
                },
                timeout: 5000
            }
        );

        awoara = `✅ Online (${Date.now() - start} ms)`;

} catch (e) {

    console.log("STRIPE ERROR:", e.message);

}

    // Проверка Stripe
    try {

        await stripe.balance.retrieve();

        stripeStatus = "✅ Online";

    } catch (e) {

        console.log("STRIPE ERROR:", e.message);

    }

    return {
        awoara,
        stripeStatus
    };

}
bot.onText(/\/status/, async (msg) => {

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const s = await getStatistics(start, end);

    const users = getUsersCount();
    const system = await getSystemStatus();
    bot.sendMessage(msg.chat.id,

`🚿 ALB CARWASH

🟢 Система / Sistēma

🖥 Сервер:
✅ Online

🤖 Telegram:
✅ Online

📡 AWOARA API:
${system.awoara}
💳 Stripe:
${system.stripeStatus}

📅 Сегодня / Šodien

💶 Общая выручка:
${s.total.toFixed(2)} €

👤 Кредиты:
${s.card.toFixed(2)} €

🪙 Монеты:
${s.coin.toFixed(2)} €

👥 Пользователи:
${s.usersTotal.toFixed(2)} €

👑 VIP карты:
${s.vipTotal.toFixed(2)} €

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👥 Пользователей:
${users}

🆔 Первый Order:
${s.firstOrder}

🆔 Последний Order:
${s.lastOrder}

🕒 Последнее обновление:
${new Date().toLocaleString("lv-LV")}`);

});



// ---------- TEMPERATURE MONITORING ----------
temperature.start(bot);

bot.onText(/^\/temperatura(?:@\w+)?$/, async (msg) => {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌡 Текущая температура", callback_data: "temp:status" }],
        [{ text: "📊 Сегодня", callback_data: "temp:day" }, { text: "📈 7 дней", callback_data: "temp:week" }],
        [{ text: "🗓 30 дней", callback_data: "temp:month" }, { text: "🏆 Рекорды", callback_data: "temp:records" }],
        [{ text: "⚙️ Как настроить пределы", callback_data: "temp:help" }]
      ]
    }
  };
  await bot.sendMessage(msg.chat.id, temperature.getStatusText(), opts);
});

bot.onText(/^\/tempmin(?:@\w+)?\s+([A-Za-z0-9_-]+)\s+(-?\d+(?:[.,]\d+)?)$/i, async (msg, match) => {
  try {
    const sensor = match[1];
    const value = Number(match[2].replace(",", "."));
    const cfg = temperature.setLimit(sensor, "min", value);
    await bot.sendMessage(msg.chat.id, `✅ Минимум для ${cfg.name}: ${cfg.min} °C\nМаксимум: ${cfg.max} °C`);
  } catch (e) { await bot.sendMessage(msg.chat.id, `❌ ${e.message}`); }
});

bot.onText(/^\/tempmax(?:@\w+)?\s+([A-Za-z0-9_-]+)\s+(-?\d+(?:[.,]\d+)?)$/i, async (msg, match) => {
  try {
    const sensor = match[1];
    const value = Number(match[2].replace(",", "."));
    const cfg = temperature.setLimit(sensor, "max", value);
    await bot.sendMessage(msg.chat.id, `✅ Максимум для ${cfg.name}: ${cfg.max} °C\nМинимум: ${cfg.min} °C`);
  } catch (e) { await bot.sendMessage(msg.chat.id, `❌ ${e.message}`); }
});

bot.onText(/^\/tempname(?:@\w+)?\s+([A-Za-z0-9_-]+)\s+(.+)$/i, async (msg, match) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(__dirname, "data", "temperature", "settings.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!data.sensors[match[1]]) throw new Error("Сначала дождитесь первого показания этого датчика.");
    data.sensors[match[1]].name = match[2].trim().slice(0, 40);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    await bot.sendMessage(msg.chat.id, `✅ Название датчика изменено: ${data.sensors[match[1]].name}`);
  } catch (e) { await bot.sendMessage(msg.chat.id, `❌ ${e.message}`); }
});

bot.on("callback_query", async (query) => {
  if (!query.data || !query.data.startsWith("temp:")) return;
  const action = query.data.split(":")[1];
  let text;
  if (action === "status") text = temperature.getStatusText();
  else if (action === "day" || action === "week" || action === "month")
    text = temperature.getHistoryText(action);
  else if (action === "records") text = temperature.getAllTimeRecordsText();
  else text = `⚙️ НАСТРОЙКА ДАТЧИКОВ

Установить нижний предел:
/tempmin sensor1 5

Установить верхний предел:
/tempmax sensor1 35

Для второго датчика используйте sensor2.

Переименовать датчик:
/tempname sensor1 Тёплый пол

Пределы можно менять прямо из Telegram — ESP32 перепрошивать не нужно.`;
  await bot.answerCallbackQuery(query.id);
  await bot.sendMessage(query.message.chat.id, text);
});

module.exports=bot;
