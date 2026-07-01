const axios = require("axios");
const fs = require("fs");

const API =
  "https://en.awoara.com.cn/mer/store/order/smart_order/lst";

const FILE = "./lastOrder.json";
const PENDING_FILE = "./pendingOrders.json";

async function getDetail(orderSn) {
  const res = await axios.get(
    "https://en.awoara.com.cn/mer/store/order/smart_order/detail",
    {
      headers: {
        "X-Token": process.env.AWORA_TOKEN,
        Accept: "application/json",
      },
      params: { id: orderSn },
    }
  );

  return res.data.data;
}

let lastOrder = "";
let pending = {};

if (fs.existsSync(FILE)) {
  try {
    lastOrder = JSON.parse(fs.readFileSync(FILE)).order || "";
  } catch {}
}

if (fs.existsSync(PENDING_FILE)) {
  try {
    pending = JSON.parse(fs.readFileSync(PENDING_FILE));
  } catch {}
}

async function checkOrders(sendTelegram) {
  try {
    const res = await axios.get(API, {
      headers: {
        "X-Token": process.env.AWORA_TOKEN,
        Accept: "application/json",
      },
      params: {
        page: 1,
        limit: 20,
        type: 1,
        order_type: -1,
        is_api: 0,
      },
    });

    const list = res.data?.data?.list || [];
    if (!list.length) return;

    if (!lastOrder) {
      lastOrder = list[0].order_sn;
      fs.writeFileSync(FILE, JSON.stringify({ order: lastOrder }));
      console.log("Awora initialized:", lastOrder);
      return;
    }

    for (const order of list) {
      if (order.order_sn === lastOrder) break;
      pending[order.order_sn] = order;
    }

    fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));

    for (const orderSn of Object.keys(pending)) {
      const order = pending[orderSn];

      let amount = `${(Number(order.prepay_money || 0) / 100).toFixed(2)} EUR`;
      let water = 0;
      let foam = 0;
      let coat = 0;

      try {
        const detail = await getDetail(order.order_sn);
        const info = detail.body.data.order_info;

        if (
          Number(info.amount_received) === 0 &&
          info.close_type === "no_balance" &&
          info.open_type !== "card"
        ) {
          console.log("Waiting:", order.order_sn);
          continue;
        }

        const programs = info.detail || [];

        const getSeconds = (name) => {
          const item = programs.find((p) => p.name === name);
          return item ? item.seconds : 0;
        };

        water = getSeconds("water");
        foam = getSeconds("foam");
        coat = getSeconds("coat");

        if (
          info.open_type === "card" &&
          info.close_type === "card" &&
          Number(info.amount_received) === 0
        ) {
          amount = "👑 VIP CARD";
        } else {
          amount = (Number(info.amount_received) / 100).toFixed(2) + " EUR";
        }

      } catch (e) {
        console.log("Detail error:", e.response?.data || e.message);
        continue;
      }

      const date = new Date(order.create_time.replace(" ", "T"));
      date.setHours(date.getHours() - 5);

      const time = date.toLocaleString("lv-LV");

      const msg = `🚿 НОВЫЙ ЗАКАЗ

💳 Тип: ${order.pay_type}

📍 ${order.location?.location_name || "-"}
🔧 ${order.device?.device_name || "-"}

👤 ${order.user?.nickname || "-"}
📞 ${order.user?.phone || "-"}

💶 ${amount}

💦 Water: ${water} сек
🫧 Foam: ${foam} сек
✨ Wax: ${coat} сек

🆔 ${order.order_sn}

🕒 ${time}`;

      await sendTelegram(msg);

      try {
        await axios.post(
          "https://telegramevent.onrender.com/automation/event",
          {
            user: order.user?.nickname || "",
            phone: order.user?.phone || "",
            amount,
            water,
            foam,
            coat,
            payType: order.pay_type,
            device: order.device?.device_name || "",
            location: order.location?.location_name || "",
            order: order.order_sn,
            time,
          }
        );
      } catch {}

      lastOrder = order.order_sn;
      fs.writeFileSync(FILE, JSON.stringify({ order: lastOrder }));

      delete pending[orderSn];
      fs.writeFileSync(PENDING_FILE, JSON.stringify(pending, null, 2));
    }
  } catch (err) {
    console.error("Awora:", err.response?.data || err.message);
  }
}

module.exports = checkOrders;
