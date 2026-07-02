const express = require("express");
const Stripe = require("stripe");
const axios = require("axios");
const checkOrders = require("./awora");

const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));
let lastTestTime = 0;

app.get("/control", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "control.html"));
});

//----------color change---------
app.post("/api/color/:color", express.json(), (req, res) => {

    automationCommand.light = true;
    automationCommand.color = req.params.color;

    console.log("Color:", req.params.color);

    res.json({
        ok: true,
        command: automationCommand
    });

});

// ---------- Automation ----------
let lastAutomationEvent = null;
let automationCommand = {
  light: false,
  music: false,
  relay1: false,
  relay2: false,
  color: "off",
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---------- Telegram ----------
async function sendTelegram(text) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
      }
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

// ---------- Stripe ----------
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );

      if (event.type === "checkout.session.completed") {
        const s = event.data.object;
        const c = s.customer_details || {};

        await sendTelegram(`💳 Stripe

💶 ${((s.amount_total || 0) / 100).toFixed(2)} EUR
👤 ${c.name || "-"}
📧 ${c.email || "-"}
📱 ${c.phone || "-"}

🆔 ${s.id}`);
      }

      res.json({ received: true });
    } catch (e) {
      res.status(400).send(e.message);
    }
  }
);

// ---------- Awora ----------
checkOrders(sendTelegram);

setInterval(async () => {
  await checkOrders(sendTelegram);
}, 605000);

// ---------- Basic ----------
app.get("/", (_, res) => res.send("Bot is running"));
app.get("/ping", (_, res) => res.send("OK"));

// ---------- TEST ----------
app.get("/test/boris", async (req, res) => {
  const now = Date.now();

  if (now - lastTestTime < 5000) {
    return res.json({ ok: false, message: "Test already executed" });
  }

  lastTestTime = now;

  const test = {
    user: "ВАСЯ",
    phone: "+37100000000",
    amount: "3.00 EUR",
    water: 120,
    foam: 80,
    coat: 50,
    payType: "card",
    device: "BOX 1",
    location: "ALB Wash",
    order: "TEST",
    time: new Date().toLocaleString(),
  };

  lastAutomationEvent = test;

  automationCommand = {
    light: true,
    music: true,
    relay1: true,
    relay2: false,
    color: "blue",
  };

  await sendTelegram(`🧪 ТЕСТ

👤 ${test.user}

💶 ${test.amount}

💦 Water: ${test.water} сек
🫧 Foam: ${test.foam} сек
✨ Wax: ${test.coat} сек`);

  res.json({ ok: true, test });
});
app.get("/test/wash", async (req, res) => {

    const wash = {
        user: "ВАСЯ",
        phone: "+37122112211",
        amount: "5.00 EUR",
        water: 184,
        foam: 72,
        coat: 51,
        payType: "card",
        device: "BOX 2",
        location: "ALB Wash",
        order: "TEST-" + Date.now(),
        time: new Date().toLocaleString()
    };

    lastAutomationEvent = wash;

    automationCommand = {
        light: true,
        music: true,
        relay1: true,
        relay2: false,
        color: "blue"
    };

    await sendTelegram(
`🚿 НОВЫЙ ЗАКАЗ

💳 Тип: ${wash.payType}

📍 ${wash.location}
🔧 ${wash.device}

👤 ${wash.user}
📞 ${wash.phone}

💶 ${wash.amount}

💦 Water: ${wash.water} сек
🫧 Foam: ${wash.foam} сек
✨ Wax: ${wash.coat} сек

🆔 ${wash.order}

🕒 ${wash.time}`
    );

    res.json({
        ok: true,
        wash,
        automationCommand
    });

});
app.get("/test/coin", async (req, res) => {

    const wash = {
        user: "ГОСТЬ",
        phone: "-",
        amount: "2.00 EUR",
        water: 142,
        foam: 63,
        coat: 38,
        payType: "coin",
        device: "BOX 2",
        location: "ALB Wash",
        order: "COIN-" + Date.now(),
        time: new Date().toLocaleString()
    };

    lastAutomationEvent = wash;

    automationCommand = {
        light: true,
        music: false,
        relay1: true,
        relay2: false,
        color: "green"
    };

    await sendTelegram(
`🚿 НОВЫЙ ЗАКАЗ

💳 Тип: ${wash.payType}

📍 ${wash.location}
🔧 ${wash.device}

👤 ${wash.user}
📞 ${wash.phone}

💶 ${wash.amount}

💦 Water: ${wash.water} сек
🫧 Foam: ${wash.foam} сек
✨ Wax: ${wash.coat} сек

🆔 ${wash.order}

🕒 ${wash.time}`
    );

    res.json({
        ok: true,
        wash,
        automationCommand
    });

});
// ---------- Automation API ----------
app.get("/automation/status", (req, res) => {
  res.json(lastAutomationEvent || {});
});

app.get("/automation/command", (req, res) => {
  res.json(automationCommand);
});

app.post("/api/control", express.json(), (req, res) => {

    automationCommand = {
        ...automationCommand,
        ...req.body
    };

    console.log("NEW COMMAND");
    console.log(automationCommand);

    res.json({
        ok: true,
        command: automationCommand
    });

});

app.post("/automation/event", express.json(), (req, res) => {
  lastAutomationEvent = {
    ...req.body,
    receivedAt: new Date().toISOString(),
  };

  res.json({ ok: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
