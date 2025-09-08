// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "lines";
export const description = "wow. some lines. so cool";

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const width = innerWidth;
  const height = innerHeight;

  let linePoints = [];

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(200);
    let basey = 0;
    for (let x = 0; x < width; x += Math.random() * 20) {
      const y = basey + (Math.random() < 0.5 ? Math.random() * 20 - 10 : 0);
      linePoints.push([x, y]);
    }
  }

  s.draw = () => {
    s.stroke(0);
    s.strokeWeight(1);
      for (let y = 0; y < innerHeight; y += 4) {
        s.beginShape(s.LINES);
        for (let i = 1; i < linePoints.length; i++) {
          const point = linePoints[i];
          const prevPoint = linePoints[i-1];
          s.vertex(prevPoint[0], prevPoint[1] + y);
          s.vertex(point[0], point[1] + y);
        }
        s.endShape();
      }
    noLoop();
  }
};
