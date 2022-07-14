import Phaser, { Game } from 'phaser';

export const GAME_VELOCITY = -60;
import { WOLF, PORTAL, LITTLE_ROCK, BIG_ROCK, SKIER, Spawner, TREE, SNOWMAN, BEAR, DINOSAUR, TREE_SNOWY_1, TREE_SNOWY_2, STICK, STONE, STONE2, TREE_TRUNK, HOUSE, TREE_EMPTY_1, TREE_EMPTY_2 } from '../Spawner';
import Player from '../Player';
import { SCREEN_HEIGHT } from '../config';

export const SKI_TRAIL = 'ski-trail';
export const START_GAME_VELOCITY = -80;

export const enum GameStates {
  Instructions,
  PlayGame,
  GameOver
}

export default class SkiFreeScene extends Phaser.Scene {
  public canvas: { height: number; width: number } = { height: 0, width: 0 };
  private ticks: number = 0;
  public gameState: GameStates | undefined;
  public player: Player | undefined;
  private spawner: Spawner | undefined;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  public gameOver: Phaser.GameObjects.Image | undefined;
  public tryAgain: Phaser.GameObjects.Image | undefined;
  public instructions: Phaser.GameObjects.Image | undefined;
  public start: Phaser.GameObjects.Image | undefined;

  public gameVelocity: number = START_GAME_VELOCITY;

  constructor() {
    super('GameScene');
  }

  private costume = 'base';

  private bg_snow?: Phaser.GameObjects.TileSprite;
  private bg_sky?: Phaser.GameObjects.TileSprite;
  private bg_mtnnear?: Phaser.GameObjects.TileSprite;
  private bg_mtnfar?: Phaser.GameObjects.TileSprite;

  public staticObstacles?: Phaser.Physics.Arcade.Group;
  public dynamicObstacles?: Phaser.Physics.Arcade.Group;

  private hitObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.physics.pause();
    this.gameState = GameStates.GameOver;
    this.gameVelocity = START_GAME_VELOCITY;
    this.ticks = 0;
    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    (obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
  }

  private worldToTileUnit = (worldUnit: number) => worldUnit / 120;

  public getSizeWithPerspective = (yPosition: number, baseSize: number) => (baseSize * 0.3 * yPosition / this.canvas.height) + (baseSize * 0.7);

  public getSkyHeight = () => this.canvas.height * 0.35;

  public destroyGame = () => {
    // destroy previous elements, if they exist
    this.staticObstacles?.clear(true, true);
    this.dynamicObstacles?.clear(true, true);
    this.player?.destruct();
    this.registry.get('scoreText')?.destroy();
  }

  public createGameElements = () => {
    if (!this.spawner) {
      this.spawner = new Spawner(this);
    }
    this.player = new Player(this, 100, 450, SKIER);

    // set up static and dynamic obstacle groups
    this.staticObstacles = this.physics.add.group({
      runChildUpdate: true
    })
    this.dynamicObstacles = this.physics.add.group({
      runChildUpdate: true
    })

    // hook up collisions
    if (this.player) {
      this.physics.add.overlap(this.player, this.staticObstacles, this.hitObstacle, undefined, this);
      this.physics.add.overlap(this.player, this.dynamicObstacles, this.hitObstacle, undefined, this);
    }


    // load score text
    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '20px', color: '#000' });
    this.registry.set('scoreText', scoreText);
    scoreText.setDepth(1)
  }

  public createAnimations = () => {
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
      frameRate: 8,
      repeat: -1,
    })
  }

  public initGame = (state: GameStates) => {
    this.ticks = 0;
    this.gameVelocity = START_GAME_VELOCITY;
    this.gameState = state;

    this.destroyGame();
    this.createGameElements();

    this.physics.resume();
  };

  private createStartMenu = () => {
    if (this.start) return;

    this.instructions = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 3 + 10, 'instructions')
    this.start = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 10, 'start').setInteractive({ cursor: "pointer" })
      .on('pointerover', () => { this.start?.setTexture('startHover') })
      .on('pointerout', () => { this.start?.setTexture('start') })
      .on('pointerup', () => {
        this.initGame(GameStates.PlayGame); this.instructions?.destroy(); this.instructions = undefined;
        this.start?.destroy(); this.start = undefined;
      });
    this.start?.setDepth(1);
    this.instructions?.setDepth(1);
  }

  private createGameOver = () => {
    if (this.gameOver) return;
    // create tryAgain button
    this.gameOver = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2, 'gameOver');
    this.tryAgain = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 35, 'tryAgain').setInteractive({ cursor: "pointer" })
      .on('pointerover', () => { this.tryAgain?.setTexture('tryAgainHover') })
      .on('pointerout', () => { this.tryAgain?.setTexture('tryAgain') })
      .on('pointerup', () => {
        this.gameOver?.destroy();
        this.gameOver = undefined;
        this.tryAgain?.destroy();
        this.tryAgain = undefined;
        this.initGame(GameStates.PlayGame);
      });
    this.gameOver?.setDepth(1);
    this.tryAgain?.setDepth(2);
  }

  preload() {
    this.scale.refresh();
    this.canvas = this.game.canvas;
    this.load.image('tryAgain', 'assets/try-again.png')
    this.load.image('tryAgainHover', 'assets/try-again-hover.png')
    this.load.image('gameOver', 'assets/game-over.png')
    this.load.image('start', 'assets/start.png')
    this.load.image('startHover', 'assets/start-hover.png')
    this.load.image('instructions', 'assets/instructions.png')
    this.load.image('bg_mtnnear', 'assets/bg_mtnnear.png')
    this.load.image('bg_mtnfar', 'assets/bg_mtnfar.png')
    this.load.image('bg_sky', 'assets/bg_sky.png')
    this.load.image('bg_snow', 'assets/bg_snow.png')
    this.load.image(HOUSE, 'assets/house.png');
    this.load.image(SNOWMAN, 'assets/snowman.png');
    this.load.image(PORTAL, 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.image(SKI_TRAIL, 'http://labs.phaser.io/assets/particles/blue.png');
    this.load.image(STICK, 'assets/stick.png');
    this.load.image(STONE, 'assets/stone.png');
    this.load.image(STONE2, 'assets/stone2.png');
    this.load.image(TREE_EMPTY_1, 'assets/tree_empty1.png');
    this.load.image(TREE_EMPTY_2, 'assets/tree_empty2.png');
    this.load.image(TREE_SNOWY_1, 'assets/tree_snowy1.png');
    this.load.image(TREE_SNOWY_2, 'assets/tree_snowy2.png');
    this.load.image(TREE_TRUNK, 'assets/tree_trunk.png');
    this.load.image(TREE, 'assets/tree.png');
    this.load.image(LITTLE_ROCK, 'assets/rock_little.png');
    this.load.image(BIG_ROCK, 'assets/rock_big.png');
    this.load.spritesheet(DINOSAUR, 'assets/dinosaur.png', { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet(SKIER, 'assets/skier.png', { frameWidth: Player.WIDTH, frameHeight: Player.HEIGHT });
    this.load.spritesheet(WOLF, 'assets/running_wolf_sprite.png', { frameWidth: 563, frameHeight: 265 });
    this.load.spritesheet(BEAR, 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
  }

  create() {
    this.bg_sky = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_sky")
      .setOrigin(0)
    this.bg_mtnfar = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtnfar")
      .setOrigin(0)
    this.bg_mtnnear = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtnnear")
      .setOrigin(0)
    this.bg_snow = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_snow")
      .setOrigin(0)

    this.createAnimations();
    this.gameState = GameStates.Instructions;

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  private moveBackground = () => {
    this.bg_snow && (this.bg_snow.tilePositionX -= this.worldToTileUnit(this.gameVelocity));
    this.bg_mtnnear && (this.bg_mtnnear.tilePositionX -= this.worldToTileUnit(0.9 * this.gameVelocity));
    this.bg_mtnfar && (this.bg_mtnfar.tilePositionX -= this.worldToTileUnit(0.7 * this.gameVelocity));
    this.bg_sky && (this.bg_sky.tilePositionX -= this.worldToTileUnit(0.5 * this.gameVelocity));
  }

  update() {
    this.scale.refresh();
    switch (this.gameState) {
      case GameStates.Instructions:
        this.moveBackground();
        this.createStartMenu();
        break;
      case GameStates.PlayGame:
        this.moveBackground();
        this.ticks++;
        this.gameVelocity -= 0.1;
        const score = Math.floor(this.ticks / 10);
        this.registry.get('scoreText').setText('Score: ' + score);
        this.player?.update();
        this.spawner?.updateCurveSetter(this.ticks);
        this.spawner?.maybeSpawnObstacle(this.ticks);

        // update static obstacle positions
        this.staticObstacles?.children.entries.forEach((child) => {
          const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
          if (typedChild.body.right <= 0) {
            this.staticObstacles?.remove(typedChild, true, true);
          }
        });

        // Dynamic obstacle trash collection
        this.dynamicObstacles?.children.entries.forEach((child) => {
          const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
          if (typedChild.body.right <= 0) {
            this.dynamicObstacles?.remove(typedChild, true, true);
          }
        });
        break;
      case GameStates.GameOver:
        this.createGameOver();
        break;
    }
  }
}
