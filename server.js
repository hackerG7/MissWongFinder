var express = require("express");
var value_port = 569;
var app = express();
var server = app.listen(value_port);
app.use(express.static("public"));
console.log("server starting on localhost:"+value_port);