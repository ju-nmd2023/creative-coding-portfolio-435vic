// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "Squares";
export const description = "Four sets of concentric squares. Move the mouse right to heat things up";

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const SQUARE_SIZE = 300;
  const SQUARE_PADDING = 2;
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

  function timeOffset(crazy) {
    return Math.random() * (crazy * s.map(s.mouseX, 0, innerWidth, 0, 5) + s.map(s.mouseX, 0, innerWidth, 0, 2));
  }

  function square(x, y, size, crazy) {
    let [ox, oy] = [x - size/2, y - size/2]; 
    let vertices = [
      [ox, oy],
      [ox + size, oy],
      [ox + size, oy + size],
      [ox, oy + size],
    ].map(([vx, vy], idx) => [
      vx + timeOffset(crazy) + (s.noise(vx + idx*1000 + s.mouseX/100, vy + idx*1000 + s.mouseY/100) * 30 - 15) * crazy,
      vy + timeOffset(crazy) + (s.noise(-vx + idx*1000 + s.mouseX/100, -vy + idx*1000 + s.mouseY/100) * 30 - 15) * crazy,
    ]);
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
      square(x, y, l, crazy);
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
