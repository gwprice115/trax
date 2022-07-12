import Phaser from 'phaser';
import { SCREEN_WIDTH } from '../config';
import Tracking from '../dynamicObstacles/Tracking';
import Chasing from '../dynamicObstacles/Chasing';
import Falling from '../dynamicObstacles/Falling';

export const GAME_VELOCITY = -100;

export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  private bears?: Phaser.Physics.Arcade.Group;
  private stars?: Phaser.Physics.Arcade.Group;

  private score = 0;

  private hitBear = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, bear: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.physics.pause();

    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);

    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).anims.play('turn');
  }


  private collectStar = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, star: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    (star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).disableBody(true, true);
    this.score += 10;
    this.registry.get('scoreText').setText('Score: ' + this.score);

    // TODO when we get path coordinates: const pathY = map.getY((SCREEN_WIDTH - player.body.x) / 4);

    var y = (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).y;
    this.bears?.get(800, y, "bear", player).body.setSize(32, 48);
  }

  preload() {
    this.load.image('sky', 'http://labs.phaser.io/assets/skies/sky4.png');
    this.load.image('ground', 'http://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('star', 'http://labs.phaser.io/assets/demoscene/star.png');
    this.load.spritesheet('bear', 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });
    this.load.spritesheet('dude',
      'http://labs.phaser.io/assets/sprites/dude.png',
      { frameWidth: 32, frameHeight: 48 }
    );
  }


  create() {
    this.add.image(400, 300, 'sky');
    const player = this.physics.add.sprite(100, 450, 'dude');

    player.setCollideWorldBounds(true);
    this.registry.set('player', player);

    this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'turn',
      frames: [{ key: 'dude', frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'bear',
      frames: this.anims.generateFrameNumbers('bear', { start: 30, end: 48 }),
      frameRate: 15,
      repeat: -1,
    })

    this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    const cursors = this.input.keyboard.createCursorKeys();
    this.registry.set('cursors', cursors);

    this.bears = this.physics.add.group({
			classType: Tracking,
			runChildUpdate: true
		})
    this.physics.add.collider(player, this.bears, this.hitBear, undefined, this);

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

    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });
    this.registry.set('scoreText', scoreText);
  }

  update() {
    const cursors = this.registry.get('cursors');
    const player = this.registry.get('player');

    if (cursors.up.isDown) {
      player.setVelocityY(-160);
      player.anims.play('left', true);
    }
    else if (cursors.down.isDown) {
      player.setVelocityY(160);
      player.anims.play('right', true);
    }
    else {
      player.setVelocityY(0);
      player.anims.play('turn');
    }
  }
}

