import Phaser from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config';
import Tracking from '../dynamicObstacles/Tracking';
import Chasing from '../dynamicObstacles/Chasing';
import Falling from '../dynamicObstacles/Falling';

export const GAME_VELOCITY = -100;
import { getNoiseFunction } from '../utils/utils';
import Player from '../Player';


const TREE = 'tree';
const ROCK = 'rock';
const PORTAL = 'portal';
const STAR = 'star';
const SKIER = 'skier';
const BEAR = 'bear';
const CARTMAN = 'cartman';


const PLAYER_WIDTH = 74;
const PLAYER_HEIGHT = 68;
const PLAYER_VELOCITY = 160;

const STATIC_PROBABILITY_WEIGHTS = normalizeWeights({
  [ROCK]: 1,
  [TREE]: 1,
  [PORTAL]: 0,
});

const DYNAMIC_PROBABILITY_WEIGHTS = normalizeWeights({
  [STAR]: 2,
  [BEAR]: 1,
  [CARTMAN]: 0.5,
});

export default class Demo extends Phaser.Scene {
  private CANVAS?: HTMLCanvasElement;
  private ticks: number = 0;
  public gameOver: boolean = false;
  private player: Player | undefined;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  public keydown: Phaser.Input.Keyboard.KeyboardPlugin | undefined;

  constructor() {
    super('GameScene');
  }

  private costume = 'base';
  private bears: Phaser.Physics.Arcade.Group | undefined;
  private stars: Phaser.Physics.Arcade.Group | undefined;

  private staticObstacles?: Phaser.Physics.Arcade.Group;
  private dynamicObstacles?: Phaser.Physics.Arcade.Group;

  private score = 0;

  private hitObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
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

  private listener = (keypressed: Phaser.Input.Keyboard.KeyboardPlugin) => {
    console.log(keypressed.key)
  }

  preload() {
    this.CANVAS = this.game.canvas;
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/sky4.png');
    this.load.image('ground', 'http://labs.phaser.io/assets/sprites/platform.png');
    this.load.image(STAR, 'http://labs.phaser.io/assets/demoscene/star.png');
    this.load.image(PORTAL, 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.image(TREE, 'http://labs.phaser.io/assets/sprites/tree-european.png');
    this.load.image(ROCK, 'http://labs.phaser.io/assets/sprites/shinyball.png');
    // this.load.image(PORTAL, 'assets/portal.png');
    this.load.spritesheet(SKIER, 'assets/skier.png', { frameWidth: PLAYER_WIDTH, frameHeight: PLAYER_HEIGHT });
    this.load.image(CARTMAN, 'http://labs.phaser.io/assets/svg/cartman.svg');
    this.load.spritesheet('bear', 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
  }


  create() {
    this.add.image(400, 300, 'sky');
    this.player = new Player(this, 100, 450, SKIER);

    // set up static and dynamic obstacle groups
    this.staticObstacles = this.physics.add.group({
      runChildUpdate: true
    })
    this.dynamicObstacles = this.physics.add.group({
      runChildUpdate: true
    })

    // hook up collisions
    this.physics.add.overlap(this.player, this.staticObstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.dynamicObstacles, this.hitObstacle, undefined, this);

    // define animations for dude
    this.anims.create({
      key: SKIER,
      frames: this.anims.generateFrameNumbers(SKIER, { start: 0, end: 1 }),
      frameRate: 2,
    });

    this.anims.create({
      key: 'bear',
      frames: this.anims.generateFrameNumbers('bear', { start: 30, end: 48 }),
      frameRate: 15,
      repeat: -1,
    })

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keydown = this.input.keyboard.on('keydown', this.listener);

    const curveSetter = this.physics.add.sprite((this.CANVAS?.width ? this.CANVAS?.width : 0),
      this.CANVAS?.height ? this.CANVAS?.height / 2 : 0, SKIER);
    curveSetter.body.checkCollision.up = curveSetter.body.checkCollision.down = true;

    this.registry.set("curveSetterNoise", getNoiseFunction(10));
    this.registry.set("curveSetter", curveSetter);

    setInterval(() => {
      const { staticObstacles } = this;
      if (!this.gameOver && staticObstacles != null) {
        let weightSum = 0;
        let assetPlaced = false;
        const randomValue = Math.random();
        Object.keys(STATIC_PROBABILITY_WEIGHTS).forEach(assetKey => {
          if (!assetPlaced && randomValue <= weightSum + STATIC_PROBABILITY_WEIGHTS[assetKey]) {
            assetPlaced = true;
            let yPosition = Math.random() * (this.CANVAS?.height ?? 0);
            while (yPosition > curveSetter.y - 100 && yPosition < curveSetter.y + 100) {
              yPosition = Math.random() * (this.CANVAS?.height ?? 0);
            }
            const newObstacle = staticObstacles.create(800, yPosition, assetKey, 0);
            newObstacle.displayHeight = 40;
            newObstacle.scaleX = newObstacle.scaleY;
          } else {
            weightSum += STATIC_PROBABILITY_WEIGHTS[assetKey];
          }
        });
        assetPlaced = false;
        weightSum = 0;
      }
    }, 50);

    setInterval(() => {
      const { player } = this;
      if (!this.gameOver && this.dynamicObstacles != null && player != null) {
        let weightSum = 0;
        let assetPlaced = false;
        const randomValue = Math.random();
        Object.keys(DYNAMIC_PROBABILITY_WEIGHTS).forEach(assetKey => {
          if (!assetPlaced && randomValue <= weightSum + DYNAMIC_PROBABILITY_WEIGHTS[assetKey]) {
            assetPlaced = true;
            switch (assetKey) {
              case BEAR:
                const bear = new Tracking(this, SCREEN_WIDTH, player.body.y, BEAR, player);
                bear.body.setSize(32, 48);
                this.dynamicObstacles?.add(bear, true);
                break;
              case STAR:
                const star = new Falling(this, SCREEN_WIDTH * (Math.random() + 1) / 2, 0, STAR)
                this.dynamicObstacles?.add(star, true);
              case CARTMAN:
                const cartman = new Chasing(this, SCREEN_WIDTH, Math.random() * SCREEN_HEIGHT, CARTMAN)
                cartman.displayHeight = 30;
                cartman.scaleX = cartman.scaleY;
                this.dynamicObstacles?.add(cartman, true);
            }
          } else {
            weightSum += DYNAMIC_PROBABILITY_WEIGHTS[assetKey];
          }
        });
        assetPlaced = false;
        weightSum = 0;
      }
    }, 3000);

//     load score text
    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000'});
    scoreText.setDepth(1)
    this.registry.set('scoreText', scoreText);

    this.time.addEvent({
      delay: 0,
      loop: false,
      callback: () => {
          this.scene.stop();
          this.gameOver = true;
          this.scene.start("GameOverScene");
      }
    })
  }

  update() {
    this.ticks++;

    const curveSetter = this.registry.get('curveSetter');
    const curveSetterNoise = this.registry.get('curveSetterNoise');

    this.player?.update();
    // Randomly move the curveSetter by choosing a value uniformly between -1, 0, 1
    enum CurveSetterDirection {
      Up = -1,
      Down = 1,
    }

    const direction = curveSetterNoise(this.ticks) < 0 ? CurveSetterDirection.Down : CurveSetterDirection.Up;

    if ((direction == CurveSetterDirection.Up &&
      curveSetter.y > PLAYER_HEIGHT / 2) ||
      (direction == CurveSetterDirection.Down &&
        curveSetter.y < (this.CANVAS?.height ? this.CANVAS?.height : 0) - PLAYER_HEIGHT / 2)
    ) {
      curveSetter.setVelocityY(direction * PLAYER_VELOCITY);
    } else {
      curveSetter.setVelocityY(0);
    }


    // update static obstacle positions
    this.staticObstacles?.children.entries.forEach((child) => {
      const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if (typedChild.body.right <= 0) {
        this.staticObstacles?.remove(typedChild, true, true);
      } else {
        typedChild.setVelocityX(-100);
      }
    });

    if (!this.gameOver) {
      const score = Math.floor(this.ticks / 10);
      this.registry.get('scoreText').setText('Score: ' + score);
    }
  }
}

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const valueSum = Object.values(weights).reduce((a, b) => a + b);
  const coefficient = 1 / valueSum;
  return Object.entries(weights).reduce((p, [k, v]) => Object.assign(p, { [k]: v * coefficient }), {});
}
