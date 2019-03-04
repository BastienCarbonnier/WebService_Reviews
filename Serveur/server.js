"use strict"
var express = require("express");
var app = express();
var md5 = require('js-md5');
var bodyParser = require('body-parser');
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017";
var cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.json());


console.log("Everything is ok !");
