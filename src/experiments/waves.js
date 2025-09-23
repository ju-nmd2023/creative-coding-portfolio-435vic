// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "waves";
export const description = "waaaavy";

// sine wave original code from Daniel Shiffman:
// https://editor.p5js.org/codingtrain/sketches/EIbEYLTaZ

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  class Waves {
    constructor(resolution) {
      this.res = resolution;
      this.waves = [];
      this.points = [];
    }

    init() {
      this.points = [];
      const total = Math.floor(innerWidth / this.res * 2);
      for (let i = 0; i < total + 1; i++) {
        let angle = s.map(i, 0, total, 0, s.TWO_PI);
        let sum = this.waves.map(
          ([freq, amp, phase]) => s.sin(phase + angle * freq) * amp
        ).reduce((a, v) => a + v, 0);
        this.points.push([
          s.map(i, 0, total+1, 0, innerWidth),
          s.map(sum, -1, 1, -innerHeight/4, innerHeight/4),
        ]);
      }
    }

    draw() {
      s.noFill();
      s.stroke(255);
      s.strokeWeight(2);
      s.beginShape();
      this.points.forEach(p => s.vertex(...p));
      s.endShape();
    }
  }

  let waves = [];
  const NUM_WAVES = 20;
  const WAVE_SPACING = 2;

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(0);
    for (let i = 0; i < NUM_WAVES; i++) {
      waves.push(new Waves(
        [], 2
      ));
    }
  }

  s.draw = () => {
    s.background(0);
    s.translate(0, innerHeight/2);
  }
};
