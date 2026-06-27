if (order.pay_type === "coin") {

    const minutes = Number(order.prepay_money);

    switch (minutes) {
        case 1:
            amount = "0.50 EUR";
            break;

        case 3:
            amount = "1.00 EUR";
            break;

        case 6:
            amount = "2.00 EUR";
            break;

        default:
            amount = `${minutes} мин`;
    }

} else {

    amount =
      `${Number(order.prepay_money).toFixed(2)} ${order.merchant?.currency_code || ""}`;

}
