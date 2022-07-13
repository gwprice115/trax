import Phaser from 'phaser'
import { GAME_VELOCITY } from '../scenes/Game'

export default class Chasing extends Phaser.Physics.Arcade.Sprite
{
	constructor(scene: Phaser.Scene, x: number, y: number, texture: string, player: Phaser.Types.Physics.Arcade.GameObjectWithBody) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.play(texture);
	}

    private chase() {
        this.setVelocityX(GAME_VELOCITY * 4);
    }

	update() {
		this.chase()
	}
}