const axios = require("axios");
const bot = require("./telegramBot");

let offlineCount = 0;
let awoaraOnline = true;

async function checkAwoara() {

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

        const ping = Date.now() - start;

        // Если ранее была авария
        if (!awoaraOnline) {

            awoaraOnline = true;
            offlineCount = 0;

            await bot.sendMessage(
                process.env.TELEGRAM_CHAT_ID,

`✅ ALB CARWASH

🟢 AWOARA ONLINE

📡 Ping: ${ping} ms

🕒 ${new Date().toLocaleString("lv-LV")}

Связь с автомойкой восстановлена.`
            );

        }

        offlineCount = 0;

    } catch (e) {

        offlineCount++;

        console.log(
            `AWOARA offline (${offlineCount}/2):`,
            e.message
        );

        // Только после двух подряд неудачных проверок
        if (offlineCount >= 2 && awoaraOnline) {

            awoaraOnline = false;

            await bot.sendMessage(
                process.env.TELEGRAM_CHAT_ID,

`🚨 ALB CARWASH

❌ AWOARA OFFLINE

🕒 ${new Date().toLocaleString("lv-LV")}

Автомойка не отвечает более 2 минут.`
            );

        }

    }

}

// первая проверка
checkAwoara();

// далее каждую минуту
setInterval(checkAwoara, 60000);
