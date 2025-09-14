/**
 * @import {p5} from 'p5'
 */

export const name = "kaleidoscope";
export const description = "live coding session";

/** @type {(s: p5) => void} */
export const sketch = ( s ) => {
  let position, velocity, acceleration;

  let size = 6;

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight); 
    position = s.createVector(100, 100);
    velocity = s.createVector(5, 2);
    s.background(255);
    // s.frameRate(10);
  };

  s.draw = () => {
    s.noStroke();
    
    s.push();
    s.fill(15, s.random(255), 240);
    s.ellipse(position.x, position.y, s.random(size));
    s.ellipse(s.width - position.x, s.height - position.y, s.random(size));
    s.pop();

    s.push();
    s.fill(205, s.random(255), 120);
    s.ellipse(position.x, s.height - position.y, s.random(size));
    s.ellipse(s.width - position.x, position.y, s.random(size));
    s.pop();

    if (position.x > s.width || position.x < 0) {
      velocity.x *= -1;  
    }

    if (position.y > s.height || position.y < 0) {
      velocity.y *= -1;
    };

    const mouse = s.createVector(s.mouseX, s.mouseY);
    acceleration = mouse.sub(position);
    acceleration.normalize();
    acceleration.mult(0.5);

    velocity.add(acceleration);
    velocity.limit(10);
    position.add(velocity);
  };
};

