// @ts-check
/**
 * @import {p5} from 'p5'
 */

export const name = "waves";
export const description = "waaaavy";

// sine wave original code from Daniel Shiffman:
// https://editor.p5js.org/codingtrain/sketches/EIbEYLTaZ
// code for randomizing the sine wave parameters was derived
// from an LLM, conversation is here:
// https://claude.ai/share/3c699f48-9370-4d8d-acb4-4d1016b66ab8

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  const WAVE_COARSE_COMPONENTS = 3;

  class Waves {
    constructor(resolution) {
      this.res = resolution;
      this.components = [];
      this.points = [];
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

    update() {
      this.points = [];
      const total = Math.floor(innerWidth / this.res * 2);

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

      for (let i = 0; i < total + 1; i++) {
        let angle = s.map(i, 0, total, 0, s.TWO_PI);
        let sum = 0;
        this.currentParams.forEach(wave => {
          sum += s.sin(wave.phase + angle * wave.freq) * wave.amp * 0.2;
        });

        this.points.push([
          s.map(i, 0, total+1, 0, innerWidth),
          s.map(sum, -1, 1, -innerHeight/4, innerHeight/4),
        ]);
      }
    }

    style() {
      s.noFill();
      s.stroke(255);
      s.strokeWeight(2);
    }

    /**
      * @function drawWithParams
      * @description draw wave with specified mouse coords, and components.
      * @param {{mouseX: number, mouseY: number, components: {freq: number, amp: number, phase: number}[]}} params
      */
    drawAt({mouseX, mouseY, components}) {
      const total = Math.floor(innerWidth / this.res * 2);
      this.style();
      s.beginShape();
      for (let i = 0; i < total + 1; i++) {
        let angle = s.map(i, 0, total, 0, s.TWO_PI);
        let sum = 0;
        components.forEach(wave => {
          sum += s.sin(wave.phase + angle * wave.freq) * wave.amp * 0.2;
        });

        s.vertex(
          s.map(i, 0, total+1, 0, innerWidth),
          s.map(sum, -1, 1, -innerHeight/4, innerHeight/4),
        );
      }
      s.endShape();
    }

    draw() {
      this.style();
      s.beginShape();
      this.points.forEach(p => s.vertex(...p));
      s.endShape();
      return this.points;
    }
  }

  let wave;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let shouldRedraw = true;

  const FPS = 60;
  const HISTORY_SIZE = 1;

  let history = [];

  s.setup = () => {
    s.createCanvas(innerWidth, innerHeight);
    s.background(0);
    s.frameRate(FPS);
    wave = new Waves(2);
    wave.init();
    wave.update();
    for (let i = 0; i < HISTORY_SIZE*FPS; i++) {
      history.push(wave.points.slice());
    }
  }

  s.mouseClicked = () => {
    wave.init();
  }
  
  const WAVE_SPACING = 30;
  const WAVE_WIDTH = 2;
  const waveEnd = 10;
  const waveStart = innerHeight;
  const waveSize = WAVE_SPACING;
  const numWaves = Math.floor((innerHeight)/waveSize);

  s.draw = () => {
    wave.update();
    // return;
    s.background(0);
    s.translate(0, waveStart);
    wave.style();

    // for as many waves as calculated in numWaves we render
    // the sine wave at different points in the past, evenly spaced across the
    // array
    for (let i = 0; i < numWaves; i++) {
      const idx = Math.floor(s.map(i, 0, numWaves, 0, HISTORY_SIZE*FPS - 1));
      s.beginShape();
      history[idx].forEach(p => s.vertex(...p));
      s.endShape();
      s.translate(0, -WAVE_SPACING);
    }
    
    // we record the current state of the wave and put it in the history
    // array, discarding the oldest element
    history.pop();
    history.unshift(wave.points.slice());
  }
};
