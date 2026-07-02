let lastTestTime = 0;
const express = require("express");
const Stripe = require("stripe");
const axios = require("axios");
const checkOrders = require("./awora");

const app = express();

// ---------- Automation ----------
let lastAutomationEvent = null;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---------- Telegram ----------
async function sendTelegram(text) {
    try {
        await axios.post(
            `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text
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
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (e) {
            return res.status(400).send(e.message);
        }

        if (event.type === "checkout.session.completed") {
            const s = event.data.object;
            const c = s.customer_details || {};

            const msg = `💳 Stripe

💶 ${((s.amount_total || 0) / 100).toFixed(2)} EUR
👤 ${c.name || "-"}
📧 ${c.email || "-"}
📱 ${c.phone || "-"}

🆔 ${s.id}`;

            await sendTelegram(msg);
        }

        res.json({ received: true });
    }
);

// ---------- Awora ----------
setInterval(async () => {
    await checkOrders(sendTelegram);
}, 605000);

// ---------- Test ----------
app.get("/", (_, res) => res.send("Bot is running"));
app.get("/ping", (_, res) => {
    res.send("OK");
});
// ---------- TEST ----------
app.get("/test/boris", async (req, res) => {

    const now = Date.now();

    if (now - lastTestTime < 5000) {
        return res.json({
            ok: false,
            message: "Test already executed"
        });
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
        time: new Date().toLocaleString()
    };

    lastAutomationEvent = test;

    await sendTelegram(`🧪 ТЕСТ

👤 ${test.user}

💶 ${test.amount}

💦 Water: ${test.water} сек
🫧 Foam: ${test.foam} сек
✨ Wax: ${test.coat} сек`);

    res.json({
        ok: true,
        test
    });

});
// ---------- Automation API ----------

// Получить последнее событие
app.get("/automation/status", (req, res) => {
    res.json(lastAutomationEvent || {});
});

// Сохранить новое событие
app.post("/automation/event", express.json(), (req, res) => {

    lastAutomationEvent = {
        ...req.body,
        receivedAt: new Date().toISOString()
    };

    console.log("=== AUTOMATION ===");
    console.log(lastAutomationEvent);

    res.json({
        ok: true
    });

});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});
