// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "lines 2";
export const description = `An experiment inspired by Manfred Mohr's Quark lines. Several crossing lines are moved passed each other,
showing the interference (Moiré patterns) between them. It's a little slow due to bad coding on my part.
`;

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const yLineSpacing = 3;
  const yRandStart = -5;
  const yRandEnd = 5;
  const yRandChance = 0.5;
  let t = 0;

  class RibbonPair {
    /**
      * @param length length of ribbon in pixels
      * @param center center y coordinate
      * @param count amount of lines from the top and bottom of the centerline
      */
    constructor(length, count, center) {
      this.points = [];
      this.width = length;
      this.center = center;
      this.count = count;
      // initialize point locations
      let basey = 0;
      for (let x = 0; x < length; x += Math.random() * 20 + 6) {
        // Add a random chance of the line moving up or down a little random amount
        const y = basey + (Math.random() < yRandChance ? Math.random() : 0);
        const y2 = basey + (Math.random() < yRandChance ? Math.random() : 0);
        this.points.push([x, y, y2]);
      }
    }

    draw() {
      for (let n = 0; n < this.count; n++) {
        s.stroke(
          s.noise(n * 100 + t/2)*255,
          s.noise(n * 300 + t/2 + 2000)*255,
          s.noise(n * 400 + t/2 + 5000)*255,
        );
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
  const ribbonCount = 20;
  const ribbonSpacing = -56;
  const ribbonStart = 0;

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(200);
    for (let [i, y] = [0, ribbonStart]; i < ribbonCount; i++) {
      ribbons.push(new RibbonPair(innerWidth*3, 20, y));
      y += (yLineSpacing*40) + ribbonSpacing;
    }
    s.frameRate(20);
  }

  s.draw = () => {
    // s.noLoop();
    // return;
    s.background(200);
    ribbons.forEach((r, n) => {
      s.push();
      s.translate(s.sin(t/40+s.noise(n*1000)*20)*200, 0);
      r.draw()
      s.pop();
    });
    // s.noLoop();
    t++;
    t = (t % 1000000);
  }
};
