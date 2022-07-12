import Phaser from 'phaser';
import { getNoiseFunction } from '../utils/utils';


export default class Demo extends Phaser.Scene {
  private CANVAS?: HTMLCanvasElement;
  private PLAYER_WIDTH: number;
  private PLAYER_HEIGHT: number;
  private PLAYER_VELOCITY: number;
  private ticks: number;

  constructor() {
    super('GameScene');
    this.PLAYER_WIDTH = 32;
    this.PLAYER_HEIGHT = 48;
    this.PLAYER_VELOCITY = 160;
    this.ticks = 0;
  }

  private score = 0;
  private costume = 'dude';

  private hitBear = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, bear: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.physics.pause();

    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);

    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).anims.play('turn');
  }

  private collectStar = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, star: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    (star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).destroy();
    this.score += 10;
    this.registry.get('scoreText').setText('Score: ' + this.score);
    var y = (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).y;
    const bears: Phaser.Physics.Arcade.Group = this.registry.get('bears');
    bears.create(800, y, 'bear', 0).body.setSize(32, 48);
  }

  private changeCostume = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, portal: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    (portal as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).disableBody(true, true);
    switch (this.costume) {
      case 'dude':
        this.costume = 'recolored';
    }
  }

  preload() {
    this.CANVAS = this.game.canvas;
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/sky4.png');
    this.load.image('ground', 'http://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('star', 'http://labs.phaser.io/assets/demoscene/star.png');
    this.load.image('portal', 'http://labs.phaser.io/assets/sprites/mushroom.png')
    this.load.spritesheet('bear', 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet('recolored', 'assets/dude_recolored.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('dude',
      'http://labs.phaser.io/assets/sprites/dude.png',
      { frameWidth: this.PLAYER_WIDTH, frameHeight: this.PLAYER_HEIGHT }
    );
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

    // define animations for bear
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

    // load stars and set collider
    const stars = this.physics.add.group({
      key: 'star',
      repeat: 110,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    stars.children.iterate(function (child) {
      const typedChild = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      typedChild.setY(Phaser.Math.FloatBetween(0, 500));
    });

    this.physics.add.overlap(player, stars, this.collectStar, undefined, this);
    this.registry.set('stars', stars);

    // load bear and set collider
    const bears = this.physics.add.group();
    this.registry.set('bears', bears);
    this.physics.add.collider(player, bears, this.hitBear, undefined, this);

    // load portals and set collider
    const portals = this.physics.add.group({
      key: 'portal',
      repeat: 500,
      setXY: { x: 12, y: 400, stepX: 700 }
    });

    portals.children.iterate(function (child) {
      const typedChild = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
      typedChild.setY(Phaser.Math.FloatBetween(0, 500));
    });

    this.physics.add.overlap(player, portals, this.changeCostume, undefined, this);

    // load score text
    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });
    this.registry.set('scoreText', scoreText);

    this.registry.set('staticObstacles', [bears, stars, portals]);
  }
  update() {
    this.ticks++;
    const cursors = this.registry.get('cursors');
    const player = this.registry.get('player');
    const curveSetter = this.registry.get('curveSetter');
    const curveSetterNoise = this.registry.get('curveSetterNoise');
    const bears: Phaser.Physics.Arcade.Group = this.registry.get('bears');
    bears.children.iterate(bear => (bear as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).anims.play('bear', true));

    // update dude position and animations
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
    const staticObstacles: Phaser.Physics.Arcade.Group[] = this.registry.get('staticObstacles');
    staticObstacles.forEach((childGroup) => {
      childGroup.children.entries.forEach((child) => {
        const typedChild = (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody);
        if (typedChild.body.right <= 0) {
          childGroup.remove(typedChild, true, true);
        } else {
          typedChild.setVelocityX(-100);
        }
      });
    });


  }
}
