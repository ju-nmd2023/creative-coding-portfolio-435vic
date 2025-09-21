// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "example";
export const description = "example desc";

import p5 from 'p5';

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  // gravitational constant
  const GRAVITY = 100;
  // max length of trail
  const TRAIL_MAX = 400;

  class Planet {
    constructor(mass, color, startPos, immovable = false) {
      this.mass = mass;
      this.color = color;
      this.pos = startPos;
      this.vel = s.createVector(0, 0);
      // array of past positions
      this.trail = [this.pos.copy()];
      this.immovable = immovable;
    }

    draw() {
      s.noStroke();
      s.fill(this.color);
      s.circle(this.pos.x, this.pos.y, this.mass*3);
      s.noFill();
      for (let i = 1; i < this.trail.length; i++) {
        const current = this.trail[i];
        const last = this.trail[i-1];
        this.color.setAlpha(s.map(i, 0, this.trail.length-1, 0, 190));
        s.stroke(this.color);
        s.fill(this.color);
        s.line(last.x, last.y, current.x, current.y);
      }
      this.color.setAlpha(255);
      s.endShape();
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
      this.trail.push(this.pos.copy());
      if (this.trail.length > TRAIL_MAX) {
        this.trail = this.trail.slice(this.trail.length-TRAIL_MAX);
      }
      this.pos.add(p5.Vector.mult(this.vel, s.deltaTime/1000));
    }
  }

  let planets = [];

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(0);
    s.noFill();
    s.angleMode(s.DEGREES);

    for (let i = 0; i < 3; i++) {
      planets.push(new Planet(
        Math.floor(s.random(1, 9)),
        s.color(s.random(0, 255), 126, s.random(20, 150)),
        s.createVector(s.cos(120*i)*100, s.sin(120*i)*100).add(s.createVector(innerWidth/2, innerHeight/2)), 
      ));
    }
  };

  s.draw = () => {
    s.background(0);
    planets.forEach(p => p.draw());
    for (let i = 0; i < planets.length-1; i++) {
      for (let j = i+1; j < planets.length; j++) {
        const a = planets[i];
        const b = planets[j];
        const force = a.gravitate(b);
        if (!a.immovable) a.update(force);
        if (!b.immovable) b.update(force.mult(-1));
      }
    }
  };
};
