// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "lines 1";
export const description = `
An evolution of Quark Lines, regenerating the 'ribbons' every time the mouse moves. 
The mouse position influences the noise generation as well as the frequency of
random variations in y position, making the lines more 'crumpled.'`;

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const yLineSpacing = 3;
  const yRandStart = -5;
  const yRandEnd = 5;

  class RibbonPair {
    /**
      * @param length length of ribbon in pixels
      * @param center center y coordinate
      * @param count amount of lines from the top and bottom of the centerline
      */
    constructor(length, count, center) {
      this.points = [];
      this.length = length;
      this.center = center;
      this.count = count;
      this.init(0.2);
    }

    init(crumpling) {
      this.points = [];
      let basey = 0;
      for (let x = 0; x < this.length; x += Math.random() * 20 + 6) {
        // Add a random chance of the line moving up or down a little random amount
        const y = basey + (Math.random() < crumpling ? s.noise(x, s.mouseY) : 0);
        const y2 = basey + (Math.random() < crumpling ? s.noise(x, s.mouseY) : 0);
        this.points.push([x, y, y2]);
      }
    }

    draw() {
      for (let n = 0; n < this.count; n++) {
        // for each point of the line, draw the one above and below the centerline
        for (let side of [-1, 1]) {
          // the farther the line is from the centerline, the more pronounced the randomness
          const change = s.map(n, 0, this.count, -0.1, 2.6);
          const y = this.center + (n * yLineSpacing + 2) * side;
          s.beginShape(s.LINES);
          for (let i = 1; i < this.points.length; i++) {
            const point = this.points[i];
            const prevPoint = this.points[i-1];
            const yidx = side == -1 ? 1 : 2;
            // The intention of this function is to make the lines' randomness be more pronounced the farther away
            // from the center they are
            // the new change from v1 to v2, adding noise
            const transform = (yy) => s.map(yy*change*side, 0, 1, yRandStart, yRandEnd) + y;
            s.vertex(prevPoint[0], transform(prevPoint[yidx]));
            s.vertex(point[0], transform(point[yidx]));
          }
          s.endShape();
        }
      }
    }
  }

  let ribbons = [];
  const ribbonCount = 5;
  const ribbonSpacing = 40;
  const ribbonStart = 80;
  let shouldRedraw = true;

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(200);
    for (let [i, y] = [0, ribbonStart]; i < ribbonCount; i++) {
      ribbons.push(new RibbonPair(innerWidth, 20, y));
      y += (yLineSpacing*40) + ribbonSpacing;
    }
  }

  s.mouseMoved = () => {
    ribbons.forEach(r => r.init(s.map(s.mouseX, 0, innerWidth, 0.2, 0.8))); 
    shouldRedraw = true;
  }

  s.draw = () => {
    if (shouldRedraw) {
      s.background(200);
      ribbons.forEach(r => r.draw());
      shouldRedraw = false;
    }
  }
};
