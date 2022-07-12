import Phaser, { GameObjects } from 'phaser';
import { SCREEN_WIDTH } from '../config';
import Tracking from '../dynamicObstacles/Tracking';
import Chasing from '../dynamicObstacles/Chasing';
import Falling from '../dynamicObstacles/Falling';

export const GAME_VELOCITY = -100;
import { getNoiseFunction } from '../utils/utils';


const TREE = 'tree';
const ROCK = 'rock';
const PORTAL = 'portal';
const STAR = 'star';

const PROBABILITY_WEIGHTS = normalizeWeights({
  [ROCK]: 1,
  [TREE]: 1,
  [PORTAL]: 1,
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
    this.PLAYER_WIDTH = 32;
    this.PLAYER_HEIGHT = 48;
    this.PLAYER_VELOCITY = 160;
    this.ticks = 0;
  }

  private bears?: Phaser.Physics.Arcade.Group;
  private stars?: Phaser.Physics.Arcade.Group;

  private score = 0;
  private costume = 'dude';

  private hitStaticObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    if ((obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).texture.key === PORTAL) {
      this.changeCostume(player, obstacle);
    } else {
      this.physics.pause();
      this.gameOver = true;
      (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    }
  }


  private collectStar = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, star: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    (star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).disableBody(true, true);
    this.score += 10;
    this.registry.get('scoreText').setText('Score: ' + this.score);

    // TODO when we get path coordinates: const pathY = map.getY((SCREEN_WIDTH - player.body.x) / 4);

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

    this.bears = this.physics.add.group({
			classType: Tracking,
			runChildUpdate: true
		})
    this.physics.add.collider(player, this.bears, this.hitStaticObstacle, undefined, this);

    this.stars = this.physics.add.group({
      classType: Falling,
      key: 'star',
      repeat: 110,
      setXY: { x: 12, y: 0, stepX: 70 },
      runChildUpdate: true
    })
    this.stars.children.iterate(child => {
      const typedChild = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      typedChild.setY(Phaser.Math.FloatBetween(0, 200));
    });
    this.physics.add.overlap(player, this.stars, this.collectStar, undefined, this);
    const curveSetter = this.physics.add.sprite((this.CANVAS?.width ? this.CANVAS?.width : 0),
      this.CANVAS?.height ? this.CANVAS?.height / 2 : 0, 'dude');
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
          console.log(assetKey);
          // console.log(weightSum + randomValue, PROBABILITY_WEIGHTS[assetKey]);
          if (!assetPlaced && randomValue <= weightSum + PROBABILITY_WEIGHTS[assetKey]) {
            assetPlaced = true;
            const newObstacle = staticObstacles.create(800, Math.random() * (this.CANVAS?.height ?? 0), assetKey, 0);
            newObstacle.displayHeight = 40;
            newObstacle.scaleX = newObstacle.scaleY;
          } else {
            weightSum += PROBABILITY_WEIGHTS[assetKey];
          }
        });
        assetPlaced = false;
        weightSum = 0;
      }
    }, 500);

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
