const axios = require("axios");
const fs = require("fs");

const API =
  "https://en.awoara.com.cn/mer/store/order/smart_order/lst";

const FILE = "./orders.json";

let sentOrders = [];

if (fs.existsSync(FILE)) {
  try {
    sentOrders = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    sentOrders = [];
  }
}

async function checkOrders(sendTelegram) {
  try {
    const res = await axios.get(API, {
      headers: {
        "X-Token": process.env.AWORA_TOKEN,
        Accept: "application/json",
      },
      params: {
        order_sn: "",
        order_type: -1,
        keywords: "",
        membercard: "",
        status: "",
        date: "",
        page: 1,
        limit: 20,
        type: 1,
        username: "",
        order_id: "",
        activity_type: "",
        location_id: "",
        device_id: "",
        pay_type: "",
        open_type: "",
        min: 0,
        max: 0,
        machine_type: "",
        order_ch: "",
        is_api: 0,
      },
    });

    const list = res.data?.data?.list || [];

    if (!list.length) return;

    // Первый запуск — только запоминаем существующие заказы
    if (sentOrders.length === 0) {
      sentOrders = list.map(o => o.order_sn);

      fs.writeFileSync(
        FILE,
        JSON.stringify(sentOrders, null, 2)
      );

      console.log("Awora initialized");
      return;
    }

    const newOrders = list.filter(
      o => !sentOrders.includes(o.order_sn)
    );

    if (!newOrders.length) return;

    // Старые -> новые
    newOrders.reverse();

    for (const order of newOrders) {

      let amount = "";

      if (order.pay_type === "coin") {

        const minutes = Number(order.prepay_money);

        switch (minutes) {
          case 1:
            amount = "0.50 EUR";
            break;

          case 3:
            amount = "1.00 EUR";
            break;

          case 6:
            amount = "2.00 EUR";
            break;

          default:
            amount = `${minutes} мин`;
        }

      } else {

        amount =
          `${Number(order.prepay_money).toFixed(2)} ${order.merchant?.currency_code || ""}`;

      }

      const msg =
`🚿 НОВЫЙ ЗАКАЗ

💳 Тип: ${order.pay_type}

📍 ${order.location?.location_name || "-"}
🔧 ${order.device?.device_name || "-"}

👤 ${order.user?.nickname || "-"}

📞 ${order.user?.phone || "-"}

💶 ${amount}

🆔 ${order.order_sn}

🕒 ${order.create_time}`;

      await sendTelegram(msg);

      sentOrders.push(order.order_sn);
    }

    // Храним только последние 100 заказов
    if (sentOrders.length > 100) {
      sentOrders = sentOrders.slice(-100);
    }

    fs.writeFileSync(
      FILE,
      JSON.stringify(sentOrders, null, 2)
    );

  } catch (err) {
    console.error(
      "Awora:",
      err.response?.data || err.message
    );
  }
}

module.exports = checkOrders;
