import 'pixi';
import 'p2';
import Phaser from 'phaser';
import BootState from './states/Boot';

function init() {
  console.log('init');
  const availableHeight = Math.min(window.innerWidth, window.innerHeight);
  const availableWidth = Math.max(window.innerWidth, window.innerHeight);
  const windowAspectRatio = availableHeight / availableWidth;
  const WORLD_WIDTH = 1366;
  const WORLD_HEIGHT = Math.ceil(WORLD_WIDTH * windowAspectRatio);

  const config = {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    parent: 'content',
    resolution: 1,
    state: BootState,
    renderer: Phaser.AUTO,
  };

  const game = new Phaser.Game(config);
}

Phaser.Device.whenReady(() => {
  console.log('device is ready');
  setTimeout(() => init(), 1000);
});
