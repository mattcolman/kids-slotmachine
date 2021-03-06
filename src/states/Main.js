import Phaser from 'phaser';
import times from 'lodash/times';
import random from 'lodash/random';
import uniq from 'lodash/uniq';
import compact from 'lodash/compact';
import flatMap from 'lodash/flatMap';
import 'gsap';
import Reel from '../groups/Reel';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  SPACING,
  LINES,
} from '../constants';
import ValueTweener from '../ValueTweener';
import Pool from '../pool';
import { randomResults } from '../utils';

const SPIN_DELAY = 0.2;
const {
  TweenMax,
  TimelineMax,
  Linear,
} = window;

function isAWinner(grid, results) {
  const mapped = flatMap(grid, (line, i) => (
    line.split('').map((value, j) => (
      (value === 'X') ? results[j][i] : null
    ))
  ));
  return uniq(compact(mapped)).length === 1;
}

function mergeLines(lines) {
  if (lines.length === 0) return null;
  const finalGrid = lines[0].map((line) => line.split('').map(() => false));
  lines.forEach((grid) => (
    grid.forEach((line, i) => (
      line.split('').forEach((value, j) => (
        finalGrid[i][j] = (value === 'X') ? true : finalGrid[i][j]
      ))
    ))
  ));
  return finalGrid;
}

function playSoundSequence(game, snds = []) {
  if (snds.length === 0) return;
  const snd = game.add.sound(snds.shift()).play();
  snd.onStop.add(() => {
    playSoundSequence(game, snds);
  });
}

export default class extends Phaser.State {

  create() {
    this.valueTweener = new ValueTweener();
    this.pool = new Pool();

    this.game.scale.leaveIncorrectOrientation.add(() => {
      window.location.reload();
    });

    this.addBackground();

    this.addSlots();

    super.create();

    window.isAWinner = isAWinner;
  }

  shutdown() {
    TweenMax.killAll();
  }

  addBackground() {
    this.game.add.image(0, 0, 'background');
  }

  addSlots() {
    this.fullReelGrp = this.add.group(this.world, 'full-reel-group');

    const NUM_REELS = 3;
    const w = (TILE_WIDTH + SPACING) * NUM_REELS;
    const h = (TILE_HEIGHT + SPACING) * 3 - SPACING;

    // add backing
    const backing = this.addBacking(this.fullReelGrp, w + 10, h + 10);

    const reelGrp = this.add.group(this.fullReelGrp, 'reel-group');
    reelGrp.position.set(5, 5);

    this.reels = times(NUM_REELS).map((i) => (
      this.addReel(reelGrp, i * (TILE_WIDTH + SPACING), 0)
    ));

    // add mask
    const rect = this.make.graphics(0, 0);
    rect.beginFill(0xFF0000, 1);
    rect.drawRect(0, 0, w, h);
    reelGrp.addChild(rect);
    reelGrp.mask = rect;

    this.bottomBar = this.addBottomBar();

    const padding = 50;
    const availableSpace = this.world.height - this.bottomBar.height - padding;
    const defaultSpace = TILE_HEIGHT * 3 + 20;

    this.fullReelGrp.scale.y = this.fullReelGrp.scale.x = availableSpace / defaultSpace;
    const offsetX = (backing.width * this.fullReelGrp.scale.x) / 2;
    const offsetY = (backing.height * this.fullReelGrp.scale.y) / 2;
    this.fullReelGrp.pivot.set(backing.width / 2, backing.height / 2);
    this.fullReelGrp.position.set(
      (this.world.width - backing.width * this.fullReelGrp.scale.x) / 2 + offsetX,
      10 + offsetY
    );
  }

  addBottomBar() {
    const grp = this.game.add.group();
    grp.position.set(0, this.world.height - 100);

    // spin button
    this.spinBtn = this.addButton(
      grp,
      this.world.centerX,
      0,
      'spin',
      () => {
        this.spin();
      }
    );
    this.spinBtn.x -= this.spinBtn.width / 2;
    this.autoSparkle(this.spinBtn);
    return grp;
  }

  spin() {
    this.spinBtn.disable();
    this.game.add.sound('click').play();
    this.spinSnd = this.game.add.sound('spin', 1, true);
    this.spinSnd.play();
    const results = randomResults();
    const tl = new TimelineMax();
    this.reels.forEach((reel, i) => (
      tl.call(reel.spin, [], reel, i * SPIN_DELAY)
    ));
    tl.call(this.stop, [results], this, 2);
  }

  stop(results) {
    const promises = this.reels.map((reel, i) => (
      new Promise((resolve) => (
        TweenMax.delayedCall(i * SPIN_DELAY, () => {
          reel.requestStop(results[i], () => resolve());
        })
      ))
    ));
    Promise.all(promises).then(() => this.handleSpinsComplete(results));
  }

  handleSpinsComplete(results) {
    const grid = this.checkLinesForWin(results);
    if (grid) {
      const winningAnimals = uniq(
        flatMap(results, (line, i) => (
          line.map((value, j) => ((grid[j][i]) ? value : null))
        ))
      );
      TweenMax.delayedCall(2, () => {
        playSoundSequence(this.game, winningAnimals);
      });
      this.animateLines(grid);
    }
    this.spinSnd.stop();
    this.spinBtn.enable();
  }

  checkLinesForWin(results) {
    const filteredLines = LINES.filter((grid) => isAWinner(grid, results));
    return mergeLines(filteredLines);
  }

  animateLines(grid) {
    this.game.add.audio('success').play();
    let delay = 0;
    this.reels.forEach((reel, i) => {
      reel.part[1].cards.forEach((card, j) => {
        const result = grid[j][i];
        if (result) {
          card.glow(delay);
          delay += 0.2;
        } else {
          card.gray();
        }
      });
    });
  }

  /* -------------------------------------------------------
    -- PRIVATE
    ------------------------------------------------------- */

  addBacking(parent, w, h) {
    const g = this.game.add.graphics(0, 0, parent);
    g.beginFill(0xfed700)
     .drawRect(0, 0, w, h);
    return g;
  }

  addButton(parent, x, y, key, callback) {
    // const grp = this.game.add.group(parent);
    // grp.position.set(x, y);
    const btn = this.game.add.button(
      x,
      y,
      'assets',
      callback,
      this,
      key,
      key,
      `${key}_down`,
      key,
      parent
    );

    btn.disable = () => {
      btn.inputEnabled = false;
      btn.alpha = 0.2;
    };

    btn.enable = () => {
      btn.inputEnabled = true;
      btn.alpha = 1;
    };

    return btn;
  }

  autoSparkle(grp, options = {}) {
    const numParticles = options.numParticles || 2;
    times(numParticles).map(() => (
      TweenMax.delayedCall(random(0, 3), () => (
        this.addStarParticle(grp)
      ))
    ));
  }

  addStarParticle(parent) {
    const p = this.pool.remove('star_particle', () => {
      const img = this.game.make.image(0, 0, 'star_particle');
      img.anchor.set(0.5);
      return img;
    });
    const duration = random(1.2, 2.2);
    const spacing = 10;
    parent.addChild(p);
    p.position.set(
      random(spacing, parent.width - spacing),
      random(spacing, parent.height - spacing)
    );
    // p.position.set(spacing, spacing)
    p.scale.x = p.scale.y = 0;
    p.rotation = 0;
    const scale = random(0.8, 1.5);
    const tl = new TimelineMax({
      onComplete: () => {
        this.pool.add('star_particle', p);
        TweenMax.delayedCall(random(0, 2), () => {
          this.addStarParticle(parent);
        });
      },
    });
    tl.to(p.scale, duration / 2, { x: scale, y: scale, repeat: 1, yoyo: true })
      .to(p, duration, { angle: random(40, 100), ease: Linear.easeNone }, 0);
  }

  addReel(parent, x, y) {
    const reel = new Reel(this.game);
    reel.position.set(x, y);
    parent.addChild(reel);
    return reel;
  }
}
