/**
 * @import {p5} from 'p5'
 */

export const name = "lines";
export const description = "wow. some lines. so cool";

const yLineSpacing = 3;


/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  class RibbonPair {
    /**
      * @param length length of ribbon in pixels
      * @param center center y coordinate
      * @param count amount of lines from the top and bottom of the centerline
      */
    constructor(length, count, center) {
      this.points = [];
      this.width = length;
      this.start = start;
      this.count = count;
      // initialize point locations
      let basey = 0;
      for (let x = 0; x < length; x += Math.random() * 20) {
        const y = basey + (Math.random() < 0.5 ? Math.random() * 10 - 5 : 0);
        this.points.push([x, y]);
      }
    }

    draw() {
      let y = this.start;
      for (let n = 0; n < this.count; n++) {
        s.beginShape(s.LINES);
        for (let i = 1; i < this.points.length; i++) {
          const point = this.points[i];
          const prevPoint = this.points[i-1];
          s.vertex(prevPoint[0], prevPoint[1] + y);
          s.vertex(point[0], point[1] + y);
        }
        s.endShape();
        y += yLineSpacing; 
      }
    }
  }

  let ribbons = [];
  const ribbonCount = 5;
  const ribbonSpacing = 15;
  const ribbonStart = 80;

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(200);
    for (let [i, y] = [0, ribbonStart]; i < ribbonCount; i++) {
      ribbons.push(new Ribbon(innerWidth, 20, y));
      ribbons.push(new Ribbon(innerWidth, 20, y + yLineSpacing*20));
      y += (yLineSpacing*40) + ribbonSpacing;
    }
  }

  s.draw = () => {
    ribbons.forEach(r => r.draw());
    s.noLoop();
  }
};
