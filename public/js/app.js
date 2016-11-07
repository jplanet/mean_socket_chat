angular.module("chatApp", ['ngRoute']).config(function($routeProvider) {
	$routeProvider.when("/", {
		templateUrl : "chat_avail.html",
		controller : "ChatInitController",
	}).when("/login", {
		controller : "LoginController",
		templateUrl : "login.html"
	}).when("/chat/:userId", {
		controller : "ChatController",
		templateUrl : "chat.html"
	}).otherwise({
		redirectTo : "/"
	});
}).service("Users", function($http) {
	this.createUser = function(user) {
		return $http.post("/users", user).then(function(response) {
			return response;
		}, function(response) {
			alert("Error creating user.");
		});
	};
	this.getUser = function(userId) {
		var url = "/users/" + userId;
		return $http.get(url).then(function(response) {
			return response;
		}, function(response) {
			alert("Error finding this contact.");
		});
	};
}).controller("ChatInitController", function($scope, $location) {
	$scope.chat_avail = true;
	$scope.showLogin = function() {
		$location.path("/login");
	};
}).controller("LoginController", function($scope, $location, Users) {

	$scope.startChat = function(user) {
		Users.createUser(user).then(function(doc) {
			var chatUrl = "/chat/" + doc.data._id;
			$location.path(chatUrl);
		}, function(response) {
			alert(response);
		});
	};
}).controller("ChatController", function($scope, $routeParams, $http, Users) {
	Users.getUser($routeParams.userId).then(function(doc) {
		$scope.user = doc.data;
		$('#msg').focus();
		$scope.sendMessage = function() {
			$http({
				method : 'POST',
				url : '/messages',
				data : {
					msg : $('#msg').val(),
					username : $('#username').text()
				}
			}).then(function successCallback(response) {
				$('#msg').val('');
			}, function errorCallback(response) {
				alert('Message could not be sent');
			});
			return false;
		};
		var socket = io();
		socket.on('chat message', function(msg) {
			$('#chatlist').append($('<li>').html(msg));
			$("#chatlist").animate({ scrollTop: $("#chatlist")[0].scrollHeight}, 1000);
		});
	}, function(response) {
		alert(response);
	});

});
