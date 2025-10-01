// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "Squares 2";
export const description = `
A variation of squares. They have been lonely, and they wish to reach out to you.
Will you let them?
`;

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const SQUARE_SIZE = 400;
  const SQUARE_PADDING = 60;
  const PAD_HQ = (SQUARE_SIZE/2 + SQUARE_PADDING);
  // The center positions of each of the four squares
  const SQUARE_POSITIONS = [
    [-PAD_HQ, -PAD_HQ],
    [PAD_HQ, -PAD_HQ],
    [-PAD_HQ, PAD_HQ],
    [PAD_HQ, PAD_HQ],
  ];
  // How "crazy" or random each of the four squares should be 
  const SQUARE_CRAZY = [0, 0.2, 0.6, 1.2];

  function timeOffset(crazy, size) {
    return Math.random() * (crazy * s.map(size, 0, SQUARE_SIZE, 5, 0) + s.map(size, 0, SQUARE_SIZE, 2, 0));
  }

  function reach(vx, vy, size) {
    const target = s.createVector(s.mouseX, s.mouseY)
      .sub(innerWidth/2, innerHeight/2)
      .sub(s.createVector(vx, vy))
      .mult(s.map(size, 0, SQUARE_SIZE, 0.96, 0));
    return [vx + target.x, vy + target.y];
  }

  function square(x, y, size, crazy) {
    let [ox, oy] = [x - size/2, y - size/2]; 
    let vertices = [
      [ox, oy],
      [ox + size, oy],
      [ox + size, oy + size],
      [ox, oy + size],
    ].map(([vx, vy], idx) => [
      vx + timeOffset(crazy, size) + (s.noise(vx + idx*1000 + s.mouseX/100, vy + idx*1000 + s.mouseY/100) * 30 - 15) * crazy,
      vy + timeOffset(crazy, size) + (s.noise(-vx + idx*1000 + s.mouseX/100, -vy + idx*1000 + s.mouseY/100) * 30 - 15) * crazy,
    ]).map(coords => reach(...coords, size));
    s.beginShape();
    for (let v of vertices) {
      s.vertex(...v);
    }
    s.endShape(s.CLOSE);
  }

  // concentric squares
  function squares(x, y, size, crazy) {
    // 'crazy' factor determines randomness in drawing
    for (let l = size; l > 2; l -= 5) {
      square(x, y, l, crazy + s.map(size, 0, SQUARE_SIZE, 10, 0));
    }
  }

  function foursquares() {
    SQUARE_POSITIONS.forEach((pos, idx) => {
      squares(...pos, SQUARE_SIZE, SQUARE_CRAZY[idx]);
    });
  }

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(220);
    s.stroke(0);
    s.noFill();
  };

  s.mouseMoved = () => {
    // s.background(220);
    // s.noiseDetail(8, 0.4);
    // let crazy = s.map(s.mouseY, 0, innerHeight, 0, 1.6);
    // squares(0, 0, SQUARE_SIZE, crazy);
  }

  s.draw = () => {
    s.translate(innerWidth/2, innerHeight/2); 
    s.background(
      s.map(s.mouseX, 0, innerWidth, 100, 255),
      s.map(s.mouseX, 0, innerWidth, 200, 80),
      s.map(s.mouseX, 0, innerWidth, 200, 80),
    );
    foursquares();
  };
};
