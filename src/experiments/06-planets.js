// @ts-check
export const name = "Planets";
export const description = "Simulation of planets, showing the complex paths formed by their interactions with gravity";

import p5 from 'p5';

// DISCLAIMER
// For the line trails, I originally called `line()` for every single line
// segment on every planet on the main buffer. This slowed down the sketch
// significantly as well as reducing the max length of the planet's trails. For this
// reason, I sought the help of an LLM in optimizing the code. It came up with the
// idea to use a separate buffer for the trails, and instead of rendering them
// all once per frame it simply draws a background with transparency, naturally
// covering up the trail as time goes on. The original conversation can be found
// below:
// https://claude.ai/share/c40ecdd7-2232-4965-a1e8-9b0291250cd2

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  // gravitational constant
  const GRAVITY = 100;
  const TRAIL_FADE_FACTOR = 20;
  const CENTER = s.createVector(innerWidth/2, innerHeight/2);
  
  let trailBuffer; // Off-screen graphics buffer for trails
  let maxVelocity = 1200;

  // Double clicks reset the canvas, but a click makes the mouse a planet
  // we have to remove the mouse planet when resetting, otherwise the others
  // get slingshotted, which is not ideal
  let mouseCooldown = 0;

  class Planet {
    constructor(mass, color, startPos, immovable = false, visible = true, tangible = true) {
      this.mass = mass;
      this.color = color;
      this.pos = startPos;
      this.vel = s.createVector(0, 0);
      this.lastPos = startPos.copy();
      this.immovable = immovable;
      this.visible = visible;
      // This allows us to 'hide' planets, including them in the
      // planets array but not taking them into account for the physics
      // this allows for 'turning on' planets on demand
      this.tangible = tangible;
    }

    draw() {
      if (!this.visible) return;
      // Draw current position to trail buffer
      // trailBuffer.stroke(this.color);
      // trailBuffer.strokeWeight(2);
      // trailBuffer.line(this.lastPos.x, this.lastPos.y, this.pos.x, this.pos.y);
      
      trailBuffer.stroke(this.color);
      trailBuffer.fill(255);
      trailBuffer.strokeWeight(3);
      trailBuffer.circle(this.pos.x, this.pos.y, this.mass*3);
      
      // Draw planet on main canvas
      s.stroke(this.color);
      s.fill(255);
      s.strokeWeight(3);
      s.circle(this.pos.x, this.pos.y, this.mass*3);
      
      // Update last position
      this.lastPos = this.pos.copy();
    }

    /** @method gravitate
      * calculate the gravitational force applied by another planet.
      * @param {Planet} other
      * @returns {p5.Vector} the gravitational force according to newton
      */
    gravitate(other) {
      const r2 = Math.pow(this.pos.dist(other.pos), 2);
      const f = GRAVITY * this.mass * other.mass / r2;
      return p5.Vector.sub(other.pos, this.pos).mult(f); 
    }

    update(force) {
      const acc = force.div(this.mass);
      this.vel.add(acc);
      this.vel.limit(maxVelocity);
      this.pos.add(p5.Vector.mult(this.vel, s.deltaTime/(1000*3)));
    }
  }

  let planets = [];

  const mousePlanet = new Planet(4, null, CENTER, true, false, false);

  s.doubleClicked = () => {
    // reset positions of planets
    for (let i = 0; i < planets.length-1; i++) {
      planets[i].pos = s.createVector(s.cos(120*i)*80 + s.mouseX, s.sin(120*i)*80 + s.mouseY);
      planets[i].vel = p5.Vector.random2D().normalize().mult(60).div(planets[i].mass);
    }
    // clear all trails
    trailBuffer.clear();
    trailBuffer.background(0);
    mouseCooldown = 1000;
  }

  s.mouseMoved = () => {
    mousePlanet.pos.x = s.mouseX;
    mousePlanet.pos.y = s.mouseY;
  }

  s.mouseDragged = () => {
    mousePlanet.pos.x = s.mouseX;
    mousePlanet.pos.y = s.mouseY;
  }

  s.mousePressed = () => {
    if (mouseCooldown > 0) return;
    mousePlanet.tangible = true;
    maxVelocity = 300;
  }

  s.mouseReleased = () => {
    mousePlanet.tangible = false;
    maxVelocity = 800;
  }

  s.setup = () => {
    s.setAttributes("alpha", true);
    s.createCanvas(innerWidth, innerHeight);
    
    // Create off-screen buffer for trails
    trailBuffer = s.createGraphics(innerWidth, innerHeight);
    trailBuffer.background(255);
    
    s.background(255);
    s.noFill();
    s.angleMode(s.DEGREES);

    for (let i = 0; i < 8; i++) {
      const rand = p5.Vector.random2D().normalize().mult(180);
      planets.push(new Planet(
        Math.floor(s.random(1, 9)),
        s.color(s.random(0, 255), 126, s.random(20, 150)),
        s.createVector(s.cos(120*i)*100, s.sin(120*i)*100).add(CENTER), 
      ));
      planets[i].vel.add(rand.div(planets[i].mass));
    }

    planets.push(mousePlanet);
  };

  s.draw = () => {
    if (mouseCooldown > 0) {
      mouseCooldown -= s.deltaTime;
    }

    // Fade the trail buffer instead of clearing
    trailBuffer.background(255, TRAIL_FADE_FACTOR);
    // trailBuffer.noStroke();
    // trailBuffer.rect(0, 0, innerWidth, innerHeight);
    
    s.background(255);
    s.image(trailBuffer, 0, 0);
    
    // Update physics and draw planets
    for (let i = 0; i < planets.length-1; i++) {
      for (let j = i+1; j < planets.length; j++) {
        const a = planets[i];
        const b = planets[j];
        // skip all calculations if either planet is intangible
        if (!(a.tangible && b.tangible)) continue;

        const force = a.gravitate(b);
        if (!a.immovable) a.update(force.copy());
        if (!b.immovable) b.update(force.mult(-1));
      }
    }
    
    // Draw planets and add new trail segments
    planets.forEach(p => p.draw());
  };
};
