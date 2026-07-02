const axios = require("axios");
const fs = require("fs");

const API = "https://en.awoara.com.cn/mer/store/order/smart_order/lst";
const FILE = "./lastOrder.json";

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
    console.log('Orders received:', list.length);
    console.log('Last order:', lastOrder);
    if (!list.length) return;

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

    console.log('New orders:', newOrders.length);
    if (!newOrders.length) return;

    newOrders.reverse();

    for (const order of newOrders) {

      let amount = "";
      let water = 0;
      let foam = 0;
      let coat = 0;

      try {
        await new Promise(r => setTimeout(r, 5000));

        const detail = await getDetail(order.order_sn);
        const info = detail.body.data.order_info;

        const programs = info.detail || [];

        const getSeconds = (name) => {
          const p = programs.find(x => x.name === name);
          return p ? p.seconds : 0;
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
          amount = (Number(info.amount_received || 0) / 100).toFixed(2) + " EUR";
        }

      } catch (e) {
        amount = "0.00 EUR";
        console.error("Detail error:", e.response?.data || e.message);
      }

      const date = new Date(order.create_time.replace(" ", "T"));
      date.setHours(date.getHours() - 5);

      const time = date.toLocaleString("lv-LV", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

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

      console.log('Sending Telegram:', order.order_sn);
      try {
        await sendTelegram(msg);
        console.log('Telegram sent:', order.order_sn);
      } catch(e){
        console.error('Telegram ERROR:', e.response?.data || e.message);
      }

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
      } catch (e) {
        console.log("Automation API error:", e.message);
      }

      lastOrder = order.order_sn;
      fs.writeFileSync(FILE, JSON.stringify({ order: lastOrder }));
    }

  } catch (err) {
    console.error("Awora:", err.response?.data || err.message);
  }
}

module.exports = checkOrders;
