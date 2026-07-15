const axios = require("axios");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TelegramBot =
require("node-telegram-bot-api");

const {
    getStatistics
}=require("./statistics");

const bot =
new TelegramBot(

process.env.TELEGRAM_BOT_TOKEN,

{
    polling:true
}

);
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

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👑 VIP:
${s.vip}

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

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👑 VIP:
${s.vip}

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

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👑 VIP:
${s.vip}

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

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👑 VIP:
${s.vip}

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

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👑 VIP:
${s.vip}

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

    // AWOARA
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

    } catch {}

    // Stripe
    try {

        await stripe.balance.retrieve();

        stripeStatus = "✅ Online";

    } catch {}

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

🧾 Чеков:
${s.count}

💳 Средний чек:
${s.average.toFixed(2)} €

👑 VIP:
${s.vip}

👥 Пользователей:
${users}

🆔 Первый Order:
${s.firstOrder}

🆔 Последний Order:
${s.lastOrder}

🕒 Последнее обновление:
${new Date().toLocaleString("lv-LV")}`);

});

module.exports=bot;
