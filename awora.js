
const axios = require("axios");
const fs = require("fs");

const API =
"https://en.awoara.com.cn/mer/store/order/smart_order/lst";

let lastOrder = "";

if (fs.existsSync("./lastOrder.json")) {
    lastOrder = JSON.parse(
        fs.readFileSync("./lastOrder.json")
    ).order;
}

async function checkOrders(sendTelegram) {

    try {

        const res = await axios.get(API, {

            headers: {
                "X-Token": process.env.AWORA_TOKEN
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
                is_api: 0

            }

        });

        const list = res.data.data.list;

        if (!list.length)
            return;

        list.reverse();

        for (const order of list) {

            if (order.order_sn <= lastOrder)
                continue;

            lastOrder = order.order_sn;

            fs.writeFileSync(
                "./lastOrder.json",
                JSON.stringify({ order: lastOrder })
            );

            sendTelegram(order);

        }

    } catch (e) {

        console.log(e.message);

    }

}

module.exports = checkOrders;
