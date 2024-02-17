

class Vec2 {
    constructor(x,y) { this.x = x; this.y = y;  }
    dot(u) { return this.x * u.x + this.y * u.y; }
    cross(u) { return this.x * -u.y + this.y * u.x; }
    len2() { return this.dot(this); }
    len() { return Math.sqrt(this.len2()); }
    dist2(u) { return this.subt(u).len2(); }
    dist(u) { return Math.sqrt(this.dist2(u)); }
    add(u) { return new Vec2(this.x + u.x, this.y + u.y); }
    subt(u) { return new Vec2(this.x - u.x, this.y - u.y); }
    neg() { return new Vec2(-this.x, -this.y); }
    mult(a) { return new Vec2(a*this.x, a*this.y); }
    perp() { return new Vec2(-this.y, this.x); }
    dir() { let d = this.len(); return d<1e-10?new Vec2(1,0):this.mult(1/d); }
    // These are mutators!!!
    incr(u) { this.x += u.x; this.y += u.y; return this; }
    scale(a) { this.x *= a; this.y *= a; return this; }
}

class Ball {
    constructor(radius, x, y, angle = null, vx = 0, vy = 0, angularVelocity = 0, mass = 0, tesla = .1) {
        this.r = radius;
        this.pos = new Vec2(x, y);
        this.a = angle == null ? Math.random() * Math.PI * 2 : angle;
        this.vel = new Vec2(vx, vy);
        this.va = angularVelocity;
        this.mass = mass > 0 ? mass : radius^2;
        this.tesla = tesla;
    }

    draw(ctx, scale=1) {
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.a);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI);
        ctx.fillStyle = "#f55";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, this.r, Math.PI, Math.PI * 2);
        ctx.fillStyle = "#5f5";
        ctx.fill();
        ctx.restore();
    }

    hitWalls(w,h) {
        let a = 1; // coeff of restitution
        let b = 0.5; // overlap correction factor
        if (this.pos.x - this.r < 0) {
            if (this.vel.x < 0) this.vel.x = -a*this.vel.x;
            this.pos.x += b*(this.r - this.pos.x);
        }
        else if (this.pos.x + this.r > w) {
            if (this.vel.x > 0) this.vel.x = -a*this.vel.x;
            this.pos.x -= b*(this.pos.x - w + this.r);
        }
        if (this.pos.y - this.r < 0) {
            if (this.vel.y < 0) this.vel.y = -a*this.vel.y;
            this.pos.y += b*(this.r - this.pos.y);
        }
        else if (this.pos.y + this.r > h) {
            if (this.vel.y > 0) this.vel.y = -a*this.vel.y;
            this.pos.y -= b*(this.pos.y - h + this.r);
        }

    }

    bounce(other) {
        // bounce off another ball
        let dp = this.pos.subt(other.pos);
        let dv = this.vel.subt(other.vel);
        if (dp.dot(dv) > 0) 
            return;
        let dist = dp.len();
        let rr = this.r + other.r;
        if (dist < .001 || dist > rr) 
            return;
        let e = 0.9;     // elasticity
        let u = dp.mult(1/dist);
        let j = -(1 + e) * dv.dot(u) / (1/this.mass + 1/other.mass);
        this.vel.incr(u.mult(j/this.mass));
        other.vel.incr(u.mult(-j/other.mass));
    }

    attract(other) {
        // magnetic interaction
    }

    move(dt) {
        this.pos.incr(this.vel.mult(dt));
        this.a += this.va * dt;
    }

    // Add other methods as needed, e.g., for updating position, applying forces, etc.
}


class World {

    constructor() {
        this.canvas = document.getElementById('magnet-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.penalty = 0.5;     // for collision
    }

    resize() {
        this.canvas.width = window.innerWidth - 20;
        this.canvas.height = window.innerHeight - 20;
        this.scale = 10;
        this.w = this.canvas.width / this.scale;
        this.h = this.canvas.height / this.scale;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let b of this.balls) {
            b.draw(this.ctx, this.scale);
        }
    }

    step(dt) {
        for (let b of this.balls) {
            b.move(dt);
            b.hitWalls(this.w,this.h);
        }
        for (let i=0; i<this.balls.length; ++i)
            for (let j=i+1; j<this.balls.length; ++j) {
                this.balls[i].bounce(this.balls[j]);
                this.balls[i].attract(this.balls[j]);
            }
        this.draw();
    }


}


function clamp(a,b,c) {
    return a < b ? b : a > c ? c : a;
}

function startSimulation() {

    w = new World();
    w.resize();
    let r = 3;
    w.balls.push(new Ball(r,20,20,0,-25,-15))
    w.balls.push(new Ball(r,10,20,0,10,0))
    for (let i=0; i<7; ++i) w.balls.push(new Ball(r,30,i*10+16))

    let framesPerStep = 3;
    let frameCounter = 0;
    let lasttm = performance.now();

    function mainloop(tm) {
        if (++frameCounter >= framesPerStep) {
            frameCounter = 0;
            let dt = (tm - lasttm) / 1000;   // elapsed time in seconds
            lasttm = tm;
            w.step(clamp(dt,0,.5));
        }
        requestAnimationFrame(mainloop);
    }
    
    mainloop();

    // Draw 10 red balls randomly
    // for (let i = 0; i < 10; i++) {
    //     let x = Math.random() * (canvas.width - 2 * r) + r;
    //     let y = Math.random() * (canvas.height - 2 * r) + r;
    //     balls.push(new Ball(r, x, y))
    // }

}

// Draw balls on page load
window.onload = function () {
    startSimulation();
};
