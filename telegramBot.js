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
bot.on("message", (msg) => {

    switch (msg.text) {

        case "💶 Сегодня":
            msg.text = "/vyruchka";
            return bot.processUpdate({
                update_id: Date.now(),
                message: msg
            });

        case "📆 Вчера":
            msg.text = "/vchera";
            return bot.processUpdate({
                update_id: Date.now() + 1,
                message: msg
            });

        case "📈 Неделя":
            msg.text = "/nedelya";
            return bot.processUpdate({
                update_id: Date.now() + 2,
                message: msg
            });

        case "🗓 Месяц":
            msg.text = "/mesyac";
            return bot.processUpdate({
                update_id: Date.now() + 3,
                message: msg
            });

        case "📊 Год":
            msg.text = "/god";
            return bot.processUpdate({
                update_id: Date.now() + 4,
                message: msg
            });

        case "🟢 Статус":
            msg.text = "/status";
            return bot.processUpdate({
                update_id: Date.now() + 5,
                message: msg
            });

        case "❓ Помощь":
            msg.text = "/help";
            return bot.processUpdate({
                update_id: Date.now() + 6,
                message: msg
            });

        case "📋 Команды":
            msg.text = "/gv";
            return bot.processUpdate({
                update_id: Date.now() + 7,
                message: msg
            });

    }

});
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

bot.onText(/\/status/, async (msg) => {

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const s = await getStatistics(start, end);

    const users = getUsersCount();

    bot.sendMessage(msg.chat.id,

`🚿 ALB CARWASH

🟢 Система / Sistēma

🖥 Сервер:
✅ Online

🤖 Telegram:
✅ Online

📡 AWOARA API:
✅ Online

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
