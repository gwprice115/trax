import Phaser, { Game } from 'phaser';

import { WOLF, PORTAL, LITTLE_ROCK, BIG_ROCK, SKIER, Spawner, TREE, SNOWMAN, BEAR, DINOSAUR, TREE_SNOWY_1, TREE_SNOWY_2, STICK, STONE, STONE2, TREE_TRUNK, HOUSE, TREE_EMPTY_1, TREE_EMPTY_2 } from '../Spawner';
import Player from '../Player';
import { SCREEN_HEIGHT } from '../config';

export const SKI_TRAIL = 'ski-trail';
export const PAUSED = 'paused';
export const START_GAME_VELOCITY = -100;

const SNOWFLAKES = 'snowflakes';
export const enum GameStates {
  Instructions,
  PlayGame,
  GameOver,
  GamePaused,
}

export default class SkiFreeScene extends Phaser.Scene {
  public canvas: { height: number; width: number } = { height: 0, width: 0 };
  private ticks: number = 0;
  public gameState: GameStates | undefined;
  public player: Player | undefined;
  private spawner: Spawner | undefined;
  private snowflakeEmitter: Phaser.GameObjects.Particles.ParticleEmitter | undefined;
  public cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  public gameOver: Phaser.GameObjects.Image | undefined;
  public gamePaused: Phaser.GameObjects.Image | undefined;
  public tryAgain: Phaser.GameObjects.Image | undefined;
  public instructions: Phaser.GameObjects.Image | undefined;
  public start: Phaser.GameObjects.Image | undefined;
  private lastUpdate?: Date;
  private skiSound?: Phaser.Sound.BaseSound;
  private soundButton: Phaser.GameObjects.Image | undefined;

  public gameVelocity: number = START_GAME_VELOCITY;

  constructor() {
    super('GameScene');
  }

  private bg_snow?: Phaser.GameObjects.TileSprite;
  private bg_sky?: Phaser.GameObjects.TileSprite;
  private bg_mtnnear?: Phaser.GameObjects.TileSprite;
  private bg_mtnfar?: Phaser.GameObjects.TileSprite;

  public staticObstacles?: Phaser.Physics.Arcade.Group;
  public dynamicObstacles?: Phaser.Physics.Arcade.Group;

  private hitObstacle = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.sound.play("ouch");
    this.physics.pause();
    this.anims.pauseAll();
    this.gameState = GameStates.GameOver;
    this.gameVelocity = START_GAME_VELOCITY;
    this.player?.skiTrailEmitter.pause();
    this.ticks = 0;
    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
    (obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
  }

  public getSizeWithPerspective = (yPosition: number, baseSize: number) => (baseSize * 0.3 * yPosition / this.canvas.height) + (baseSize * 0.7);

  public getSkyHeight = () => this.canvas.height * 0.3;

  public destroyGame = () => {
    // destroy previous elements, if they exist
    this.staticObstacles?.clear(true, true);
    this.dynamicObstacles?.clear(true, true);
    this.snowflakeEmitter?.manager.emitters.remove(this.snowflakeEmitter);
    this.snowflakeEmitter?.manager.destroy();
    this.snowflakeEmitter = undefined;

    this.player?.destruct();
    this.registry.get('scoreText')?.destroy();
  }

  public createGameElements = () => {
    if (!this.spawner) {
      this.spawner = new Spawner(this);
    }
    this.player = new Player(this, 100, (this.canvas.height - this.getSkyHeight()) / 2 + this.getSkyHeight(), SKIER);

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

    this.createSnowflakes();

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
    this.anims.resumeAll();
  };

  private createSoundButton = () => {
    if (this.soundButton) return;

    const createMuteButton = () => {
      return this.add.image(this.canvas.width - 60, 20, 'unmuted').setInteractive({ cursor: "pointer" })
        .on('pointerup', () => {
          this.sound.play("click");
          this.sound.mute = true;
          this.soundButton?.destroy();
          this.soundButton = createUnmuteButton();
        }).setDepth(2);
    }

    const createUnmuteButton = () => {
      return this.add.image(this.canvas.width - 60, 20, 'muted').setInteractive({ cursor: "pointer" })
        .on('pointerup', () => {
          this.sound.play("click");
          this.sound.mute = false;
          this.soundButton?.destroy();
          this.soundButton = createMuteButton();
        }).setDepth(2);
    }

    return this.sound.mute ? createUnmuteButton() : createMuteButton();
  }

  private onStart = () => {
    if (this.gameState != GameStates.Instructions) return;
    this.sound.play("click");
    this.initGame(GameStates.PlayGame);
    this.instructions?.destroy();
    this.instructions = undefined;
    this.start?.destroy();
    this.start = undefined;
  }

  private createStartMenu = () => {
    if (this.start) return;

    this.instructions = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 3 + 20, 'instructions')
    this.start = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 30, 'start').setInteractive({ cursor: "pointer" })
      .on('pointerover', () => { this.start?.setTexture('startHover') })
      .on('pointerout', () => { this.start?.setTexture('start') })
      .on('pointerup', this.onStart);
    this.input.keyboard.addKey("SPACE")
      .on('down', () => { this.start?.setTexture('startHover') })
      .on('up', this.onStart);

    this.input.keyboard.addKey("ENTER")
      .on('down', () => { this.start?.setTexture('startHover') })
      .on('up', this.onStart);

    this.start?.setDepth(1);
    this.instructions?.setDepth(1);
  }

  private onTryAgain = () => {
    if (this.gameState != GameStates.GameOver) return;
    this.sound.play("click");
    this.gameOver?.destroy();
    this.gameOver = undefined;
    this.tryAgain?.destroy();
    this.tryAgain = undefined;
    this.initGame(GameStates.PlayGame);
  }

  private updateScale() {
    this.scale.refresh();
    this.bg_mtnnear && (this.bg_mtnnear.width = this.canvas.width);
    this.bg_mtnfar && (this.bg_mtnfar.width = this.canvas.width);
    this.bg_snow && (this.bg_snow.width = this.canvas.width);
    this.bg_sky && (this.bg_sky.width = this.canvas.width);

    this.tryAgain && (this.tryAgain.x = this.canvas.width / 2);
    this.gameOver && (this.gameOver.x = this.canvas.width / 2);
    this.gamePaused && (this.gamePaused.x = this.canvas.width / 2);
    this.start && (this.start.x = this.canvas.width / 2);
    this.instructions && (this.instructions.x = this.canvas.width / 2);
    this.soundButton && (this.soundButton.x = this.canvas.width - 60);
  }

  private createGameOver = () => {
    if (this.gameOver) return;
    this.gameOver = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2, 'gameOver');
    this.tryAgain = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 35, 'tryAgain').setInteractive({ cursor: "pointer" })
      .on('pointerover', () => { this.tryAgain?.setTexture('tryAgainHover') })
      .on('pointerout', () => { this.tryAgain?.setTexture('tryAgain') })
      .on('pointerup', this.onTryAgain);

    this.input.keyboard.addKey("SPACE")
      .on('down', () => { this.tryAgain?.setTexture('tryAgainHover') })
      .on('up', this.onTryAgain);

    this.input.keyboard.addKey("ENTER")
      .on('down', () => { this.tryAgain?.setTexture('tryAgainHover') })
      .on('up', this.onTryAgain);

    this.gameOver?.setDepth(1);
    this.tryAgain?.setDepth(2);
  }

  preload() {
    this.scale.refresh();
    this.canvas = this.game.canvas;
    this.load.image('muted', 'assets/sound-off.png');
    this.load.image('unmuted', 'assets/sound-on.png');
    this.load.image('tryAgain', 'assets/try-again.png');
    this.load.image('tryAgainHover', 'assets/try-again-hover.png');
    this.load.image('gameOver', 'assets/game-over.png');
    this.load.image('start', 'assets/start.png');
    this.load.image('startHover', 'assets/start-hover.png');
    this.load.image('instructions', 'assets/instructions.png');
    this.load.image('bg_mtnnear', 'assets/bg_mtnnear.png');
    this.load.image('bg_mtnfar', 'assets/bg_mtnfar.png');
    this.load.image('bg_sky', 'assets/bg_sky.png');
    this.load.image('bg_snow', 'assets/bg_snow.png');
    this.load.image(PAUSED, 'assets/paused.png');
    this.load.image(HOUSE, 'assets/house.png');
    this.load.image(SNOWMAN, 'assets/snowman.png');
    this.load.image(PORTAL, 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.image(SKI_TRAIL, 'assets/trail.png');
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
    this.load.spritesheet(SNOWFLAKES, 'http://labs.phaser.io/assets/sprites/snowflakes.png', { frameWidth: 17, frameHeight: 17 });
    this.load.spritesheet(DINOSAUR, 'assets/dinosaur.png', { frameWidth: 100, frameHeight: 100 });
    this.load.spritesheet(SKIER, 'assets/skier.png', { frameWidth: Player.WIDTH, frameHeight: Player.HEIGHT });
    this.load.spritesheet(WOLF, 'assets/running_wolf_sprite.png', { frameWidth: 563, frameHeight: 265 });
    this.load.spritesheet(BEAR, 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
    this.load.audio("wind", "assets/blizzard.wav");
    this.load.audio("click", "assets/click.wav");
    this.load.audio("ouch", "assets/ouch.m4a");
    this.load.audio("ski", "assets/ski.m4a");
  }

  create() {
    this.sound.mute = false;
    this.soundButton = this.createSoundButton();

    const wind_sound = this.sound.add("wind", { loop: true, volume: 0.5 });

    const ENABLE_SKI_SOUND = false;
    ENABLE_SKI_SOUND && (this.skiSound = this.sound.add("ski", { loop: true, volume: 1 }));
    wind_sound.play();

    this.bg_sky = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_sky")
      .setOrigin(0)
    this.bg_mtnfar = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtnfar")
      .setOrigin(0)
    this.bg_mtnnear = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtnnear")
      .setOrigin(0)
    this.bg_snow = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_snow")
      .setOrigin(0)

    this.createAnimations();
    this.createSnowflakes();
    this.gameState = GameStates.Instructions;

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  private createSnowflakes = () => {
    if (this.snowflakeEmitter) {
      return;
    }

    const topOfCanvas = new Phaser.Geom.Line(0, 0, this.canvas.width * 2, 0);
    this.snowflakeEmitter = this.add.particles(SNOWFLAKES).setDepth(.5).createEmitter({
      name: 'snowflakeEmitter',
      gravityY: 10,
      //@ts-ignore
      emitZone: { type: 'random', source: topOfCanvas },
      lifespan: 10000,
    }).setScale(0.5);
  }

  public dt = 0;
  private updateTime = () => {
    const currTime = new Date();
    if (this.lastUpdate) {
      this.dt = currTime.getTime() - this.lastUpdate.getTime();
    }
    this.lastUpdate = currTime;
  }

  private moveBackground = () => {
    const translate = (velocity: number) => {
      const fps = 1000 / this.dt;
      return velocity / fps;
    }

    this.bg_snow && (this.bg_snow.tilePositionX -= translate(this.gameVelocity));
    this.bg_mtnnear && (this.bg_mtnnear.tilePositionX -= translate(0.9 * this.gameVelocity));
    this.bg_mtnfar && (this.bg_mtnfar.tilePositionX -= translate(0.7 * this.gameVelocity));
    this.bg_sky && (this.bg_sky.tilePositionX -= translate(0.5 * this.gameVelocity));
  }

  private emitSnowflakes = () => {
    const { snowflakeEmitter } = this;
    if (snowflakeEmitter) {
      snowflakeEmitter.setFrame(Math.floor(6 * Math.random()));
      snowflakeEmitter.setSpeedX(this.gameVelocity);
      if (this.gameState == GameStates.GameOver || this.gameState == GameStates.GamePaused) {
        snowflakeEmitter.pause();
      } else {
        snowflakeEmitter.resume();
      }
    }
  }

  update() {
    this.updateTime();
    this.updateScale();
    this.emitSnowflakes();
    switch (this.gameState) {
      case GameStates.Instructions:
        this.moveBackground();
        this.createStartMenu();
        break;
      case GameStates.PlayGame:
        if (this.skiSound && !this.skiSound.isPlaying) {
          this.skiSound?.play();
        }
        this.gamePaused?.destroy();
        this.gamePaused = undefined;
        this.physics.resume();
        this.anims.resumeAll();

        this.input.keyboard.addKey("SPACE")
          .on('up', () => this.gameState = GameStates.GamePaused);

        this.moveBackground();
        this.ticks++;
        this.gameVelocity -= 0.05;
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
      case GameStates.GamePaused:
        this.physics.pause();
        this.anims.pauseAll();
        this.player?.skiTrailEmitter.pause();
        this.input.keyboard.addKey("SPACE")
          .on('up', () => this.gameState = GameStates.PlayGame);
        if(this.gamePaused == null) {
          this.gamePaused = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2, PAUSED).setDepth(1);
        }
        break;
      case GameStates.GameOver:
        this.skiSound?.stop();
        this.createGameOver();
        break;
    }
  }
}
