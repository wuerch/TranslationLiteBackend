const Stripe = require("stripe");
//export in order to only create this one time and import it in other files
const stripe = Stripe(process.env.STRIPE_SECRET, {
	apiVersion: "2020-08-27"
})

const createStripeCustomer = async (email) => {
    const customer = await stripe.customers.create(
        {
            email,
        },
        {
            apiKey: process.env.STRIPE_SECRET,
        }
    )
    //save costumer.id into db
    return customer.id
}

const createStripeSession = async (price_id, success_url, customer_id) => {
    const session = await stripe.checkout.sessions.create({
        mode: "subscription", //or "payment" for single payment
        payment_method_types: ["card"],
        line_items: [ //this can be multiple things, because the user can buy multiple things
          {
            price: price_id, //Add here the price id
            quantity: 1,
          }
        ],
        customer: customer_id,
        success_url: `${success_url}`,
        cancel_url: `${process.env.ROOT}`,  
      }, {apiKey: process.env.STRIPE_SECRET}
    )
    return session.url
}

const getStripeProducts = async () => {
    const prices = await stripe.prices.list({
        apiKey: process.env.STRIPE_SECRET,
    });
    return prices
}
const verifyStripeSubscription = async (costumer_id) => {
    const subscriptions = await stripe.subscriptions.list(
        {
            customer: costumer_id,
            status: "all",
            expand: ["data.default_payment_method"]
        },
        {
            apiKey: process.env.STRIPE_SECRET
        }
    )
    return subscriptions
}
module.exports={createStripeSession, getStripeProducts, createStripeCustomer, verifyStripeSubscription}