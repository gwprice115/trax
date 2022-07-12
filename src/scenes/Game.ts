import Phaser from 'phaser';



export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

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
    var y = (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).y;
    const bears: Phaser.Physics.Arcade.Group = this.registry.get('bears');
    bears.create(800, y, 'bear', 0).body.setSize(32, 48);
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


    const bears = this.physics.add.group();
    this.registry.set('bears', bears);
    this.physics.add.collider(player, bears, this.hitBear, undefined, this);

    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });
    this.registry.set('scoreText', scoreText);

    this.registry.set('staticObstacles', [bears, stars]);
  }
  update() {
    const cursors = this.registry.get('cursors');
    const player = this.registry.get('player');
    const bears: Phaser.Physics.Arcade.Group = this.registry.get('bears');
    bears.children.iterate(bear => (bear as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).anims.play('bear', true));

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

    const staticObstacles: Phaser.Physics.Arcade.Group[] = this.registry.get('staticObstacles');
    staticObstacles.forEach((childGroup) => {
      childGroup.children.iterate(child =>
        (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setVelocityX(-100))
    });
  }
}
