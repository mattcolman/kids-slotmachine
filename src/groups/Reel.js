import times from 'lodash/times';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  SPACING,
} from '../constants';
import '../filters/BlurY';
import '../filters/Gray';
import { randomLine } from '../utils';

const {
  TweenMax,
  TimelineMax,
  Back,
  Linear,
  Phaser,
  PIXI,
} = window;

export default class Reel extends Phaser.Group {

  constructor(game) {
    super(game, null, 'reel');

    this.makeLine();
    this.maxHeight = this.height / 2;
    this.blurY = game.add.filter('BlurY');
    this.grayFilter = game.add.filter('Gray');
    this.stopping = false;
    // this.overlay = this.addOverlay(this, 0, -this.maxHeight + TILE_WIDTH + SPACING);
  }

  spin() {
    console.log('spin');
    this.part[1].cards.forEach((card) => {
      card.reset();
    });
    TweenMax.killTweensOf(this);
    this.y = 0;
    const DURATION = 0.22;
    this.spinner = TweenMax.to(this, DURATION, {
      onRepeat: this.handleRepeat,
      onRepeatScope: this,
      y: this.maxHeight,
      repeat: -1,
      ease: Linear.easeNone,
    });

    this.blurY.blur = 100;
    this.filters = [this.blurY];
  }

  requestStop(results, onComplete) {
    this.stopping = true;
    this.results = results;
    this.onComplete = onComplete;
  }

  setLine(results, part = 1) {
    console.log('setLine', results);
    this.part[part].cards.map((card, i) => (
      card.setCard(results[i])
    ));
  }


  /* -------------------------------------------------------
    -- PRIVATE
    ------------------------------------------------------- */

  stop(results) {
    // oddly, you actually have to pause before you kill
    // to ensure there's not another tick after this.
    this.spinner.pause().kill();
    this.setLine(this.part[1].cards.map(card => card.getByName('sprite').frameName), 0);
    this.setLine(results);

    const tl = new TimelineMax({
      onComplete: () => {
        this.filters = null;
        this.game.add.audio('stop').play();
        this.onComplete();
      },
    });

    const DURATION = 0.8;
    tl.to(this, DURATION, { y: this.maxHeight, ease: Back.easeOut.config(1) })
      .to(this.blurY, DURATION, { blur: 0, ease: Back.easeOut.config(1) }, 0);
  }

  handleRepeat() {
    if (this.stopping) {
      this.stop(this.results);
      this.results = null;
      this.stopping = false;
    } else {
      this.setLine(this.part[1].cards.map(card => card.getByName('sprite').frameName), 0);
      this.setLine(randomLine(), 1);
    }
  }

  addOverlay(parent, x, y) {
    const grp = this.game.add.group(parent);
    grp.position.set(x, y);
    grp.visible = false;

    // outline
    const ol = this.game.add.graphics(0, 0, grp);
    ol.lineStyle(10, 0xffffff)
      .drawRect(0, 0, TILE_WIDTH, TILE_HEIGHT);

    // overlay
    const g = this.game.add.graphics(0, 0, grp);
    g.beginFill(0xfed700, 0.8)
     .drawRect(0, 0, TILE_WIDTH, TILE_HEIGHT);
    g.blendMode = PIXI.blendModes.ADD;

    return grp;
  }

  makeLine() {
    const line = this.makeSingleLine();
    const line2 = this.makeSingleLine();
    line2.y = -line.height;
    this.addChild(line);
    this.addChild(line2);
    this.part = [line, line2];
    this.part.map((part, i) => this.setLine(randomLine(), i));
  }

  makeSingleLine() {
    const numCards = 3;
    const grp = this.game.make.group(null, 'line');
    let y = 0;
    grp.cards = times(numCards).map(() => {
      const card = this.makeCard(grp);
      card.y = y;
      y += card.height + SPACING;
      return card;
    });
    return grp;
  }

  makeCard(parent) {
    const grp = this.game.add.group(parent);
    const sprite = this.game.add.sprite(0, 0, 'assets', null, grp);
    sprite.name = 'sprite';

    grp.setCard = (name) => {
      sprite.frameName = name;
    };

    const overlay = this.addOverlay(grp, 0, 0);
    grp.glow = (delay = 0) => {
      overlay.visible = true;
      TweenMax.to(overlay, 1, { delay, alpha: 0, repeat: -1, yoyo: true });
    };

    grp.gray = () => {
      grp.filters = [this.grayFilter];
    };

    grp.reset = () => {
      grp.filters = null;
      overlay.visible = false;
      TweenMax.killTweensOf(overlay);
      overlay.alpha = 1;
    };

    return grp;
  }
}
