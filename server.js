const express = require("express");
const Stripe = require("stripe");
const axios = require("axios");
const checkOrders = require("./awora");

const app = express();
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
}, 15000);

// ---------- Test ----------
app.get("/", (_, res) => res.send("Bot is running"));

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started");
});
