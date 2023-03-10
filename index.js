var express = require('express')
var app = express()
const cors = require ("cors");
const path = require("path");
require('dotenv').config()
const apiRoutes = require("./routes/api.js");
const paymentRoutes = require("./routes/payment.js");
const cookieParser = require("cookie-parser");

app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



app.use(express.static('./out'))
app.use("/api", apiRoutes);
app.use("/payment", paymentRoutes);

/*
app.get("/", function(req, res){
    return res.json({status: 200})
})*/

// app.post("/", function(req,res){

// })
// app.put("/", function(req,res){

// })
// app.delete("/", function(req,res){

// })


app.get('/', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out", "index.html"));
});
app.get('/imprint', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out", "imprint.html"));
});
app.get('/privacy', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out", "privacy.html"));
});
app.get('/terms', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out", "terms.html"));
});
app.get('/settings', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out", "settings.html"));
});
app.get('/onboarding/plans', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out/onboarding", "plans.html"));
});
app.get('/onboarding/appstore', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out/onboarding", "appstore.html"));
});
app.get('*', (req, res) => {
	return res.sendFile(path.join(__dirname, "./out", "404.html"));
});

app.listen(process.env.PORT || 3000, function(){console.log("Server started")});