// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "waves";
export const description = `
An original work. A random combination of sine waves is generated, and morphed by noise,
affected by the mouse position. Several afterimages are rendered which serve as a visual 'echo'.
`;

// sine wave original code from Daniel Shiffman:
// https://editor.p5js.org/codingtrain/sketches/EIbEYLTaZ
// code for randomizing the sine wave parameters was derived
// from an LLM, conversation is here:
// https://claude.ai/share/3c699f48-9370-4d8d-acb4-4d1016b66ab8

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const WAVE_COARSE_COMPONENTS = 6;

  class Waves {
    constructor(resolution) {
      this.res = resolution;
      this.pointTotal = Math.floor(innerWidth / this.res * 2);
      this.components = [];
      this.currentParams = [];
    }

    init() {
      this.components = [];
      for (let i = 0; i < WAVE_COARSE_COMPONENTS; i++) {
        this.components.push({
          // the parameters of the sine wave
          baseFreq: s.random(0.2, 6),      
          baseAmp: s.random(0.4, 3),
          basePhase: s.random(0, s.TWO_PI),
          
          // how much the perlin noise can affect said parameters
          freqVariation: i == 0 ? s.random(2, 6) : s.random(0.5, 2),
          ampVariation: s.random(0.2, 0.4),
          phaseVariation: s.random(-s.TWO_PI, s.TWO_PI),
          
          // the offset of the perlin noise
          noiseOffset: s.random(1000),
          
          // how quickly the noise changes relative to the input 
          noiseSpeed: s.random(0.005, 0.097)
        });
      }
    }

    update(points = new Array(this.pointTotal)) {
      const mouseMapX = s.map(s.mouseX, 0, innerWidth, 0, 1);
      const mouseMapY = s.map(s.mouseY, 0, innerHeight, 0, 1);

      this.currentParams = this.components.map((comp, idx) => {
        // lots of different numbers and operations. Most of it is just to 'scramble' the mouse position
        // with the noise, such that a small movement changes the shape of the wave considerably.
        // each parameter of a component of the wave (frequency, amplitude, phase) has a different value added to
        // the parameter of its noise so that it doesn't have the same value as the other components
        const freqNoise = s.noise(comp.noiseOffset * comp.noiseSpeed + mouseMapX, idx * 0.1);
        const ampNoise = s.noise(comp.noiseOffset * comp.noiseSpeed + mouseMapY, idx * 0.1 + 100);
        const phaseNoise = s.noise(comp.noiseOffset * comp.noiseSpeed + mouseMapX, idx * 0.1 + 200, mouseMapY);
        return { 
          freq: comp.baseFreq + s.map(freqNoise, 0, 1, -comp.freqVariation, comp.freqVariation),
          amp: Math.max(0.1, comp.baseAmp + s.map(ampNoise, 0, 1, -comp.ampVariation, comp.ampVariation)),
          phase: comp.basePhase + s.map(phaseNoise, 0, 1, -comp.phaseVariation, comp.phaseVariation),
        }
      });

      for (let i = 0; i < this.pointTotal + 1; i++) {
        let angle = s.map(i, 0, this.pointTotal, 0, s.TWO_PI);
        let sum = 0;
        this.currentParams.forEach(wave => {
          sum += s.sin(wave.phase + angle * wave.freq) * wave.amp * 0.2;
        });

        points[i] = [
          s.map(i, 0, this.pointTotal+1, 0, innerWidth),
          s.map(sum, -1, 1, -innerHeight/4, innerHeight/4),
        ];
      }

      return points;
    }
  }

  class History {
    constructor(size, wave) {
      this.wave = wave; 
      this.size = size;
      this.history = [];
      this.idx = 0;

      for (let i = 0; i < size; i++) {
        const pointArray = new Array(wave.pointTotal);
        for (let j = 0; j < wave.pointTotal; j++) {
          pointArray[j] = [0, 0]; 
        }
        this.history.push(pointArray);
      }

      this.history.forEach(arr => this.wave.update(arr));
    }

    advance() {
      this.idx = (this.idx + 1) % this.size;
    }

    capture() {
      this.advance();
      this.wave.update(this.history[this.idx]);
    }

    recall(n) {
      if (n >= this.size) throw Error("out of bounds");
      const target = (((this.idx - n) % this.size) + this.size) % this.size;
      return this.history[target];
    }
  }

  let wave;
  let history;

  const FPS = 60;
  const HISTORY_SIZE = 1;

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(0);
    s.frameRate(FPS);
    wave = new Waves(10);
    wave.init();

    history = new History(FPS * HISTORY_SIZE, wave);
  }

  s.mouseClicked = () => {
    wave.init();
  }
  
  const WAVE_SPACING = 30;
  const waveStart = innerHeight;
  const waveSize = WAVE_SPACING;
  const numWaves = Math.floor((innerHeight+100)/waveSize);


  s.draw = () => {
    history.capture();

    s.background(0);
    s.push();
    s.translate(0, waveStart); // Center the drawing area

    for (let i = 0; i < numWaves; i++) {
      const historyIndex = Math.floor(s.map(i, 0, numWaves, 0, history.size - 1));
      
      // For fading, we set the alpha of the stroke color
      const alpha = s.map(i, 0, numWaves, 255, 50);

      // Get the array of points for this historical wave
      const points = history.recall(historyIndex);

      // Draw the shape
      s.noFill();
      s.stroke(255, alpha); // White stroke with calculated alpha
      s.strokeWeight(2);

      s.beginShape();
      for (const p of points) {
        s.vertex(...p);
      }
      s.endShape();

      s.translate(0, -WAVE_SPACING);
    }
    
    s.pop();
  }
};
