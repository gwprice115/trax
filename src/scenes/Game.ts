import Phaser from 'phaser';
import { getNoiseFunction } from '../utils/utils';


const TREE = 'tree';
const ROCK = 'rock';
const PORTAL = 'portal';
const STAR = 'star';
const SKIER = 'skier';

const PROBABILITY_WEIGHTS = normalizeWeights({
  [ROCK]: 1,
  [TREE]: 1,
  [PORTAL]: 0,
  [STAR]: 0.5,
});

export default class Demo extends Phaser.Scene {
  private CANVAS?: HTMLCanvasElement;
  private PLAYER_WIDTH: number;
  private PLAYER_HEIGHT: number;
  private PLAYER_VELOCITY: number;
  private ticks: number;
  private gameOver: boolean = false;

  constructor() {
    super('GameScene');
    this.PLAYER_WIDTH = 74;
    this.PLAYER_HEIGHT = 68;
    this.PLAYER_VELOCITY = 160;
    this.ticks = 0;
  }

  private costume = 'base';

  private hitStaticObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    if ((obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).texture.key === PORTAL) {
      this.changeCostume(player, obstacle);
    } else {
      this.physics.pause();
      this.gameOver = true;
      (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    }
  }

  private changeCostume = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, portal: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    switch (this.costume) {
      case 'base':
        this.costume = 'recolored';
    }
  }

  preload() {
    this.CANVAS = this.game.canvas;
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/sky4.png');
    this.load.image('ground', 'http://labs.phaser.io/assets/sprites/platform.png');
    this.load.image(STAR, 'http://labs.phaser.io/assets/demoscene/star.png');
    this.load.image(PORTAL, 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.image(TREE, 'http://labs.phaser.io/assets/sprites/tree-european.png');
    this.load.image(ROCK, 'http://labs.phaser.io/assets/sprites/shinyball.png');
    this.load.spritesheet(SKIER,
      'assets/skier.png',
      { frameWidth: this.PLAYER_WIDTH, frameHeight: this.PLAYER_HEIGHT }
    );
  }

  create() {
    this.add.image(400, 300, 'sky');

    const player = this.physics.add.sprite(100, 450, SKIER).setSize(70, 10).setOffset(5, 55);
    player.setCollideWorldBounds(true);
    this.registry.set('player', player);

    this.anims.create({
      key: SKIER,
      frames: this.anims.generateFrameNumbers(SKIER, { start: 0, end: 1 }),
      frameRate: 2,
    });

    const cursors = this.input.keyboard.createCursorKeys();
    this.registry.set('cursors', cursors);

    const curveSetter = this.physics.add.sprite((this.CANVAS?.width ? this.CANVAS?.width : 0),
      this.CANVAS?.height ? this.CANVAS?.height / 2 : 0, SKIER);
    curveSetter.body.checkCollision.up = curveSetter.body.checkCollision.down = true;

    this.registry.set("curveSetterNoise", getNoiseFunction(5));
    this.registry.set("curveSetter", curveSetter);


    // load score text
    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });
    this.registry.set('scoreText', scoreText);

    const staticObstacles = this.physics.add.group();
    this.physics.add.overlap(player, staticObstacles, this.hitStaticObstacle, undefined, this);

    this.registry.set('staticObstacles', staticObstacles);
    setInterval(() => {
      if (!this.gameOver) {
        let weightSum = 0;
        let assetPlaced = false;
        const randomValue = Math.random();
        Object.keys(PROBABILITY_WEIGHTS).forEach(assetKey => {
          if (!assetPlaced && randomValue <= weightSum + PROBABILITY_WEIGHTS[assetKey]) {
            assetPlaced = true;
            let yPosition = Math.random() * (this.CANVAS?.height ?? 0);
            while (yPosition > curveSetter.y - 100 && yPosition < curveSetter.y + 100) {
              yPosition = Math.random() * (this.CANVAS?.height ?? 0);
            }
            const newObstacle = staticObstacles.create((this.CANVAS?.width ?? 0) + 50, yPosition, assetKey, 0);
            newObstacle.displayHeight = 40;
            newObstacle.scaleX = newObstacle.scaleY;
          } else {
            weightSum += PROBABILITY_WEIGHTS[assetKey];
          }
        });
        assetPlaced = false;
        weightSum = 0;
      }
    }, 50);

  }
  update() {
    this.ticks++;
    if (!this.gameOver) {
      const score = Math.floor(this.ticks / 10);
      this.registry.get('scoreText').setText('Score: ' + score);
    }
    const cursors = this.registry.get('cursors');
    const player = this.registry.get('player');
    const curveSetter = this.registry.get('curveSetter');
    const curveSetterNoise = this.registry.get('curveSetterNoise');

    if (!this.gameOver) {
      player.anims.play(SKIER, true);

      if (cursors.up.isDown) {
        player.setVelocityY(-160);
        player.angle = -30;
        player.setOffset(10, 35);
      }
      else if (cursors.down.isDown) {
        player.setVelocityY(160);
        player.angle = 30;
        player.setOffset(-12, 65);
      }
      else {
        player.setVelocityY(0);
        player.angle = 0;
        player.setOffset(5, 55);
      }
    }
    // Randomly move the curveSetter by choosing a value uniformly between -1, 0, 1
    const direction = Math.sign(10 * curveSetterNoise(this.ticks));
    curveSetter.setVelocityY(direction * this.PLAYER_VELOCITY);

    // update static obstacle positions
    const staticObstacles: Phaser.Physics.Arcade.Group = this.registry.get('staticObstacles');
    staticObstacles.children.entries.forEach((child) => {
      const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if (typedChild.body.right <= 0) {
        staticObstacles.remove(typedChild, true, true);
      } else {
        typedChild.setVelocityX(-100);
      }
    });
  }
}

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const valueSum = Object.values(weights).reduce((a, b) => a + b);
  const coefficient = 1 / valueSum;
  return Object.entries(weights).reduce((p, [k, v]) => Object.assign(p, { [k]: v * coefficient }), {});
}