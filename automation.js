const express = require("express");

const app = express();

app.use(express.json());

let lastEvent = null;

app.post("/event", (req, res) => {

    lastEvent = req.body;

    console.log("========== NEW EVENT ==========");
    console.log(lastEvent);

    res.sendStatus(200);
});

app.get("/event", (req, res) => {
    res.json(lastEvent || {});
});

app.listen(4000, () => {
    console.log("Automation server started");
});
