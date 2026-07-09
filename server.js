const express = require("express");
const Stripe = require("stripe");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const checkOrders = require("./awora");
const app = express();
const USERS_FILE = path.join(__dirname, "data", "users.json");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
function isAdmin(req){

    const auth = req.headers.authorization || "";

    return auth === "Bearer " + process.env.ADMIN_TOKEN;

}

function requireAdmin(req,res,next){

    if(!isAdmin(req)){

        return res.status(401).json({
            ok:false,
            message:"Unauthorized"
        });

    }

    next();

}
function isAdmin(req) {
    return req.headers.authorization === "Bearer " + process.env.ADMIN_TOKEN;
}
let lastTestTime = 0;
let checkingOrders = false;

app.get("/control", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "control.html"));
});
app.get("/users", (req, res) => {

    const auth = req.headers.authorization || "";

    if(auth !== "Bearer " + process.env.ADMIN_TOKEN){
        return res.redirect("/login.html");
    }

    res.sendFile(
        path.join(__dirname, "public", "users.html")
    );

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
//----------TEST mojka---------
app.get("/test", async (req, res) => {

    const phone = req.query.phone;

    if (!phone) {
        return res.status(400).json({
            ok: false,
            error: "phone required"
        });
    }

    try {

        const users = loadUsers();

        const profile = users[phone];

        if (!profile) {
            return res.status(404).json({
                ok: false,
                error: "User not found"
            });
        }

        automationCommand = {
            light: profile.color !== "off",
            color: profile.color,
            music: !!profile.music,
            song: profile.music || "",
            relay1: !!profile.relay1,
            relay2: !!profile.relay2
        };

        lastAutomationEvent = {
            user: profile.name || phone,
            phone,
            amount: "TEST",
            water: 0,
            foam: 0,
            coat: 0,
            music: profile.music || "-",
            light: profile.color || "-"
        };

        res.json({
            ok: true,
            phone,
            profile,
            automationCommand
        });

    } catch (e) {

        res.status(500).json({
            ok: false,
            error: e.message
        });

    }

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
function loadUsers() {

    try {

        return JSON.parse(
            fs.readFileSync(USERS_FILE, "utf8")
        );

    } catch {

        return {};

    }

}

function saveUsers(users) {

    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users, null, 2)
    );

    uploadUsersToGitHub(users)
        .catch(err => console.error("GitHub upload:", err.message));

}
async function uploadUsersToGitHub(users) {

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    const path = "data/users.json";

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json"
    };

    // Получаем SHA текущего файла
    const current = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers }
    );

    const sha = current.data.sha;

    const content = Buffer
        .from(JSON.stringify(users, null, 2))
        .toString("base64");

    // Обновляем файл
    await axios.put(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            message: "Update users.json",
            content,
            sha
        },
        { headers }
    );

    console.log("users.json updated in GitHub");

}
// ---------- Telegram ----------
async function sendTelegram(text) {
  console.log("SEND TELEGRAM");
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
      }
    );
    console.log("Telegram OK");
  } catch (err) {
    console.error("Telegram ERROR:", err.response?.data || err.message);
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
  if (checkingOrders) {
    console.log("Previous check still running");
    return;
  }
  checkingOrders = true;
  try {
    await checkOrders(sendTelegram);
  } finally {
    checkingOrders = false;
  }
}, 10000);

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
    time: new Date().toISOString(),
  };

  lastAutomationEvent = test;

  automationCommand = {
    light: true,
    music: true,
    relay1: true,
    relay2: false,
    color: "blue",
  };
const music = automationCommand.music ? "🟢 ON" : "🔴 OFF";
const light = automationCommand.light
    ? automationCommand.color.toUpperCase()
    : "OFF";
  await sendTelegram(`🧪 ТЕСТ

👤 ${test.user}

💶 ${test.amount}

💦 Water: ${test.water} сек
🫧 Foam: ${test.foam} сек
✨ Wax: ${test.coat} сек

🎵 Music: ${music}
💡 Light: ${light}`);
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
        time: new Date().toISOString()
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
        time: new Date().toISOString()
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
// ---------- USERS ----------

// получить admin polzovatel

app.get("/api/users", requireAdmin, (req, res) => {

    res.json(loadUsers());

});


// сохранить пользователя

app.post("/api/users", requireAdmin, (req, res) => {

    const users = loadUsers();

    users[req.body.phone] = req.body;

    saveUsers(users);

    res.json({
        ok: true
    });

});
app.delete("/api/users/:phone", requireAdmin, (req,res)=>{

    const users = loadUsers();
    const phone = decodeURIComponent(req.params.phone);

    if (!users[phone]) {
        return res.status(404).json({
            ok: false,
            message: "User not found"
        });
    }

    delete users[phone];

    saveUsers(users);

    res.json({
        ok: true,
        message: "User deleted"
    });

});
app.post("/api/control", requireAdmin, (req, res) => {

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
app.post("/login", (req, res) => {

    const { login, password } = req.body;

    if (
        login === process.env.ADMIN_LOGIN &&
        password === process.env.ADMIN_PASSWORD
    ) {

        return res.json({
            token: process.env.ADMIN_TOKEN
        });

    }

    res.status(401).json({
        error: "Invalid login"
    });

});
// ---------- LOGIN ----------

app.post("/login", (req, res) => {

    const { login, password } = req.body;

    if (
        login === process.env.ADMIN_LOGIN &&
        password === process.env.ADMIN_PASSWORD
    ) {

        return res.json({
            ok: true,
            token: process.env.ADMIN_TOKEN
        });

    }

    res.status(401).json({
        ok: false,
        message: "Wrong login or password"
    });

});
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
