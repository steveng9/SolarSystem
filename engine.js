
var DRAW_OUTLINES = false;

var TRAILING_FADE_PER_SECOND = 10;

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();







class GameEngine {
    constructor() {
        this.star = null;
        this.fetusPlanet = null;
        this.planets = [];
        this.trailingCircles = [];
        this.bodies = [];
        this.ctx = null;
        this.surfaceWidth = null;
        this.surfaceHeight = null;
        this.drawTrails = false;

    }
    init(ctx) {
        this.ctx = ctx;
        this.surfaceWidth = this.ctx.canvas.width;
        this.surfaceHeight = this.ctx.canvas.height;
        this.star = new Star(this, this.surfaceWidth / 2, this.surfaceHeight / 2);
        this.bodies.push(this.star);
        this.timer = new Timer();
        this.startInput();
    }
    start() {
        console.log("starting simulation");
        var that = this;
        (function gameLoop() {
            that.loop();
            requestAnimationFrame(gameLoop);
        })();
    }

    loop() {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    }

    update() {
        if (this.fetusPlanet) {
            this.growFetusPlanet();
        }
        for (var i = this.planets.length - 1; i >= 0; i--) {
            this.planets[i].prepareUpdate();
        }
        for (var i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].update();
            if (this.bodies[i].removeFromWorld) {
                this.bodies.splice(i, 1);
            }
        }
        for (var i = this.trailingCircles.length - 1; i >= 0; i--) {
            let color = this.trailingCircles[i].color;
            let subtractor = TRAILING_FADE_PER_SECOND * this.clockTick;
            color.r -= subtractor;
            color.g -= subtractor;
            color.b -= subtractor;
            if (color.r < 0 && color.g < 0 && color.b < 0) {
                this.trailingCircles.splice(i, 1);
            }
        }
        // console.log(this.trailingCircles.length);
        this.handleCollisions();
    }
    draw() {
        this.ctx.clearRect(0, 0, this.surfaceWidth, this.surfaceHeight);
        this.ctx.save();
        if (this.drawTrails) {
            for (var i = 0; i < this.trailingCircles.length; i++) {
                let circle = this.trailingCircles[i];
                this.ctx.beginPath();
                this.ctx.fillStyle = circle.color;
                this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, false);
                this.ctx.fill();
                this.ctx.closePath();
            }
        }
        if (this.fetusPlanet) {
            this.fetusPlanet.draw();
        }
        for (var i = this.bodies.length - 1; i >= 0; i--) {
            this.bodies[i].draw();
        }
        if (!this.started) {
            this.drawMessage();
        }
        this.ctx.restore();
    }

    addPlanet(planet) {
        this.planets.push(planet);
        this.bodies.push(planet)
    }

    handleCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            let body1 = this.bodies[i];
            for (let j = i+1; j < this.bodies.length; j++) {
                let body2 = this.bodies[j];
                if (!body1.removeFromWorld && !body2.removeFromWorld && collideCircleWithCircle(body1.circle, body2.circle)) {
                    var bigBody = body2.mass > body1.mass? body2 : body1;
                    var smallBody = body2.mass > body1.mass? body1 : body2;

                    // new velocity is weighted average of two bodies
                    bigBody.deltaX = (body2.deltaX * body2.mass + body1.deltaX * body1.mass) / (body1.mass + body2.mass);
                    bigBody.deltaY = (body2.deltaY * body2.mass + body1.deltaY * body1.mass) / (body1.mass + body2.mass);

                    bigBody.color = weightedAverageOfColors(body1, body2);

                    bigBody.mass += smallBody.mass;
                    bigBody.updateRadius();
                    smallBody.removeFromWorld = true;
                }
            }
        }
    }

    drawMessage() {
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.font = "30px Times New Roman MS";
        this.ctx.fillText("Solar System", this.surfaceWidth/2, 100);
        this.ctx.font = "20px Times New Roman MS";
        this.ctx.fillText("Instructions:", this.surfaceWidth/2, 150);
        this.ctx.fillText("Click, hold, drag, relesase to birth a new planet", this.surfaceWidth/2, 170);
        this.ctx.fillText("Press 'T' to toggle planet trails display", this.surfaceWidth/2, 190);
        this.ctx.fillText("Click to start", this.surfaceWidth/2, 500);
    }

    conceivePlanet() {
        this.fetusPlanet = new Planet(this, getRandomColor(), this.mouse.x, this.mouse.y, 0);
        this.wombDuration = 0;
    }

    growFetusPlanet() {
        this.fetusPlanet.setXY(this.mouse);
        this.wombDuration += this.clockTick;
        // Mass grows cubically
        this.fetusPlanet.mass = Math.pow(this.wombDuration, 3) * PLANET_GROWTH_RATE;
        this.fetusPlanet.updateRadius();
    }

    birthPlanet() {
        this.fetusPlanet.setVelocity();
        this.addPlanet(this.fetusPlanet);
        this.fetusPlanet = null;
    }

    startInput () {
        console.log('Starting input');
        var that = this;

        var getXandY = e => {
            var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
            var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;
            return { x: x, y: y };
        }

        this.ctx.canvas.addEventListener("keypress", (e) => {
            if (e.code == 'KeyT') { 
                this.drawTrails = !this.drawTrails;
            }
            e.preventDefault();
        }, false);



        // Mouse
        this.ctx.canvas.addEventListener("click", function(e) {
            that.started = true;
        }, false);

        this.ctx.canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        }, false);

        this.ctx.canvas.addEventListener("mousemove", function(e) {
            that.mouse = getXandY(e);
            // console.log(e);
        }, false);

        this.ctx.canvas.addEventListener("mousedown", function (e) {
            that.conceivePlanet();
        }, false);

        this.ctx.canvas.addEventListener("mouseup", function (e) {
            that.birthPlanet();
        }, false);

        console.log('Input started');
    }
}





class Timer {
    constructor() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
    }
    tick() {
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;
        var gameDelta = Math.min(wallDelta, this.maxStep); // TODO: are these 3  lines okay?
        this.gameTime += gameDelta;
        return gameDelta;
    }
}







var distance = function(a, b) {
    return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
}

var collideCircleWithCircle = function(circle1, circle2) {
    var dist = distance(circle1, circle2);
    result = false;
    if (dist <= circle1.radius + circle2.radius) {
        result = true;
    }
    return result;
}

var getRandomColor = function() {
    return new RGB(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
}

var weightedAverageOfColors = function(body1, body2) {
    console.log(body1.color);
    // dont weight colors by mass, or the difference will be less noticable 
    finalRgb = new RGB((body1.color.r * body1.circle.radius + body2.color.r * body2.circle.radius) / (body1.circle.radius + body2.circle.radius),
                        (body1.color.g * body1.circle.radius + body2.color.g * body2.circle.radius) / (body1.circle.radius + body2.circle.radius),
                        (body1.color.b * body1.circle.radius + body2.color.b * body2.circle.radius) / (body1.circle.radius + body2.circle.radius));
    console.log(finalRgb);
    return finalRgb;

}

class RGB {
    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.string = this.toString(); 
    }

    toString() {
        return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')';
    }

}



