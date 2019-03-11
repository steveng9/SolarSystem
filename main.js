(function () {
    var canvas = document.getElementById("solarSystemSim");
	var ctx = canvas.getContext("2d");
    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
	gameEngine.start();
	var socket = io.connect("http://24.16.255.56:8888");

	window.onload = function () {

		socket.on("load", function (data) {
			console.log(data.data);
			gameEngine.load(data.data);
		});

		var text = document.getElementById("text");
		var saveButton = document.getElementById("save");
		var loadButton = document.getElementById("load");

		saveButton.onclick = function () {
			console.log("save");
			text.innerHTML = "Saved."
			var data = gameEngine.getData();
			socket.emit("save", { studentname: "Steven Golob", statename: "Solar System State", data: data });
		};

		loadButton.onclick = function () {
			console.log("load");
			text.innerHTML = "Loaded."
			socket.emit("load", { studentname: "Steven Golob", statename: "Solar System State" });
		};

	};
})();