import Phaser from 'phaser'
import SkiFreeScene, { SKI_TRAIL } from './scenes/Game';

export default class Player extends Phaser.Physics.Arcade.Sprite {

	public static WIDTH = 74;
	public static HEIGHT = 68;
	public static VELOCITY = 160;

	public static DISPLAY_HEIGHT = 50;

	private gameScene: SkiFreeScene;
	private skiTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture);
		this.gameScene = scene;
		this.skiTrailEmitter = this.gameScene.add.particles(SKI_TRAIL).createEmitter({
			name: 'skiTrailEmitter',
			gravityX: -500,
		});
		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.setSize(this.width * 0.3, this.height * 0.7)
		this.setOffset(this.width / 3, this.height * 0.2)
		this.displayHeight = Player.DISPLAY_HEIGHT;
		this.scaleX = this.scaleY;

		this.setCollideWorldBounds(true);
		this.setOrigin(0,1);
	}

	update() {
		if (!this.gameScene.gameOver) {
			this.anims.play(this.texture, true);
			this.skiTrailEmitter.setPosition(this.x+6, this.y-3);
			if (this.gameScene.cursors?.up.isDown) {
				// sky bounds
				if (this.y < this.gameScene.getSkyHeight()) {
					this.setVelocityY(0)
				} else {
					this.setVelocityY(-Player.VELOCITY);
					this.angle = -15;
				}
			}
			else if (this.gameScene.cursors?.down.isDown) {
				this.setVelocityY(Player.VELOCITY);
				this.angle = 15;
			}
			else {
				this.setVelocityY(0);
				this.angle = 0;
			}
			this.displayHeight = this.gameScene.getSizeWithPerspective(this.y, Player.DISPLAY_HEIGHT)
			const scaleFactor = this.scaleY;
			this.scaleX = scaleFactor;
			this.skiTrailEmitter.setScaleX(scaleFactor * 0.1).setScaleY(scaleFactor * 0.07);
		}
	}
}