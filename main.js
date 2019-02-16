(function () {
    var canvas = document.getElementById("solarSystemSim");
	var ctx = canvas.getContext("2d");
    var gameEngine = new GameEngine();
    gameEngine.init(ctx);
	gameEngine.start();
})();