import p5 from 'p5';
import './style.css';

// Import all experiments automatically
// it's done this weird way so that i can save the experiments directly
// as an array
const experiments = await (async () => {
  const modules = await import.meta.glob('./experiments/*.js', {eager: true});
  return Object.values(modules).filter(m => m.disabled !== true);
})();
const p5container = document.querySelector('#p5container'); 
const nameText = document.querySelector("#name");
const descriptionText = document.querySelector("#description");
const prevButton = document.querySelector("button#prev");
const nextButton = document.querySelector("button#next");

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

function gotoExperiment(idx) {
  const experiment = experiments[idx];
  if (experiment === undefined) return;
  if (p5Instance) {
    p5Instance.remove();
  };
  console.log(p5container);
  p5Instance = new p5(experiment.sketch, p5container);

  nameText.innerText = experiment.name;
  descriptionText.innerText = experiment.description;
  currentExperiment = idx;
  localStorage.setItem('experiment', idx);
}

gotoExperiment(currentExperiment);

