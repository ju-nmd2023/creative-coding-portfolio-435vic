// Active/important area of sketch
const width = innerWidth;
const height = innerHeight;

let linePoints = [];
function setup() {
  createCanvas(innerWidth, innerHeight);
  background(200);
  let basey = 0;
  for (let x = 0; x < width; x += Math.random() * 20) {
    const y = basey + (Math.random() < 0.5 ? Math.random() * 20 - 10 : 0);
    linePoints.push([x, y]);
  }
}

function draw() {
  stroke(0);
  strokeWeight(1);
    for (let y = 0; y < innerHeight; y += 4) {
      beginShape(LINES);
      for (let i = 1; i < linePoints.length; i++) {
        const point = linePoints[i];
        const prevPoint = linePoints[i-1];
        vertex(prevPoint[0], prevPoint[1] + y);
        vertex(point[0], point[1] + y);
      }
      endShape();
    }
  noLoop();
}

