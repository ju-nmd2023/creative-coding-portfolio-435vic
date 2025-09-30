export const name = "Planets 2";
export const description = "Planets, but now with collisions and effects on hit.";

// Audio control interface
let audioControl = null;
let audioStarted = false;
let isMuted = true;

export const withSound = true;

export function toggleMuted() {
  if (!audioControl) return;

  if (!audioStarted) {
    // First click - start audio (happens in user gesture context)
    audioControl.start();
    audioStarted = true;
    isMuted = false;
  } else {
    // Subsequent clicks - toggle mute
    isMuted = !isMuted;
    audioControl.setMuted(isMuted);
  }
}

// Credits:
// The planet's line trails were optimized by consulting an LLM
// originally they were line segmends drawn directly to the main buffer
// now they're drawn on a separate buffer, and the trails are faded out by adding
// a background with low opacity
// https://claude.ai/share/c40ecdd7-2232-4965-a1e8-9b0291250cd2

/** @type {(s: p5) => any} */
export const sketch = ( s ) => {
  // gravitational constant
  const GRAVITY = 100;
  const TRAIL_FADE_FACTOR = 5;
  const CENTER = s.createVector(innerWidth/2, innerHeight/2);
  const NUM_PLANETS = 4;
  // how much energy is lost when colliding with edges
  const EDGE_COLLISION_FACTOR = 0.6;
  // multiplier for planet collisions
  const PLANET_COLLISION_FACTOR = 1.2;
  // timescale
  const TIMESCALE = 6;
  
  let trailBuffer; // Off-screen graphics buffer for trails
  let collisionBuffer; 
  let maxVelocity = 1200;

  // Double clicks reset the canvas, but a click makes the mouse a planet
  // we have to remove the mouse planet when resetting, otherwise the others
  // get slingshotted, which is not ideal
  let mouseCooldown = 0;

  class PlanetSynth {
    constructor(freq, mixer) {
      this.baseFreq = freq;
      this.sine = new p5.Oscillator(freq, 'sine');
      this.square = new p5.Oscillator(freq, 'square');
      this.square.amp(0.15);

      this.sine.disconnect();
      this.square.disconnect();

      this.output = new p5.Gain();
      this.output.disconnect();
      this.output.connect(mixer);

      this.sine.connect(this.output);
      this.square.connect(this.output);
    }

    update(velocity, distanceFromCenter) {
      // Amplitude based on velocity magnitude
      const velMag = velocity.mag();
      const amp = s.map(velMag, 0, 400, 0.05, 0.3, true);
      this.output.amp(amp, 0.1);

      // Subtle frequency modulation based on distance from center
      const freqMod = s.map(distanceFromCenter, 0, 500, 0.95, 1.05, true);
      this.sine.freq(this.baseFreq * freqMod);
      this.square.freq(this.baseFreq * freqMod);
    }

    play() {
      this.sine.start();
      this.square.start();
    }
  }

  class CollisionSynth {
    constructor(mixer) {
      this.noise = new p5.Noise('white');
      this.noise.disconnect();

      this.filter = new p5.BandPass();
      this.filter.disconnect();
      this.filter.freq(800);
      this.filter.res(10);

      this.env = new p5.Envelope();
      this.env.setADSR(0.001, 0.1, 0.0, 0.0);
      this.env.disconnect();

      this.output = new p5.Gain();
      this.output.disconnect();
      this.output.connect(mixer);
      this.output.amp(0.4);

      // Signal path: noise -> filter -> envelope -> output
      this.noise.connect(this.filter);
      this.filter.connect(this.env);
      this.env.connect(this.output);

      this.noise.start();
    }

    trigger(impactStrength) {
      // Modulate filter frequency based on impact
      const freq = s.map(impactStrength, 0, 50, 400, 2000, true);
      this.filter.freq(freq);
      this.env.play();
    }
  }

  class Planet {
    constructor(mass, color, startPos, immovable = false, visible = true, tangible = true) {
      this.mass = mass;
      this.color = color;
      this.pos = startPos;
      this.vel = s.createVector(0, 0);
      this.acc = s.createVector(0, 0);
      this.lastPos = startPos.copy();
      this.immovable = immovable;
      this.visible = visible;
      this.radius = this.mass*3 / 2;
      // This allows us to 'hide' planets, including them in the
      // planets array but not taking them into account for the physics
      // this allows for 'turning on' planets on demand
      this.tangible = tangible;
      this.synth = null; // Will be assigned after creation
    }

    draw() {
      if (!this.visible) return;
      // Draw current position to trail buffer
      trailBuffer.stroke(this.color);
      trailBuffer.strokeWeight(2);
      trailBuffer.line(this.lastPos.x, this.lastPos.y, this.pos.x, this.pos.y);
      
      // Draw planet on main canvas
      s.noStroke();
      s.fill(this.color);
      s.circle(this.pos.x, this.pos.y, this.radius*2);
      
      // Update last position
      this.lastPos = this.pos.copy();
    }

    /** @method gravitate
      * calculate and apply the gravitational force applied by another planet.
      * @param {Planet} other
      * @returns {p5.Vector} the gravitational force according to newton
      */
    gravitate(other) {
      const r2 = Math.pow(this.pos.dist(other.pos), 2);
      const fmag = GRAVITY * this.mass * other.mass / r2;
      const f = p5.Vector.sub(other.pos, this.pos).mult(fmag); 
      if (!this.immovable) this.applyForce(f.copy());
      if (!other.immovable) other.applyForce(f.copy().mult(-1));
      return f; 
    }

    applyForce(force) {
      this.acc.add(p5.Vector.div(force, this.mass));
    }

    update(dt) {
      if (this.immovable) return;
      this.vel.add(p5.Vector.mult(this.acc, dt));
      this.lastPos.set(this.pos);
      this.pos.add(p5.Vector.mult(this.vel, dt));
      this.acc.mult(0);

      // Update synth parameters
      if (this.synth) {
        const distFromCenter = this.pos.copy().sub(CENTER).mag();
        this.synth.update(this.vel, distFromCenter);
      }
    }

    collideEdges() {
      let collision = false;
      if (this.pos.x - this.radius < 0) {
        this.pos.x = this.radius; // Prevent from leaving the canvas from the left side
        this.vel.x *= -EDGE_COLLISION_FACTOR;
        collision = true;
      } else if (this.pos.x + this.radius > innerWidth) {
        this.pos.x = innerWidth - this.radius; // Prevent from leaving the canvas from the right side
        this.vel.x *= -EDGE_COLLISION_FACTOR;
        collision = true;
      }

      if (this.pos.y - this.radius < 0) {
        this.pos.y = this.radius; // Prevent from leaving the canvas from the top
        this.vel.y *= -EDGE_COLLISION_FACTOR;
        collision = true;
      } else if (this.pos.y + this.radius > innerHeight) {
        this.pos.y = innerHeight - this.radius; // Prevent from leaving the canvas from the bottom
        this.vel.y *= -EDGE_COLLISION_FACTOR;
        collision = true;
      }

      if (collision) {
        collisions.push(new Collision(this.pos, 20, 5));
        if (collisionSynth) {
          const impactStrength = this.vel.mag() * this.mass * 0.5;
          collisionSynth.trigger(impactStrength);
        }
      }
    }

    // source: daniel shiffman, elastic collisions
    // https://editor.p5js.org/codingtrain/sketches/3DrBb8LCp
    collide(other) {
      let impact = p5.Vector.sub(other.pos, this.pos);
      let d = impact.mag();
      if (d < this.radius + other.radius) {
        let overlap = (this.radius + other.radius) - d;
        let correction = impact.copy().setMag(overlap * 0.5);
        if (!this.immovable) this.pos.sub(correction);
        if (!other.immovable) other.pos.sub(correction);

        let vdiff = p5.Vector.sub(this.vel, other.vel);
        let dot = vdiff.dot(impact.normalize());
        if (dot < 0) return;

        let impulse = (2 * dot) / (this.mass + other.mass) * PLANET_COLLISION_FACTOR;

        if (!this.immovable) {
          this.vel.sub(p5.Vector.mult(impact, impulse * other.mass));
        }

        if (!other.immovable) {
          other.vel.add(p5.Vector.mult(impact, impulse * this.mass));
        }

        collisions.push(new Collision(p5.Vector.add(this.pos, impact.copy().normalize().mult(this.radius)), 15, 3));

        if (collisionSynth) {
          const relVel = vdiff.mag();
          const impactStrength = relVel * (this.mass + other.mass) * 0.3;
          collisionSynth.trigger(impactStrength);
        }
      }
    }
  }

  class Particle {
    constructor(origin, speed) {
      this.pos = origin.copy();
      this.prevPos = origin.copy();
      // Give it a random outward velocity
      this.vel = p5.Vector.random2D().mult(s.random(0.5, 1) * speed);
      this.lifespan = 150; // a short lifespan in milliseconds
      this.initialLifespan = this.lifespan;
      this.damping = 0.97; // slows the particle down over time
    }

    update(dt) {
      this.lifespan -= dt;
      this.vel.mult(this.damping);
      this.prevPos = this.pos.copy();
      this.pos.add(p5.Vector.mult(this.vel, dt / 16)); // dt scaling
    }

    draw() {
      if (this.isDead()) return;


      // Fade the particle out as it dies
      const alpha = s.map(this.lifespan, 0, this.initialLifespan, 0, 255);
      s.stroke(255, alpha);
      s.strokeWeight(3);
      s.point(this.pos.x, this.pos.y);

      trailBuffer.stroke(40, alpha);
      trailBuffer.strokeWeight(2);
      trailBuffer.line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y); 
    }

    isDead() {
      return this.lifespan < 0;
    }
  }

  class Collision {
    constructor(origin, numParticles, speed) {
      this.origin = origin.copy();
      this.particles = [];
      for (let i = 0; i < numParticles; i++) {
        this.particles.push(new Particle(this.origin, speed));
      }
    }

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update(dt);
        if (this.particles[i].isDead()) {
          this.particles.splice(i, 1);
        }
      }
    }

    draw() {
      for (const p of this.particles) {
        p.draw();
      }
    }

    isFinished() {
      return this.particles.length === 0;
    }
  }

  let planets = [];
  let collisions = [];
  let outMixer;
  let collisionSynth;

  const mousePlanet = new Planet(2, null, CENTER, true, false, false);

  function initPlanets() {
    for (let i = 0; i < NUM_PLANETS; i++) {
      const rand = p5.Vector.random2D().normalize().mult(180);
      const angle = s.map(i, 0, NUM_PLANETS, 0, 360);
      planets.push(new Planet(
        Math.floor(s.random(1, 9)),
        s.color(s.random(0, 255), 126, s.random(20, 150)),
        s.createVector(s.cos(angle)*100, s.sin(angle)*100).add(CENTER),
      ));
      planets[i].vel.add(rand.div(planets[i].mass));
    }
    planets.push(mousePlanet);
  }

  function resetPlanets() {
    // Reset existing planets without destroying them (preserves synths)
    for (let i = 0; i < NUM_PLANETS && i < planets.length; i++) {
      const rand = p5.Vector.random2D().normalize().mult(180);
      const angle = s.map(i, 0, NUM_PLANETS, 0, 360);

      planets[i].mass = Math.floor(s.random(1, 9));
      planets[i].color = s.color(s.random(0, 255), 126, s.random(20, 150));
      planets[i].pos = s.createVector(s.cos(angle)*100, s.sin(angle)*100).add(CENTER);
      planets[i].lastPos = planets[i].pos.copy();
      planets[i].vel = rand.copy().div(planets[i].mass);
      planets[i].acc = s.createVector(0, 0);
      planets[i].radius = planets[i].mass * 3 / 2;
    }
  }

  s.doubleClicked = () => {
    resetPlanets();
    // clear all trails
    trailBuffer.clear();
    trailBuffer.background(0);
    mouseCooldown = 1000;
  }

  s.mouseMoved = () => {
    mousePlanet.pos.x = s.mouseX;
    mousePlanet.pos.y = s.mouseY;
  }

  s.mouseDragged = () => {
    mousePlanet.pos.x = s.mouseX;
    mousePlanet.pos.y = s.mouseY;
  }

  s.mousePressed = () => {
    if (mouseCooldown > 0) return;
    mousePlanet.tangible = true;
    maxVelocity = 400;
  }

  s.mouseReleased = () => {
    mousePlanet.tangible = false;
    maxVelocity = 800;
  }

  s.setup = () => {
    s.setAttributes("alpha", true);
    s.createCanvas(innerWidth, innerHeight);

    // Create off-screen buffer for trails
    trailBuffer = s.createGraphics(innerWidth, innerHeight);
    trailBuffer.background(0);

    collisionBuffer = s.createGraphics(innerWidth, innerHeight);
    collisionBuffer.background(200);

    s.background(0);
    s.noFill();
    s.angleMode(s.DEGREES);

    // Setup audio
    outMixer = new p5.Gain();
    outMixer.amp(0);

    // Create collision synth
    collisionSynth = new CollisionSynth(outMixer);

    // Create planets first
    initPlanets();

    // Create synths for each planet (forming a chord)
    // Using a minor 7th chord: root, minor 3rd, perfect 5th, minor 7th
    const baseFreq = 130.81; // C3
    const chordIntervals = [1, 1.189, 1.498, 1.782]; // C, Eb, G, Bb

    for (let i = 0; i < NUM_PLANETS && i < planets.length; i++) {
      const freq = baseFreq * chordIntervals[i % chordIntervals.length];
      planets[i].synth = new PlanetSynth(freq, outMixer);
    }

    // Expose audio control interface to the module scope
    audioControl = {
      start: () => {
        // Start all planet synths
        for (let i = 0; i < NUM_PLANETS && i < planets.length; i++) {
          if (planets[i].synth) {
            planets[i].synth.play();
          }
        }
        outMixer.amp(0.6, 0.5);
      },
      setMuted: (muted) => {
        outMixer.amp(muted ? 0 : 0.6, 0.2);
      }
    };
  };

  s.draw = () => {
    trailBuffer.noStroke();
    trailBuffer.background(0, 0, 0, TRAIL_FADE_FACTOR);
    // trailBuffer.rect(0, 0, innerWidth, innerHeight);
    
    s.background(0);
    s.image(trailBuffer, 0, 0);

    for (let i = collisions.length - 1; i >= 0; i--) {
      const effect = collisions[i];
      effect.update(s.deltaTime);
      effect.draw();
      if (effect.isFinished()) {
        collisions.splice(i, 1);
      }
    }
    
    for (let i = 0; i < planets.length; i++) {
      const a = planets[i];
      a.collideEdges();
      for (let j = i+1; j < planets.length; j++) {
        const b = planets[j];
        // skip all calculations if either planet is intangible
        if (!(a.tangible && b.tangible)) continue;

        a.gravitate(b);
        a.collide(b);
      }

      a.update(s.deltaTime/1000 * TIMESCALE);
      a.draw();
    }
    
    if (mouseCooldown > 0) {
      s.fill(255, s.map(mouseCooldown, 1000, 0, 255, 0));
      s.blendMode(s.DIFFERENCE);
      s.rect(0, 0, innerWidth, innerHeight);
      s.blendMode(s.BLEND);
      mouseCooldown -= s.deltaTime;
    }
  };
};
