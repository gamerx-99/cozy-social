import './style.css';
import Phaser from 'phaser';
import { GameScene } from './GameScene.js';
import { CustomizationUI } from './CustomizationUI.js';
import { CharacterAppearance, DEFAULT_APPEARANCE } from './CharacterAppearance.js';

const gameContainer = document.querySelector('#game-container');
const config = {
  type: Phaser.AUTO,
  width: Math.max(1, gameContainer.clientWidth),
  height: Math.max(1, gameContainer.clientHeight),
  parent: gameContainer,
  backgroundColor: '#f2e6d4',
  physics: {
    default: 'arcade',
    arcade: { debug: false, gravity: { x: 0, y: 0 } },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 240, height: 240 },
  },
  render: { pixelArt: false, antialias: true, antialiasGL: true },
};

const game = new Phaser.Game(config);
window.game = game;

let customizationUI;
const initializeCustomization = () => {
  const scene = game.scene.getScene('GameScene');
  if (!scene) return;
  // Phaser may have completed scene creation before the Game `ready` event
  // callback runs, so check the player first and only subscribe if needed.
  if (scene.player) {
    customizationUI ??= new CustomizationUI(scene);
  } else {
    scene.events.once('scene-ready', () => {
      customizationUI ??= new CustomizationUI(scene);
    });
  }
};
game.events.once('ready', initializeCustomization);

const resizeObserver = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  if (width > 0 && height > 0 && game.scale) {
    game.scale.resize(Math.floor(width), Math.floor(height));
  }
});
resizeObserver.observe(gameContainer);

window.addEventListener('beforeunload', () => {
  resizeObserver.disconnect();
  customizationUI?.destroy();
});

document.addEventListener('visibilitychange', () => {
  if (game) game.gameLoop.paused = document.hidden;
});

export { game, GameScene, CustomizationUI, CharacterAppearance, DEFAULT_APPEARANCE };
