const axios = require("axios");

const API =
    "https://en.awoara.com.cn/mer/store/order/smart_order/lst";

async function getOrders() {

    const res = await axios.get(API, {

        headers: {
            "X-Token": process.env.AWORA_TOKEN,
            Accept: "application/json"
        },

        params: {
            order_sn:"",
            order_type:-1,
            keywords:"",
            membercard:"",
            status:"",
            date:"",
            page:1,
            limit:500,
            type:1,
            username:"",
            order_id:"",
            activity_type:"",
            location_id:"",
            device_id:"",
            pay_type:"",
            open_type:"",
            min:0,
            max:0,
            machine_type:"",
            order_ch:"",
            is_api:0
        }

    });

    return res.data.data.list || [];

}

async function getDetail(orderSn) {

    const res = await axios.get(
        "https://en.awoara.com.cn/mer/store/order/smart_order/detail",
        {
            headers: {
                "X-Token": process.env.AWORA_TOKEN,
                Accept: "application/json"
            },
            params: {
                id: orderSn
            }
        }
    );

    return res.data.data;

}

// ---------- РАСЧЁТ СУММЫ ----------
// Монеты делим на 2
// Остальное оставляем как было: /100

function calculateAmount(value, payType) {

    const amount = Number(value || 0);

    if (payType === "coin") {
        return amount / 2;
    }

    return amount / 100;
}

function sameDay(date){

    const now = new Date();

    return (

        date.getDate()==now.getDate() &&
        date.getMonth()==now.getMonth() &&
        date.getFullYear()==now.getFullYear()

    );

}

async function getStatistics(startDate, endDate) {

    const orders = await getOrders();

    let total = 0;
    let count = 0;

    let firstOrder = "";
    let lastOrder = "";

    let card = 0;
    let coin = 0;

    let vip = 0;
    let vipTotal = 0;
    let usersTotal = 0;

    let revenuePerHour = 0;
    let carsPerHour = 0;

    const today=[];

    for(const order of orders){

        let d = new Date(
            order.create_time.replace(" ","T")
        );

        d.setHours(d.getHours()+6);

        if (d < startDate || d > endDate)
            continue;

        today.push(order);

    }

    today.reverse();

    for (const order of today) {

        let amount = 0;
        let info = null;

        try {

            const detail = await getDetail(order.order_sn);

            info = detail?.body?.data?.order_info;

            if (info) {

                // VIP-карта
                if (
                    Number(info.card_type) === 2 &&
                    Number(info.amount_receivable || 0) > 0
                ) {

                    // VIP оставляем как было
                    amount =
                        Number(info.amount_receivable) / 100;

                    vip++;
                    vipTotal += amount;

                } else {

                    // Монеты / карты
                    amount = calculateAmount(
                        info.amount_received,
                        order.pay_type
                    );

                }

            } else {

                // Если detail не пришёл
                amount = calculateAmount(
                    order.amount_received,
                    order.pay_type
                );

            }

        } catch {

            // Если произошла ошибка
            amount = calculateAmount(
                order.amount_received,
                order.pay_type
            );

        }

        total += amount;

        count++;

        if(order.pay_type==="coin")
            coin += amount;

        if(order.pay_type==="credit"){
            card += amount;
            usersTotal += amount;
        }

    }

    if(today.length){

        firstOrder=today[0].order_sn;
        lastOrder=today[today.length-1].order_sn;

    }

    const hours = Math.max(
        1,
        (endDate - startDate) / (1000 * 60 * 60)
    );

    revenuePerHour = total / hours;
    carsPerHour = count / hours;

    return{

        total,

        count,

        average:
            count ? total/count : 0,

        revenuePerHour,

        carsPerHour,

        firstOrder,

        lastOrder,

        card,

        coin,

        vip,

        vipTotal,

        usersTotal

    };

}

module.exports = {
    getStatistics
};
