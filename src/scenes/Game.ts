import Phaser from 'phaser';



export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  private score = 0;

  private hitBomb = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, bomb: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    this.physics.pause();

    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);

    (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).anims.play('turn');
  }


  private collectStar = (player: Phaser.Types.Physics.Arcade.GameObjectWithBody, star: Phaser.Types.Physics.Arcade.GameObjectWithBody) => {
    (star as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).disableBody(true, true);
    this.score += 10;
    this.registry.get('scoreText').setText('Score: ' + this.score);
    var y = (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).y;
    this.registry.get('bombs').create(800, y, 'bomb');
  }

  preload() {
    this.load.setBaseURL('http://labs.phaser.io');
    this.load.image('sky', 'assets/skies/sky4.png');
    this.load.image('ground', 'assets/sprites/platform.png');
    this.load.image('star', 'assets/demoscene/star.png');
    this.load.image('bomb', 'assets/sprites/apple.png');
    this.load.spritesheet('dude',
      'assets/sprites/dude.png',
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


    const bombs = this.physics.add.group();
    this.registry.set('bombs', bombs);
    this.physics.add.collider(player, bombs, this.hitBomb, undefined, this);

    const scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });
    this.registry.set('scoreText', scoreText);

    this.registry.set('speedables', [bombs, stars]);
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

    const speedables: Phaser.Physics.Arcade.Group[] = this.registry.get('speedables');
    speedables.forEach((childGroup) => {
      childGroup.children.iterate(child =>
        (child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setVelocityX(-100))
    });
  }
}
