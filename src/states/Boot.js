import Main from './Main';
import ManifestLoader from '../loaders/ManifestLoader';

const {
  Phaser,
} = window;

const MANIFEST = {
  audio: [
    'click',
    'spin',
    'select',
    'success',
  ],
  animations: [
    'assets',
  ],
  images: [
    'background',
    'star_particle',
  ],
  bitmap_fonts: [
    'pantoon_white',
    'pantoon_yellow',
    'phosphate',
  ],
  fonts: [
    'panton_extraboldregular',
  ],
};

export default class extends Phaser.State {

  create() {
    console.log('boot me up');
    const loader = this.game.plugins.add(ManifestLoader);
    loader.loadManifest(MANIFEST).then(() => {
      this.setupStage();
      this.addStates();
      this.startGame();
    });
  }

  setupStage() {
    this.stage.backgroundColor = '#000000';
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.input.maxPointers = 1;
    this.scale.forceOrientation(true, false); // landscape
    this.scale.refresh();
  }

  addStates() {
    this.state.add('Main', Main);
  }

  startGame() {
    this.state.start('Main');
  }

}
