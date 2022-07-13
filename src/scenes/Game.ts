import Phaser from 'phaser';

export const GAME_VELOCITY = -60;
import { WOLF, PORTAL, LITTLE_ROCK, BIG_ROCK, SKIER, Spawner, TREE, SNOWMAN, BEAR, DINOSAUR } from '../Spawner';
import Player from '../Player';
import { SCREEN_HEIGHT } from '../config';

export const SKI_TRAIL = 'ski-trail';
export const START_GAME_VELOCITY = -80;

export default class SkiFreeScene extends Phaser.Scene {
  public canvas: { height: number; width: number } = { height: 0, width: 0 };
  private ticks: number = 0;
  public gameOver: boolean = false;
  public player: Player | undefined;
  private spawner: Spawner | undefined;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;

  public gameVelocity: number = START_GAME_VELOCITY;

  constructor() {
    super('GameScene');
  }

  private costume = 'base';

  private bg_snow?: Phaser.GameObjects.TileSprite;
  private bg_sky?: Phaser.GameObjects.TileSprite;
  private bg_mtn?: Phaser.GameObjects.TileSprite;

  public staticObstacles?: Phaser.Physics.Arcade.Group;
  public dynamicObstacles?: Phaser.Physics.Arcade.Group;

  private hitObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.physics.pause();
    this.gameOver = true;
    this.gameVelocity = START_GAME_VELOCITY;
    this.ticks = 0;
    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    this.time.addEvent({
      delay: 1000,
      loop: false,
      callback: () => {
        this.scene.start("GameOverScene");
      }
    })
  }

  private worldToTileUnit = (worldUnit: number) => worldUnit / 150;

  public getSizeWithPerspective = (yPosition: number, baseSize: number) => (baseSize * 0.3 * yPosition / this.canvas.height) + (baseSize * 0.7);

  public getSkyHeight = () => this.canvas.height * 0.38;

  preload() {
    this.scale.refresh();
    this.canvas = this.game.canvas;
    this.load.image('bg_mtn', 'assets/bg_mtn.png')
    this.load.image('bg_sky', 'assets/bg_sky.png')
    this.load.image('bg_snow', 'assets/bg_snow.png')
    this.load.image(SNOWMAN, 'assets/snowman.png');
    this.load.image(PORTAL, 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.image(SKI_TRAIL, 'http://labs.phaser.io/assets/particles/blue.png');
    this.load.image(TREE, 'assets/tree_snowy1.png');
    this.load.image(LITTLE_ROCK, 'assets/rock_little.png');
    this.load.image(BIG_ROCK, 'assets/rock_big.png');
    this.load.spritesheet(DINOSAUR, 'assets/dinosaur.png', { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet(SKIER, 'assets/skier.png', { frameWidth: Player.WIDTH, frameHeight: Player.HEIGHT });
    this.load.spritesheet(WOLF, 'assets/running_wolf_sprite.png', { frameWidth: 563, frameHeight: 265 });
    this.load.spritesheet(BEAR, 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
  }

  create() {
    this.gameOver = false;
    this.bg_sky = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_sky")
      .setOrigin(0)
    this.bg_mtn = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtn")
      .setOrigin(0)
    this.bg_snow = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_snow")
      .setOrigin(0)

    console.log(this.bg_sky, this.bg_mtn, this.bg_snow)
    this.player = new Player(this, 100, 450, SKIER);
    this.spawner = new Spawner(this);

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
      key: BEAR,
      frames: this.anims.generateFrameNumbers(BEAR, { start: 30, end: 48 }),
      frameRate: 15,
      repeat: -1,
    })

    this.anims.create({
      key: DINOSAUR,
      frames: this.anims.generateFrameNumbers(DINOSAUR, { start: 0, end: 1 }),
      frameRate: 5,
      repeat: -1,
    })

    this.anims.create({
      key: WOLF,
      frames: this.anims.generateFrameNumbers(WOLF, { start: 0, end: 7 }),
      frameRate: 5,
      repeat: -1,
    })

    this.cursors = this.input.keyboard.createCursorKeys();

    // load score text
    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '12px', color: '#000' });
    this.registry.set('scoreText', scoreText);
    scoreText.setDepth(1)
  }

  update() {
    if (!this.gameOver) {
      this.ticks++;
      this.gameVelocity -= 0.1;
      this.bg_snow && (this.bg_snow.tilePositionX -= this.worldToTileUnit(this.gameVelocity));
      this.bg_mtn && (this.bg_mtn.tilePositionX -= this.worldToTileUnit(0.9 * this.gameVelocity));
      this.bg_sky && (this.bg_sky.tilePositionX -= this.worldToTileUnit(0.6 * this.gameVelocity));
      const score = Math.floor(this.ticks / 10);
      this.registry.get('scoreText').setText('Score: ' + score);
    }

    this.player?.update();
    this.spawner?.updateCurveSetter(this.ticks);
    this.spawner?.maybeSpawnObstacle(this.ticks);

    // update static obstacle positions
    this.staticObstacles?.children.entries.forEach((child) => {
      const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if (typedChild.body.right <= 0) {
        this.staticObstacles?.remove(typedChild, true, true);
      } else {
        typedChild.setVelocityX(this.gameVelocity)
      }
    });

    this.staticObstacles?.children.iterate(obstacle => {
      const ob = obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      ob.texture.key === DINOSAUR ? ob.anims.play(DINOSAUR, true) : {}
    });

    // Dynamic obstacle trash collection
    this.dynamicObstacles?.children.entries.forEach((child) => {
      const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if (typedChild.body.right <= 0) {
        this.dynamicObstacles?.remove(typedChild, true, true);
      }
    });
  }
}
