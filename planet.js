
var STAR_MASS = 100000;
var STAR_RADIUS = 40;
var MASS_TO_RADIUS_RATIO = 1;
var GRAVITATIONAL_CONSTANT = .2;
var PLANET_GROWTH_RATE = 200;
var DISTANCE_BETWEEN_SHADOWS = 12;




class Body {

	constructor(game, color, x, y, mass) {
		this.game = game;
		this.x = x;
		this.y = y;
		this.removeFromWorld = false;
		this.mass = mass;
		this.color = color;
		this.circle = new BoundingCircle(x, y, 0);
		this.updateRadius();
	}

	update() {
		this.x += this.game.clockTick * this.deltaX;
		this.y += this.game.clockTick * this.deltaY;
		this.circle.updateCoordinates(this.x, this.y);
	}

	draw() {
		var ctx = this.game.ctx;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.circle.radius, 0, Math.PI * 2);
		ctx.fill();

		if (DRAW_OUTLINES) {
			ctx.beginPath();
			ctx.strokeStyle = "white";
			ctx.arc(this.circle.x, this.circle.y, this.circle.radius, 0, Math.PI * 2, false);
			ctx.stroke();
			ctx.closePath();
		}
	}

	setXY(point) {
		this.x = point.x;
		this.y = point.y;
		this.circle.updateCoordinates(this.x, this.y);
	}

	updateRadius() {
		// inverse volume of sphere function: r = (3/4 * V / PI)^-3
		this.circle.radius = Math.cbrt((3/4) * this.mass / Math.PI) * MASS_TO_RADIUS_RATIO;
	}
}


//____________________________________________________________________________________________________



class Planet extends Body {
	constructor(game, color, startX, startY, mass) {
		super(game, color, startX, startY, mass);
		this.star = this.game.star;
		this.lastShadow = {x: this.x, y: this.y, radius: this.circle.radius, color: new RGB(this.color.r / 2, this.color.g / 2, this.color.b / 2)};
	}

	prepareUpdate() {
		for (let i = this.game.bodies.length - 1; i >= 0; i--) {
			let body = this.game.bodies[i];
			if (body !== this) {
				this.addForces(body);
			}
		}
	}

	update() {
		super.update();
		if (distance(this, this.lastShadow) > DISTANCE_BETWEEN_SHADOWS) {
			this.lastShadow = {x: this.x, y: this.y, radius: this.circle.radius, color: new RGB(this.color.r / 2, this.color.g / 2, this.color.b / 2)};
			this.game.trailingCircles.push(this.lastShadow);
		}
	}

	addForces(body) {
		var distanceX = body.x - this.x;
		var distanceY = body.y - this.y;
		var distanceBetween = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
		var acceleration = this.game.clockTick * this.mass * body.mass / Math.pow(distanceBetween, 2) * GRAVITATIONAL_CONSTANT;
		this.deltaX += acceleration * distanceX / distanceBetween;
		this.deltaY += acceleration * distanceY / distanceBetween;
	}

	velocity() {
		return Math.sqrt(Math.pow(this.deltaX, 2) +  Math.pow(this.deltaY, 2));
	}

	setVelocity() {
		var initialVelocity = this.calcInitialVelocity();
		this.deltaX = initialVelocity.deltaX;
		this.deltaY = initialVelocity.deltaY;	
	}

	calcInitialVelocity() {
		var distanceX = this.x - this.star.x;
		var distanceY = this.y - this.star.y;
		var distanceToStar = distance(this, this.star);
		var velocity = Math.sqrt(GRAVITATIONAL_CONSTANT * this.mass * this.star.mass / distanceToStar);
		var angle = Math.atan2(distanceY, distanceX);
		var deltaX = - velocity * Math.sin(angle);
		var deltaY = velocity * Math.cos(angle);
		return {deltaX: deltaX, deltaY: deltaY};
	}
}



//____________________________________________________________________________________________________



class Star extends Body {
	constructor(game, x, y) {
		super(game, new RGB(255, 255, 0), x, y, STAR_MASS);
		this.deltaX = 0;
		this.deltaY = 0;
	}
}



//____________________________________________________________________________________________________




class BoundingCircle {

	constructor(x, y, radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
	}

	updateCoordinates(x, y) {
		this.x = x;
		this.y = y;
	}
}



