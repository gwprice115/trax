import Phaser from 'phaser'
import SkiFreeScene from '../scenes/Game';

export default class Tracking extends Phaser.Physics.Arcade.Sprite
{
	private player: Phaser.Types.Physics.Arcade.GameObjectWithBody;
	private gameScene: SkiFreeScene;

	constructor(scene: SkiFreeScene, x: number, y: number, texture: string, player: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
		super(scene, x, y, texture)
		this.player = player;
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.play(texture);
		this.gameScene = scene;

		this.displayHeight = this.height * 0.8;
		this.scaleX = this.scaleY;
		this.setSize(this.width * 0.1, this.height * 0.15);
	}

	private trackPlayer() {
		const playerX = this.player.body.x
		const playerY = this.player.body.y

		const rotationAngle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y)
		this.setRotation(rotationAngle);
		this.setVelocityX(this.gameScene.gameVelocity - 100)

		// slow down Y velocity when bear gets close to player to make bear less deadly
		if (this.x > playerX + 300) {
			this.setVelocityY(Math.sin(rotationAngle) * this.gameScene.gameVelocity * 2)
		} else {
			this.setVelocityY(Math.sin(rotationAngle) * this.gameScene.gameVelocity * 0.5)
		}
	}

	update() {
		this.trackPlayer()
	}
}