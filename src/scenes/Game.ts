import Phaser from 'phaser';

export const GAME_VELOCITY = -60;
import { CARTMAN, PORTAL, ROCK, SKIER, Spawner, STAR, TREE } from '../Spawner';
import Player from '../Player';
import { SCREEN_HEIGHT } from '../config';

export const SKI_TRAIL = 'ski-trail';

export default class SkiFreeScene extends Phaser.Scene {
  public canvas: { height: number; width: number } = { height: 0, width: 0 };
  private ticks: number = 0;
  public gameOver: boolean = false;
  public player: Player | undefined;
  private spawner: Spawner | undefined;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  public keydown: Phaser.Input.Keyboard.KeyboardPlugin | undefined;

  public gameVelocity: number = -60

  constructor() {
    super('GameScene');
  }

  private costume = 'base';
  
  private background?: Phaser.GameObjects.TileSprite;

  public staticObstacles?: Phaser.Physics.Arcade.Group;
  public dynamicObstacles?: Phaser.Physics.Arcade.Group;

  private hitObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.physics.pause();
    this.gameOver = true;
    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    this.time.addEvent({
      delay: 1000,
      loop: false,
      callback: () => {
          this.scene.start("GameOverScene");
      }
    })
  }

  private worldToTileUnit = (worldUnit: number) => worldUnit / 60;

  public getSizeWithPerspective = (yPosition: number, baseSize: number) => baseSize / 2 * yPosition / this.canvas.height + baseSize / 2;

  public getSkyHeight = () => this.canvas.height * 0.35;

  preload() {
    this.scale.refresh();
    this.canvas = this.game.canvas;
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/sky4.png');
    this.load.image('ground', 'http://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('background', 'assets/background.png')
    this.load.image(STAR, 'http://labs.phaser.io/assets/demoscene/star.png');
    this.load.image(PORTAL, 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.image(TREE, 'http://labs.phaser.io/assets/sprites/tree-european.png');
    this.load.image(ROCK, 'http://labs.phaser.io/assets/sprites/shinyball.png');
    this.load.image(SKI_TRAIL, 'http://labs.phaser.io/assets/particles/blue.png');
    this.load.spritesheet(SKIER, 'assets/skier.png', { frameWidth: Player.WIDTH, frameHeight: Player.HEIGHT });
    this.load.image(CARTMAN, 'http://labs.phaser.io/assets/svg/cartman.svg');
    this.load.spritesheet('bear', 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
  }

  create() {
    this.gameOver = false;
    this.background = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "background")
      .setOrigin(0)
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
      key: 'bear',
      frames: this.anims.generateFrameNumbers('bear', { start: 30, end: 48 }),
      frameRate: 15,
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
      this.gameVelocity -= 0.05;
      this.background && (this.background.tilePositionX -= this.worldToTileUnit(this.gameVelocity));
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

    // Dynamic obstacle trash collection
    this.dynamicObstacles?.children.entries.forEach((child) => {
      const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
      if(typedChild.body.right <= 0) {
        this.dynamicObstacles?.remove(typedChild, true, true);
      }
    });

    if (!this.gameOver) {
      const score = Math.floor(this.ticks / 10);
      this.registry.get('scoreText').setText('Score: ' + score);
    }
  }
}
