const TelegramBot =
require("node-telegram-bot-api");

const {
    todayStatistics
}=require("./statistics");

const bot =
new TelegramBot(

process.env.TELEGRAM_BOT_TOKEN,

{
    polling:true
}

);

bot.onText(/\/start/,msg=>{

bot.sendMessage(msg.chat.id,

`🚿 ALB CARWASH

Доступные команды

/vyruchka`);

});

bot.onText(/\/vyruchka/,async msg=>{

const s=
await todayStatistics();

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

module.exports=bot;
