import Phaser from 'phaser'
import Demo from './scenes/Game';

export default class Player extends Phaser.Physics.Arcade.Sprite {

	public static WIDTH = 74;
	public static HEIGHT = 68;
	public static VELOCITY = 160;

	private gameScene: Demo;
	constructor(scene: Demo, x: number, y: number, texture: string) {
		super(scene, x, y, texture);
		this.gameScene = scene;
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.setSize(70, 10).setOffset(5, 55);
		this.setCollideWorldBounds(true);
	}

	update() {
		if (!this.gameScene.gameOver) {
			this.anims.play(this.texture, true);
			if (this.gameScene.cursors?.up.isDown) {
				// sky bounds
				if (this.y < this.gameScene.getSkyHeight()) {
					this.setVelocityY(0)
				} else {
					this.setVelocityY(-Player.VELOCITY);
					this.angle = -30;
					this.setOffset(10, 35);
				}
			}
			else if (this.gameScene.cursors?.down.isDown) {
				this.setVelocityY(Player.VELOCITY);
				this.angle = 30;
				this.setOffset(-12, 65);
			}
			else {
				this.setVelocityY(0);
				this.angle = 0;
				this.setOffset(5, 55);
			}
		}
	}
}