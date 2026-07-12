const activeOrders = new Map();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const API = "https://en.awoara.com.cn/mer/store/order/smart_order/lst";
const FILE = "./lastOrder.json";
const {
    getSetting,
    setSetting
} = require("./database/settings");
async function applyUserProfile(phone) {

    if (!phone) return;

    const profile = await getUser(phone);

    if (!profile) {
        console.log("Profile not found:", phone);
        return;
    }

    console.log("Applying profile:", phone);

    try {

        await axios.post(
            "https://telegramevent.onrender.com/api/control",
            {
                light: profile.color !== "off",
                color: profile.color,
                music: profile.music !== "",
                relay1: profile.relay1,
                relay2: profile.relay2,
                song: profile.music || ""
            }
        );

        console.log("Profile applied");

    } catch (e) {

        console.log(
            "Cannot apply profile:",
            e.response?.data || e.message
        );

    }

}
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

async function loadLastOrder() {

    lastOrder = await getSetting("lastOrder");

    if (!lastOrder)
        lastOrder = "";

}

async function checkOrders(sendTelegram) {
  try {
      await loadLastOrder();
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
      await setSetting("lastOrder", lastOrder);
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


        const phone = order.user?.phone;
let profile = null;
const CURRENT_FILE = path.join(__dirname, "data", "currentProfile.json");
if (phone) {

    profile = await getUser(phone);

if (!profile) {

    profile = {

        phone,
        name: "",
        color: "off",
        music: "",
        relay1: false,
        relay2: false,
        vip: false,
        enabled: true,
        created: new Date().toISOString(),
        lastWash: null,
        washCount: 0,
        totalSpent: 0

    };

    await saveUser(profile);

    console.log("New user:", phone);

}

}

      let amount = "";
      let water = 0;
      let foam = 0;
      let coat = 0;

try {
    const detail = await getDetail(order.order_sn);
        const info = detail?.body?.data?.order_info;

        if (!info) {
          console.log("Order detail not ready:", order.order_sn);
          continue;
        }

        if (info.operation_remain_time !== 0 || info.idle_remain_time !== 0) {
          console.log("Order not finished:", order.order_sn);
          continue;
        }

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
let music = "OFF";
let light = "OFF";


if (profile) {

    music = profile.music || "OFF";
    light = profile.color || "OFF";

}
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
🎵 Music: ${music}
💡 Light: ${light}
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
setTimeout(() => {

    fs.writeFileSync(
        CURRENT_FILE,
        JSON.stringify({
            phone: "",
            music: "",
            color: "off",
            relay1: false,
            relay2: false,
            vip: false
        }, null, 2)
    );

    console.log("Profile cleared after 30 seconds");

}, 30000);
      lastOrder = order.order_sn;
      await setSetting("lastOrder", lastOrder);
    }

  } catch (err) {
    console.error("Awora:", err.response?.data || err.message);
  }
}

module.exports = checkOrders;
