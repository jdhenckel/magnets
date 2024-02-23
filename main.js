
function round(x,dig=7) {
    let s = x.toFixed(dig);
    //return s;
    let i = s.length -1;
    while (i > 1 && s[i]=='0') --i;
    return s.substring(0,i+1);
}


function print(s) {
    document.getElementById('data').innerHTML = s;
}

class Vec2 {
    constructor(x=0,y=0) { this.x = x; this.y = y;  }
    static fromRad(a) { return new Vec2(Math.cos(a),Math.sin(a)); }
    static fromDeg(a) { return Vec2.fromRad(a * Math.Deg); }
    static zero() { return new Vec2(); }
    toString(dig=7) { return `[${round(this.x,dig)},${round(this.y,dig)}]`; }
    dot(u) { return this.x * u.x + this.y * u.y; }
    perpdot(u) { return -this.y * u.x + this.x * u.y; }
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
    // Caution: These are mutators!!!
    set(x,y) { this.x = x; this.y = y; return this; }
    incr(u,a=1) { this.x += u.x*a; this.y += u.y*a; return this; }
    scale(a) { this.x *= a; this.y *= a; return this; }
}

class Ball {
    // NOTE all angles are specified in degrees, stored in radians
    constructor(radius, x, y, angle = null, vx = 0, vy = 0, angularVelocity = 0, mass = 0, tesla = .1) {
        const rad = Math.PI/180;
        this.r = radius;
        this.pos = new Vec2(x, y);
        this.a = angle == null ? Math.random() * Math.PI * 2 : angle * rad;
        this.vel = new Vec2(vx, vy);
        this.va = angularVelocity * rad;
        this.mass = mass > 0 ? mass : 1; //radius*radius;
        this.tesla = tesla;
        this.force = Vec2.zero();
        this.torque = 0;
    }

    toString() {
        return `Ball[r=${this.r},pos=${this.pos},a=${this.a},vel=${this.vel},va=${this.va},mass=${this.mass},tesla=${this.tesla}]`;
    }

    draw(ctx, scale=1) {
        let a = Math.PI / 2;
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.a);
        ctx.beginPath();
        ctx.arc(0, 0, this.r, a, 3*a);
        ctx.fillStyle = "#f55";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 3*a, a);
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
        let e = 0.2;     // elasticity
        let u = dp.mult(1/dist);
        let j = -(1 + e) * dv.dot(u) / (1/this.mass + 1/other.mass);
        this.vel.incr(u.mult(j/this.mass));
        other.vel.incr(u.mult(-j/other.mass));
        let b = 0.95; // overlap correction factor
        if (b > 0) {
            let M = this.mass + other.mass;
            let d = rr - dist;
            this.pos.incr(u,b*d*other.mass/M);
            other.pos.incr(u,-b*d*this.mass/M);
        }
    }

    attract(other) {
        // magnetic interaction
        // see https://physics.stackexchange.com/a/426091/44791
        let r = this.pos.subt(other.pos);
        let d = r.len();
        if (d < .001) 
            return;
        let d2 = d*d;
        let d3 = d2*d;
        let d5 = d2*d3;
        let e1 = Vec2.fromRad(this.a);
        let e2 = Vec2.fromRad(other.a);
        let c = e1.dot(e2);
        let c1 = e1.dot(r);
        let c2 = e2.dot(r);
        let A = 10000; //this.tesla * other.tesla * 10000;// / 9e9;      // Coulombs constant
        let F1 = r.mult(c - 5*c1*c2/d2).add(e1.mult(c2)).add(e2.mult(c1)).mult(3*A/d5);
        let Fr = r.mult(F1.dot(r)/d2);
        let Fp = F1.subt(Fr);
        let T1 = (-A/d3)*e1.perpdot(e2.subt(r.mult(3*c2/d2)));
        let T2 = (-A/d3)*e2.perpdot(e1.subt(r.mult(3*c1/d2)));
        let Err = T1 + T2 + r.perpdot(F1);
        // console.log(`d = ${round(d)}, e1 = ${e1}, e2 = ${e2}, 
        // c = ${round(c)}, A = ${round(A)}, c1 = ${round(c1)}, c2 = ${round(c2)}, 
        // F1 = ${F1}, Fr = ${Fr}, T1 = ${round(T1)}, T2 = ${round(T2)}, 
        // Fp = ${Fp}, r = ${r}, Err = ${round(Err)}`);
        this.force.incr(F1);
        this.torque += T1;
        other.force.incr(F1,-1);
        other.torque += T2;
    }

    move(dt) {
        this.vel.incr(this.force, dt);
        this.pos.incr(this.vel, dt);
        this.va += this.torque * dt;
        this.a += this.va * dt;
        this.force.set(0,0);
        this.torque = 0;
        this.va *= 0.978;      // Angular damping
        this.vel.scale(.978);    // linear damping
    }
}


class World {

    constructor() {
        this.canvas = document.getElementById('magnet-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.gravity = new Vec2();
        let sensor = new GravitySensor({ frequency: 10 });
        sensor.addEventListener('reading',() => {
            let g = 9.8;
            this.gravity.set(-g*sensor.x, g*sensor.y);
        });
    }

    resize() {
        this.canvas.width = window.innerWidth - 6;
        this.canvas.height = window.innerHeight - 80;
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
        print('gravity ' + this.gravity);
        for (let b of this.balls) {
            b.move(dt);
            b.hitWalls(this.w,this.h);
            b.force.incr(this.gravity);
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
    w.balls.push(new Ball(r,20,20,0,0,0,50));//,-25,-15))
    w.balls.push(new Ball(r,10,20,0));//,10,0))
    for (let i=0; i<5; ++i) w.balls.push(new Ball(r,30,i*10+16))
    for (let i=0; i<5; ++i) w.balls.push(new Ball(r,40,i*10+16))
    for (let i=0; i<5; ++i) w.balls.push(new Ball(r,50,i*10+16))

    let framesPerStep = 3;
    let frameCounter = -1;
    let lasttm = performance.now();

    function mainloop(tm) {
        if (++frameCounter >= framesPerStep) {
            frameCounter = 0;
            let dt = (tm - lasttm) / 1000;   // elapsed time in seconds
            lasttm = tm;
            w.step(clamp(dt, .01, .5));
        }
        requestAnimationFrame(mainloop);
    }
    
    mainloop(0);
    return w;
}

// Draw balls on page load
addEventListener('resize', () => {
    console.log('resize');
    if (window.hasOwnProperty('world'))
        window.world.resize();
    return true;
});

// Draw balls on page load
addEventListener('load', () => {
    console.log('load');
    window.world = startSimulation();
    return true;
});
