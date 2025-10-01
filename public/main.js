import * as experimentModules from './experiments/index.js';

p5.disableFriendlyErrors = true;

// Import all experiments
const experiments = Object.values(experimentModules).filter(m => m.disabled !== true);
const p5container = document.querySelector('#p5container'); 
const nameText = document.querySelector("#name");
const descriptionText = document.querySelector("#description");
const prevButton = document.querySelector("button#prev");
const nextButton = document.querySelector("button#next");
const soundButton = document.querySelector("button#sound");

let p5Instance = null;

let storedExperiment = localStorage.getItem('experiment');
let currentExperiment = storedExperiment !== null ? storedExperiment : 0;

// window.experiments = experiments;

function mod(a, b) {
  return ((a % b) + b) % b;
}

prevButton.addEventListener('click', () => {
  gotoExperiment(mod(currentExperiment - 1, experiments.length));
});

nextButton.addEventListener('click', () => {
  gotoExperiment(mod(currentExperiment + 1, experiments.length));
});

let onSoundButtonClick;

function gotoExperiment(idx) {
  const experiment = experiments[idx];
  if (experiment === undefined) return;
  if (p5Instance) {
    p5Instance.remove();
  };

  if (onSoundButtonClick !== undefined) {
    soundButton.removeEventListener('click', onSoundButtonClick);
  }
  
  if (experiment.withSound) {
    soundButton.classList.remove('hidden');
    onSoundButtonClick = () => {
      experiment.toggleMuted();
      soundButton.classList.toggle('muted');
    };
    soundButton.addEventListener('click', onSoundButtonClick);
  } else if (!soundButton.classList.contains('hidden')) {
    soundButton.classList.add('hidden');
  }

  p5Instance = new p5(experiment.sketch, p5container);

  nameText.innerText = experiment.name;
  descriptionText.innerText = experiment.description;
  currentExperiment = idx;
  localStorage.setItem('experiment', idx);
}

gotoExperiment(currentExperiment);

