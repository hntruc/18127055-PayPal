const express = require('express');
const paypal = require('paypal-rest-sdk');
const fs=require('fs');
const exphdbs=require('express-handlebars');
var path=require('path');
const app = express();

app.set('views',path.join(__dirname,"views"));
app.engine('handlebars',exphdbs({defaultLayout:'main'}));
app.set('view engine','handlebars');

var items = [{
    "name": "Head First JavaScript Programming: A Brain-Friendly Guide 1st Edition",
    "sku": "01",
    "price": "28.00",
    "currency": "USD",
    "quantity": 2
},
{
    "name": "Head First Python: A Brain-Friendly Guide 2nd Edition",
    "sku": "02",
    "price": "60.00",
    "currency": "USD",
    "quantity": 1
},
{
    "name": "Learn Python 3 the Hard Way",
    "sku": "03",
    "price": "17.00",
    "currency": "USD",
    "quantity": 1
}]

var total = 0;
for (let i=0; i<items.length;i++){
    total += parseFloat(items[i].price)*items[i].quantity;
}

// Config PayPal
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'ATY9aOyCSuntd63fC9KQJII4cN2IrkpfdCtvRy803sWo3VwTIfbnYsVQ05voqsSHYkCOND2US-7QG9LL', //Lay trong tai khoan sandbox
    'client_secret': 'ELybaHiA4KOZjLPDOJs_ZCBt0q2sDEw6qAMQVduHAKVMtTK9lMpy-Aj9aR15dvZ2hVbMvDgRRlRelGsF' //Lay trong tai khoan sandbox
})

// Trang chu
app.get('/',function(req,res){
    res.render('index.handlebars',{"items":items});
})

app.post('/pay', function(req,res){
    var host = req.get('host');
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `http://${host}/success`, //khi thanh toan thanh cong
            "cancel_url": `http://${host}/cancel` // khi thanh toan that bai
        },
        "transactions": [{
            "item_list": {
                "items": items
            },
            "amount": {
                "currency": "USD",
                "total": total.toString()
            },
            "description": "Demo PayPal SandBox"
        }]
    };

    // Tao payment
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i<payment.links.length;i++)
            {
                if (payment.links[i].rel === 'approval_url')
                {
                    res.redirect(payment.links[i].href);
                    console.log(payment);
                }
            }
        }
    });
    
})

app.get('/success', function(req,res){
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    var execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": total.toString()
            }
        }]
    };

    // Thuc hien payment
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            res.render('fail.handlebars')
        } else {
            res.render('success.handlebars');  
            console.log(payment);
        }
});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function(){
    console.log(`Listening at port ${PORT}`);
});