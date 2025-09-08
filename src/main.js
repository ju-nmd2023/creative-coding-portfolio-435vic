// @ts-check
import p5 from 'p5';
import './style.css';

// Import all experiments automatically
const experiments = await import.meta.glob('./experiments/*.js', {eager: true});
const p5container = document.querySelector('#p5container'); 
const nameText = document.querySelector("#name");
const descriptionText = document.querySelector("#description");

let p5Instance = null;

let currentExperiment = 0;

// window.experiments = experiments;

function gotoExperiment(idx) {
  const experiment = Object.values(experiments)[idx];
  if (experiment === undefined) return;
  if (p5Instance) {
    p5Instance.remove();
  };
  console.log(p5container);
  p5Instance = new p5(experiment.sketch, p5container);

  nameText.innerText = experiment.name;
  descriptionText.innerText = experiment.description;
}

gotoExperiment(0);

