const router = require("express").Router();
const { db, admin, verifyToken } = require("../util/firebase");
const { generateAccessToken, verifyPaypalSubscription, cancelSubscription, getPlans} = require("../util/paypal.js")
const { createStripeSession, createStripeCustomer, verifyStripeSubscription } = require("../util/stripe.js")

//function routes(app) {
  router.get("/test", async (req,res) => {
    return res.json({status: 200, data: "Hi"})
  })
    router.get("/capture/paypal", async (req,res) => {
        const {subscriptionId, token, plan } = req.query;
        const { uid }  = await verifyToken(token)
        if (!uid){
            return res.json({ message: 'Invalid token' });
        }      
        //Check the plan on paypal
        const subscriptionDetails = await verifyPaypalSubscription(subscriptionId)
    
        //Save the user into db
        const data = {
            subscriptionId: subscriptionId,
            subscriptionPlan: plan,
            subscriptionProvider: "PAYPAL",
            subscriptionStatus: subscriptionDetails.status
        }
        try {
            await db.collection("users").doc(uid).set(data, {merge: true})
            res.redirect("/appstore")
        } catch (e) {
            return res.json({ message: 'Internal Error' });
        }
      })
      
      // router.post("/cancel/paypal", async (req, res) => { 
      //   const subsciptionId = req.body.subsciptionId
      //   const reason = req.body.reason 
      //   cancelSubscription(subsciptionId, reason)
      //   return res.json({status: 200})
      // })
      router.get("/stripe", async (req,res) => {
        const productId = process.env.STRIPE_PRICE_ID
        const { token } = req.query
        const { uid, email } = await verifyToken(token)
        if (!uid){ //Not valid user
          return res.redirect("/")
        }
        const costumer_id = await createStripeCustomer(email)
        const sessionUrl = await createStripeSession(productId, `${process.env.ROOT}/payment/capture/stripe?token=${token}&costumer_id=${costumer_id}`, costumer_id);
        return res.redirect(sessionUrl) //redirecting the user to the stripe checkout
      })

      router.get("/capture/stripe", async (req,res) => {
          const { token , costumer_id } = req.query
          const { uid } = await verifyToken(token)
          if (!uid){
            return res.redirect("/")
          }
          const subscription = await verifyStripeSubscription(costumer_id);
          if( subscription.data[0].status == "active"){
            //Add to db
            const data = {
              subscriptionId: costumer_id,
              subscriptionPlan: "premium",
              subscriptionProvider: "STRIPE",
              subscriptionStatus: "ACTIVE"
            }
            try {
                await db.collection("users").doc(uid).set(data, {merge: true})
                return res.redirect("/onboarding/appstore")
            } catch (e) {
                return res.json({ message: 'Internal Error' });
            } 
          }
      })
      router.get("/plan", async (req,res) => {
        //this route verifies the current plan of the user   
        console.log("Got request") 
        const { uid }  = await verifyToken(req.query.token)
        const user = await db.collection("users").doc(uid).get()
        if(!user._fieldsProto){ //If no document is found create a document with a free plan
          const data = {
            subscriptionPlan: "free"
          }
          await db.collection("users").doc(uid).set(data)
          return res.json({ status: 200, subsciptionPlan : "free"})
        }
        if (user._fieldsProto.subscriptionPlan.stringValue == "free") { 
          return res.json({status: 200, subscriptionPlan: "free"})
        }
        if (user._fieldsProto.subscriptionPlan.stringValue == "special") { 
          return res.json({status: 200, subscriptionPlan: "special"})
        }
        var firebaseSubscriptionId = user._fieldsProto.subscriptionId.stringValue
        var firebaseSubscriptionProvider = user._fieldsProto.subscriptionProvider.stringValue
        var firebaseSubscriptionStatus = user._fieldsProto.subscriptionStatus.stringValue
        //Different handling based on the subscription Service
        if (firebaseSubscriptionProvider == "PAYPAL"){
          var paypalSubscriptionDetails = await verifyPaypalSubscription(firebaseSubscriptionId) //Current subscription details
          if (firebaseSubscriptionStatus != paypalSubscriptionDetails.status){ //If the db status don't match with the status of the api update the subscription in the db
            const data = {
              subscriptionStatus: paypalSubscriptionDetails.status
            }
            await db.collection("users").doc(uid).set(data, {merge: true})
          }
          return res.json({status: 200, subscriptionPlan: user._fieldsProto.subscriptionPlan.stringValue, subscriptionId: subscriptionId, subscriptionPlanId: subscriptionDetails.plan_id, subscriptionStatus: subscriptionDetails.status})
        }else if(firebaseSubscriptionProvider == "STRIPE"){
          const stripeSubscriptionDetails = await verifyStripeSubscription(firebaseSubscriptionId);
          var stripeSubscriptionStatus = stripeSubscriptionDetails.data[0].status;
          if(stripeSubscriptionStatus == "active"){
            stripeSubscriptionStatus = "ACTIVE"
          }else{
            stripeSubscriptionStatus = "EXPIRED"
          }
          if( firebaseSubscriptionStatus != stripeSubscriptionStatus){
          
            const data = {
              subscriptionStatus: stripeSubscriptionStatus
            }
            await db.collection("users").doc(uid).set(data, {merge: true})
          } 
          return res.json({status: 200, subscriptionPlan: "premium", subscriptionId: firebaseSubscriptionId, subscriptionStatus: stripeSubscriptionStatus})
        }
      })
  //return router;
//}

module.exports = router;