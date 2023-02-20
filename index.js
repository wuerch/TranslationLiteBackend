var express = require('express')
var app = express()
const cors = require ("cors");
const path = require("path");
require('dotenv').config()
const apiRoutes = require("./routes/api.js");


//app.use(cors({ origin: "*", credentials: true }))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//app.use(express.static('public/dist'))
app.use("/api", apiRoutes);

app.get("/", function(req, res){
    return res.json({status: 200})
})

app.post("/", function(req,res){

})
app.put("/", function(req,res){

})
app.delete("/", function(req,res){

})

/*
app.get('/', (req, res) => {
	return res.sendFile(path.join(__dirname, "./public/dist", "index.html"));
});*/

app.listen(process.env.PORT || 3000, function(){console.log("Server started")});