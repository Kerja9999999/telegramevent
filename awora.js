const axios = require("axios");
const fs = require("fs");

const API =
  "https://en.awoara.com.cn/mer/store/order/smart_order/lst";

const FILE = "./lastOrder.json";
async function getDetail(orderSn) {

    const res = await axios.get(
        "https://en.awoara.com.cn/mer/store/order/smart_order/detail",
        {
            headers:{
                "X-Token":process.env.AWORA_TOKEN,
                Accept:"application/json"
            },
            params:{
                id:orderSn
            }
        }
    );

    return res.data.data;

}
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

    // Первый запуск
    if (!lastOrder) {
      lastOrder = list[0].order_sn;

      fs.writeFileSync(
        FILE,
        JSON.stringify({ order: lastOrder })
      );

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

    try {

        const detail = await getDetail(order.order_sn);

        const spent =
            detail.body.data.order_info.amount_received;

        amount =
            (Number(spent) / 100).toFixed(2) + " EUR";

    } catch {

        amount =
            `${Number(order.prepay_money).toFixed(2)} ${order.merchant?.currency_code || ""}`;

    }

}

      const msg =
const date = new Date(order.create_time.replace(" ", "T"));
date.setHours(date.getHours() - 5);

const time = date.toLocaleString("lv-LV", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
});

const msg =
`🚿 НОВЫЙ ЗАКАЗ

💳 Тип: ${order.pay_type}

📍 ${order.location?.location_name || "-"}
🔧 ${order.device?.device_name || "-"}

👤 ${order.user?.nickname || "-"}
📞 ${order.user?.phone || "-"}

💶 ${amount}

🆔 ${order.order_sn}

🕒 ${time}`;

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
