import Phaser from 'phaser'
import { GAME_VELOCITY } from '../scenes/Game'

export default class Tracking extends Phaser.Physics.Arcade.Sprite
{
	private player: Phaser.Types.Physics.Arcade.GameObjectWithBody;

	constructor(scene: Phaser.Scene, x: number, y: number, texture: string, player: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
		super(scene, x, y, texture)
		this.player = player;
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.play(texture);
	}

	trackPlayer() {
		const playerX = this.player.body.x
		const playerY = this.player.body.y

		const rotationAngle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y)
		this.setRotation(rotationAngle);
		this.setVelocityX(GAME_VELOCITY * 2)

		// slow down Y velocity when bear gets close to player to make bear less deadly
		if (this.x > playerX + 300) {
			this.setVelocityY(Math.sin(rotationAngle) * GAME_VELOCITY * 2)
		} else {
			this.setVelocityY(Math.sin(rotationAngle) * GAME_VELOCITY * 0.5)
		}
	}

	update() {
		this.trackPlayer()
	}
}