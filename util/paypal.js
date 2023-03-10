var base64 = require("base-64");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config()

const PAYPAL_CLIENT_ID = `${process.env.PAYPAL_CLIENT_ID}`
const PAYPAL_SECRET = `${process.env.PAYPAL_SECRET}`
const base = "https://api-m.sandbox.paypal.com";

async function generateAccessToken() {
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_SECRET).toString('base64')
    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const data = await res.json();
    //console.log(data)
    return data.access_token;
}

const verifyPaypalSubscription = async (subscriptionId) => {
    const access_token = await generateAccessToken()
    res = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });
    const data = await res.json();
    //console.log("data " + JSON.stringify(data))
    return {
        status: data.status,
        plan_id: data.plan_id,
    }
}
const cancelSubscription = async(subscriptionId, reason) => {
  const access_token = await generateAccessToken()
    response = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        reason: reason
      })
    });
    //const data = await response.json();
    console.log(response.status)
    return 
}
const getPlans = async() => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v1/billing/plans`

  fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Error retrieving products');
    }
    return response.json();
  })
  .then(data => {
    console.log('Product data:', data);
  })
  .catch(error => {
    console.error(error);
  });
  }

module.exports = {generateAccessToken, verifyPaypalSubscription, cancelSubscription, getPlans}