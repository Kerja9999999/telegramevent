const bot=require("./telegramBot");

const {
todayStatistics
}=require("./statistics");

let sent=false;

setInterval(async()=>{

const now=new Date();

if(now.getHours()==21 && now.getMinutes()==0){

if(sent)
return;

sent=true;

const s=
await todayStatistics();

bot.sendMessage(

process.env.TELEGRAM_CHAT_ID,

`📊 ИТОГИ ДНЯ

💶 ${s.total.toFixed(2)} €

🧾 ${s.count}

💳 ${s.average.toFixed(2)} €

🆔 ${s.firstOrder}

🆔 ${s.lastOrder}`

);

}

if(now.getMinutes()!=0)
sent=false;

},30000);
