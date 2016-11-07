var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var format = require('date-format');

var CONTACTS_COLLECTION = "contacts";
var USERS_COLLECTION = "users";
var MESSAGES_COLLECTION = "users";

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

var db;
var mongo_url;
//toggle local/heroku environment
//mongo_url = "mongodb://127.0.0.1:27017/chatDb";
mongo_url = process.env.MONGODB_URI;

mongodb.MongoClient.connect(mongo_url, function(err, database) {
	if (err) {
		console.log(err);
		process.exit(1);
	}
	db = database;
	console.log("Database connection ready");
});

// Register events on socket connection
io.on('connection', function(socket) {
	console.log('a user connected');
	socket.on('chat message', function(msg) {
		io.emit('chat message', msg);
		console.log('message: ' + msg);
	});
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});
});
// Initialize the app.
http.listen(process.env.PORT || 5000, function() {
	console.log('listening');
});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
	console.log("ERROR: " + reason);
	res.status(code || 500).json({
		"error" : message
	});
}

app.post("/users", function(req, res) {
	var newUser = req.body;
	newUser.createDate = new Date();
	//simplistic server-side validation
	if (!(req.body.name || req.body.email)) {
		handleError(res, "Invalid user input", "Must provide name and email.", 400);
	}

	db.collection(USERS_COLLECTION).insertOne(newUser, function(err, doc) {
		if (err) {
			handleError(res, err.message, "Failed to create new user.");
		} else {
			res.status(201).json(doc.ops[0]);
		}
	});
});

app.get("/users/:id", function(req, res) {
	db.collection(USERS_COLLECTION).findOne({
		_id : new ObjectID(req.params.id)
	}, function(err, doc) {
		if (err) {
			handleError(res, err.message, "Failed to get user");
		} else {
			res.status(200).json(doc);
		}
	});
});

//Drastically simple for the purpose of this exercise. Would prefer to use a relational schema associating messages with "conversations"
//and limit to one agent and one customer
app.post("/messages", function(req, res) {
	var newMessage = req.body;
	newMessage.createDate = format('hh:mm:ss', new Date());
	
	db.collection(MESSAGES_COLLECTION).insertOne(newMessage, function(err, doc) {
		if (err) {
			handleError(res, err.message, "Failed to create message");
		} else {
			io.emit('chat message', newMessage.createDate+': '+newMessage.username+': '+newMessage.msg);
			res.status(201).json(doc.ops[0]);
		}
	});
});
