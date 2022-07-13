import Phaser from 'phaser'
import SkiFreeScene, { SKI_TRAIL } from './scenes/Game';

export default class Player extends Phaser.Physics.Arcade.Sprite {

	public static WIDTH = 74;
	public static HEIGHT = 68;
	public static VELOCITY = 160;

	// todo: probably combine DISPLAY_HEIGHT and HEIGHT after bounding box work is done?
	public static DISPLAY_HEIGHT = 50;

	private gameScene: SkiFreeScene;
	private skiTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture);
		this.gameScene = scene;
		this.skiTrailEmitter = this.gameScene.add.particles(SKI_TRAIL).createEmitter({
			name: 'skiTrailEmitter',
			gravityX: -1000,
		}).setScaleY(0.07).setScaleX(0.1);
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.setSize(70, 10).setOffset(5, 55);
		this.displayHeight = Player.DISPLAY_HEIGHT;
		this.scaleX = this.scaleY;
		this.setCollideWorldBounds(true);
	}

	update() {
		if (!this.gameScene.gameOver) {
			this.anims.play(this.texture, true);
			this.skiTrailEmitter.setPosition(this.x, this.y + 30);
			if (this.gameScene.cursors?.up.isDown) {
				// sky bounds
				if (this.y < this.gameScene.getSkyHeight()) {
					this.setVelocityY(0)
				} else {
					this.setVelocityY(-Player.VELOCITY);
					// this.angle = -30;
					this.setOffset(10, 35);
				}
			}
			else if (this.gameScene.cursors?.down.isDown) {
				this.setVelocityY(Player.VELOCITY);
				// this.angle = 30;
				this.setOffset(-12, 65);
			}
			else {
				this.setVelocityY(0);
				this.angle = 0;
				this.setOffset(5, 55);
			}
			this.displayHeight = this.gameScene.getSizeWithPerspective(this.y, Player.DISPLAY_HEIGHT)
			this.scaleX = this.scaleY;
		}
	}
}