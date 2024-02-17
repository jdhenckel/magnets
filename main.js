

class Ball {
    constructor(radius, x, y, angle = null, vx = 0, vy = 0, angularVelocity = 0, mass = 0, tesla = .1) {
        this.r = radius;
        this.x = x;
        this.y = y;
        this.a = angle == null ? Math.random() * Math.PI * 2 : angle;
        this.vx = vx;
        this.vy = vy;
        this.va = angularVelocity;
        this.mass = mass > 0 ? mass : radius^2;
        this.tesla = tesla;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.a);

        // Draw the ball
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI);
        ctx.fillStyle = "#f55";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, this.r, Math.PI, Math.PI * 2);
        ctx.fillStyle = "#5f5";
        ctx.fill();

        // Optional: Draw additional details like outline or tesla field visualization
        // ctx.strokeStyle = "white";
        // ctx.stroke();

        ctx.restore();
    }

    move(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.a += this.va * dt;
    }

    // Add other methods as needed, e.g., for updating position, applying forces, etc.
}


function drawRedBalls(canvasId) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 20;

    // Define ball properties
    let balls = [];
    let r = 10;

    // Draw 10 red balls randomly
    for (let i = 0; i < 10; i++) {
        let x = Math.random() * (canvas.width - 2 * r) + r;
        let y = Math.random() * (canvas.height - 2 * r) + r;
        balls.push(new Ball(r, x, y))
    }

    for (let b of balls) {
        b.draw(ctx);
    }
}

// Draw balls on page load
window.onload = function () {
    drawRedBalls('magnet-canvas');
};
