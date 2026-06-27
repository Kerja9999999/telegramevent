const axios = require("axios");
const fs = require("fs");

const API =
  "https://en.awoara.com.cn/mer/store/order/smart_order/lst";

const FILE = "./lastOrder.json";

let lastOrder = "";

if (fs.existsSync(FILE)) {
  try {
    lastOrder = JSON.parse(fs.readFileSync(FILE)).order || "";
  } catch {
    lastOrder = "";
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

    // Первый запуск — только запоминаем последний заказ
    if (!lastOrder) {
      lastOrder = list[0].order_sn;
      fs.writeFileSync(FILE, JSON.stringify({ order: lastOrder }));
      console.log("Awora initialized:", lastOrder);
      return;
    }

    const newOrders = [];

    for (const order of list) {
      if (order.order_sn === lastOrder) break;
      newOrders.push(order);
    }

    if (!newOrders.length) return;

    newOrders.reverse();

    for (const order of newOrders) {
      const msg =
`🚿 НОВЫЙ ЗАКАЗ

💳 Тип: ${order.pay_type}

📍 ${order.location?.location_name || "-"}
🔧 ${order.device?.device_name || "-"}

👤 ${order.user?.nickname || "-"}
📞 ${order.user?.phone || "-"}

💶 Предоплата: ${order.prepay_money || "0"} ${order.merchant?.currency_code || ""}

🆔 ${order.order_sn}

🕒 ${order.create_time}`;

      await sendTelegram(msg);

      lastOrder = order.order_sn;

      fs.writeFileSync(
        FILE,
        JSON.stringify({
          order: lastOrder,
        })
      );
    }
  } catch (err) {
    console.error(
      "Awora:",
      err.response?.data || err.message
    );
  }
}

module.exports = checkOrders;
