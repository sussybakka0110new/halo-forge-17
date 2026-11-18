// Boot, layout and input. The loop advances the simulation in real time; screenshots instead
// stage one deterministic frame and signal window.__shotReady to the capture script.
import { createAudio } from './audio.js';
import { CENTRE, VIEW } from './config.js';
import { ForgeGame } from './game.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = new ForgeGame(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

function layout() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  renderer.resize();
}
window.addEventListener('resize', layout);
layout();

function announce(text) {
  if (status) status.textContent = text;
}

function pointFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

function updateAim(event) {
  const point = pointFromEvent(event);
  game.aim = Math.atan2(point.y - CENTRE.y, point.x - CENTRE.x);
  if (game.screen === 'upgrade') {
    game.hoverCard = -1;
    for (let index = 0; index < 3; index += 1) {
      const x = 150 + index * 330;
      if (point.x >= x && point.x <= x + 290 && point.y >= 316 && point.y <= 636) game.hoverCard = index;
    }
  }
}

function cardAt(event) {
  const point = pointFromEvent(event);
  for (let index = 0; index < 3; index += 1) {
    const x = 150 + index * 330;
    if (point.x >= x && point.x <= x + 290 && point.y >= 316 && point.y <= 636) return index;
  }
  return -1;
}

function pickUpgrade(index) {
  const id = game.chooseUpgrade(index);
  if (id) {
    audio.play('upgrade');
    announce(`Upgrade chosen. Wave ${game.wave}.`);
  }
}

function startOrRestart() {
  game.startRun();
  audio.play('clear');
  announce('Wave one. Defend the core.');
}

function togglePause() {
  if (game.screen === 'play') {
    game.screen = 'paused';
    announce('Paused.');
  } else if (game.screen === 'paused') {
    game.screen = 'play';
    announce('Resumed.');
  }
}

function respondToEvent(event) {
  if (!event) return;
  if (event === 'fire') audio.play('fire');
  else if (event === 'hit') audio.play('hit');
  else if (event === 'kill') audio.play('kill');
  else if (event === 'leak') audio.play('leak');
  else if (event === 'over') audio.play('over');
  else if (event === 'clear') audio.play('clear');
  else if (event === 'win') audio.play('win');
}

function runShot() {
  stageShot(game, shot ?? 'title');
  renderer.draw(game);
  let painted = 0;
  function paint() {
    renderer.draw(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  canvas.addEventListener('pointermove', updateAim);
  canvas.addEventListener('pointerdown', (event) => {
    updateAim(event);
    if (game.screen === 'title' || game.screen === 'over' || game.screen === 'win') {
      startOrRestart();
      return;
    }
    if (game.screen === 'upgrade') {
      const index = cardAt(event);
      if (index >= 0) pickUpgrade(index);
      return;
    }
    game.firing = true;
  });
  window.addEventListener('pointerup', () => {
    game.firing = false;
  });
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      if (game.screen === 'title' || game.screen === 'over' || game.screen === 'win') startOrRestart();
    } else if (event.code === 'Digit1' || event.code === 'Digit2' || event.code === 'Digit3') {
      pickUpgrade(Number(event.code.slice(-1)) - 1);
    } else if (event.code === 'KeyP') {
      togglePause();
    } else if (event.code === 'KeyM') {
      announce(audio.toggle() ? 'Sound off.' : 'Sound on.');
    } else if (event.code === 'Space') {
      event.preventDefault();
      game.firing = true;
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'Space') game.firing = false;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.screen === 'play') game.screen = 'paused';
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.2);
    last = now;
    if (game.screen !== 'paused') respondToEvent(game.step(dt, game.firing));
    renderer.draw(game);
    requestAnimationFrame(frame);
  }
  announce('Halo Forge. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot();
else runGame();
