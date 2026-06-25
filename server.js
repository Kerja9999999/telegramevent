const express=require('express');
const Stripe=require('stripe');
const axios=require('axios');
const app=express();
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);

app.post('/stripe-webhook',express.raw({type:'application/json'}),async(req,res)=>{
 const sig=req.headers['stripe-signature'];
 let event;
 try{
   event=stripe.webhooks.constructEvent(req.body,sig,process.env.STRIPE_WEBHOOK_SECRET);
 }catch(e){return res.status(400).send(e.message);}
 if(event.type==='checkout.session.completed'){
   const s=event.data.object;
   const c=s.customer_details||{};
   const msg=`💰 Новая оплата Stripe

💶 ${((s.amount_total||0)/100).toFixed(2)} EUR
👤 ${c.name||'-'}
📧 ${c.email||'-'}
📱 ${c.phone||'-'}

🆔 ${s.id}`;
   await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{
      chat_id:process.env.TELEGRAM_CHAT_ID,
      text:msg
   }).catch(err=>console.error(err.response?.data||err.message));
 }
 res.json({received:true});
});

app.get('/',(_,res)=>res.send('OK'));
app.listen(process.env.PORT||3000);
