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
let revenuePerHour = 0;
let carsPerHour = 0;
    
    const today=[];

    for(const order of orders){
console.log(
    order.order_sn,
    order.amount_received,
    typeof order.amount_received
);
        let d = new Date(
            order.create_time.replace(" ","T")
        );

        d.setHours(d.getHours()-3);

if (d < startDate || d > endDate)
    continue;

        today.push(order);

    }

    today.reverse();

    for(const order of today){
const amount = parseFloat(order.amount_received || "0");

        total+=amount;

        count++;

        if(order.pay_type==="coin")
            coin+=amount;

        if(order.pay_type==="credit")
            card+=amount;

        if(amount===0)
            vip++;

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

    vip

};

}

module.exports = {
    getStatistics
};
