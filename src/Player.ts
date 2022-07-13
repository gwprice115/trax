import Phaser from 'phaser'
import Demo, { SKI_TRAIL } from './scenes/Game';

export default class Player extends Phaser.Physics.Arcade.Sprite {

	public static WIDTH = 74;
	public static HEIGHT = 68;
	public static VELOCITY = 160;

	private gameScene: Demo;
	private skiTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
	constructor(scene: Demo, x: number, y: number, texture: string) {
		super(scene, x, y, texture);
		this.gameScene = scene;
		this.skiTrailEmitter = this.gameScene.add.particles(SKI_TRAIL).createEmitter({
			name: 'skiTrailEmitter',
			gravityX: -1000,
			blendMode: 'ADD',
		}).setScaleY(0.07).setScaleX(0.1);
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.setSize(70, 10).setOffset(5, 55);
		this.setCollideWorldBounds(true);
	}

	update() {
		if (!this.gameScene.gameOver) {
			this.anims.play(this.texture, true);
			if (this.gameScene.cursors?.up.isDown) {
				this.setVelocityY(-Player.VELOCITY);
				this.angle = -30;
				this.setOffset(10, 35);
				this.skiTrailEmitter.setPosition(this.x - 10, this.y + 30);
			}
			else if (this.gameScene.cursors?.down.isDown) {
				this.setVelocityY(Player.VELOCITY);
				this.angle = 30;
				this.setOffset(-12, 65);
				this.skiTrailEmitter.setPosition(this.x - 40, this.y + 16);
			}
			else {
				this.setVelocityY(0);
				this.angle = 0;
				this.setOffset(5, 55);
				this.skiTrailEmitter.setPosition(this.x - 30, this.y + 30);
			}
		}
	}
}