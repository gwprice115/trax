import Phaser, { GameObjects } from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config';
import Tracking from '../dynamicObstacles/Tracking';
import Chasing from '../dynamicObstacles/Chasing';
import Falling from '../dynamicObstacles/Falling';

export const GAME_VELOCITY = -100;
import { getNoiseFunction } from '../utils/utils';


const TREE = 'tree';
const ROCK = 'rock';
const PORTAL = 'portal';
const STAR = 'star';
const BEAR = 'bear';

const STATIC_PROBABILITY_WEIGHTS = normalizeWeights({
  [ROCK]: 1,
  [TREE]: 1,
  [PORTAL]: 1,
});

const DYNAMIC_PROBABILITY_WEIGHTS = normalizeWeights({
  [STAR]: 2,
  [BEAR]: 1,
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
    this.PLAYER_WIDTH = 32;
    this.PLAYER_HEIGHT = 48;
    this.PLAYER_VELOCITY = 160;
    this.ticks = 0;
  }

  private bears: Phaser.Physics.Arcade.Group | undefined;
  private stars: Phaser.Physics.Arcade.Group | undefined;

  private staticObstacles?: Phaser.Physics.Arcade.Group;
  private dynamicObstacles?: Phaser.Physics.Arcade.Group;

  private score = 0;
  private costume = 'dude';

  private hitObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    if ((obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).texture.key === PORTAL) {
      this.changeCostume(player, obstacle);
    } else {
      this.physics.pause();
      this.gameOver = true;
      (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    }
  }

  // TODO change bear spawning to be random instead of dependent on collecting stars
  private collectStar = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, star: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    (star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).disableBody(true, true);
    this.score += 10;
    this.registry.get('scoreText').setText('Score: ' + this.score);

    var y = (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).y;

    const bear = new Tracking(this, 800, y, "bear", player);
    bear.body.setSize(32, 48);
    this.bears?.add(bear, true);
  }

  private changeCostume = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, portal: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    switch (this.costume) {
      case 'dude':
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
    this.load.spritesheet('recolored', 'assets/dude_recolored.png', { frameWidth: this.PLAYER_WIDTH, frameHeight: this.PLAYER_HEIGHT });
    this.load.spritesheet('dude',
      'http://labs.phaser.io/assets/sprites/dude.png',
      { frameWidth: this.PLAYER_WIDTH, frameHeight: this.PLAYER_HEIGHT }
    );
    this.load.spritesheet('bear', 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
  }


  create() {
    this.add.image(400, 300, 'sky');

    // load dude in
    const player = this.physics.add.sprite(100, 450, 'dude');
    player.setCollideWorldBounds(true);
    this.registry.set('player', player);

    // set up static and dynamic obstacle groups
    this.staticObstacles = this.physics.add.group({
      runChildUpdate: true
    })
    this.dynamicObstacles = this.physics.add.group({
      runChildUpdate: true
    })

    // define animations for dude
    this.anims.create({
      key: 'dude_left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'dude_turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: 'dude_right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    // define animations for recolored dude
    this.anims.create({
      key: 'recolored_left',
      frames: this.anims.generateFrameNumbers('recolored', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'recolored_turn',
      frames: [{ key: 'recolored', frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: 'recolored_right',
      frames: this.anims.generateFrameNumbers('recolored', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'bear',
      frames: this.anims.generateFrameNumbers('bear', { start: 30, end: 48 }),
      frameRate: 15,
      repeat: -1,
    })

    const cursors = this.input.keyboard.createCursorKeys();
    this.registry.set('cursors', cursors);

    const curveSetter = this.physics.add.sprite((this.CANVAS?.width ? this.CANVAS?.width : 0),
      this.CANVAS?.height ? this.CANVAS?.height / 2 : 0, 'dude');
    curveSetter.body.checkCollision.up = curveSetter.body.checkCollision.down = true;

    this.registry.set("curveSetterNoise", getNoiseFunction(5));
    this.registry.set("curveSetter", curveSetter);


    // load score text
    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });
    this.registry.set('scoreText', scoreText);

    // const staticObstacles = this.physics.add.group();
    this.physics.add.overlap(player, this.staticObstacles!, this.hitObstacle, undefined, this);

    // const dynamicObstacles = this.physics.add.group();
    this.physics.add.overlap(player, this.dynamicObstacles!, this.hitObstacle, undefined, this);

    setInterval(() => {
      if (!this.gameOver && this.staticObstacles != null) {
        let weightSum = 0;
        let assetPlaced = false;
        const randomValue = Math.random();
        Object.keys(STATIC_PROBABILITY_WEIGHTS).forEach(assetKey => {
          // console.log(assetKey);
          // console.log(weightSum + randomValue, PROBABILITY_WEIGHTS[assetKey]);
          if (!assetPlaced && randomValue <= weightSum + STATIC_PROBABILITY_WEIGHTS[assetKey]) {
            assetPlaced = true;
            const newObstacle = this.staticObstacles.create(800, Math.random() * (this.CANVAS?.height ?? 0), assetKey, 0);
            newObstacle.displayHeight = 40;
            newObstacle.scaleX = newObstacle.scaleY;
          } else {
            weightSum += STATIC_PROBABILITY_WEIGHTS[assetKey];
          }
        });
        assetPlaced = false;
        weightSum = 0;
      }
    }, 500);

    setInterval(() => {
      if (!this.gameOver && this.dynamicObstacles != null) {
        let weightSum = 0;
        let assetPlaced = false;
        const randomValue = Math.random();
        Object.keys(DYNAMIC_PROBABILITY_WEIGHTS).forEach(assetKey => {
          console.log(assetKey);
          // console.log(weightSum + randomValue, PROBABILITY_WEIGHTS[assetKey]);
          if (!assetPlaced && randomValue <= weightSum + DYNAMIC_PROBABILITY_WEIGHTS[assetKey]) {
            assetPlaced = true;
            switch (assetKey) {
              case BEAR:
                const bear = new Tracking(this, SCREEN_WIDTH, player.body.y, BEAR, player);
                bear.body.setSize(32, 48);
                this.dynamicObstacles.add(bear, true);
                break;
              case STAR:
                const star = new Falling(this, SCREEN_WIDTH * (Math.random()+1)/2, 0, STAR)
                this.dynamicObstacles.add(star, true);
            }
          } else {
            weightSum += DYNAMIC_PROBABILITY_WEIGHTS[assetKey];
          }
        });
        assetPlaced = false;
        weightSum = 0;
      }
    }, 3000);
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

    if (cursors.up.isDown) {
      player.setVelocityY(-160);
      player.anims.play(this.costume + '_right', true);
    }
    else if (cursors.down.isDown) {
      player.setVelocityY(160);
      player.anims.play(this.costume + '_right', true);
    }
    else {
      player.setVelocityY(0);
      player.anims.play(this.costume + '_turn');
    }

    // Randomly move the curveSetter by choosing a value uniformly between -1, 0, 1
    const direction = Math.sign(10 * curveSetterNoise(this.ticks));
    curveSetter.setVelocityY(direction * this.PLAYER_VELOCITY);

    // update static obstacle positions
    // const staticObstacles: Phaser.Physics.Arcade.Group = this.registry.get('staticObstacles');
    this.staticObstacles?.children.entries.forEach((child) => {
      const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if (typedChild.body.right <= 0) {
        this.staticObstacles.remove(typedChild, true, true);
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
