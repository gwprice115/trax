import Phaser from 'phaser'
import { SCREEN_WIDTH } from '../config';
import { GAME_VELOCITY } from '../scenes/Game'

export default class Falling extends Phaser.Physics.Arcade.Sprite
{
	constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		// this.play(texture);
	}

    fall() {
        this.setVelocityX(GAME_VELOCITY * 3);
        this.setVelocityY(Math.random() * 200 + 50)
    }

	update() {
		this.fall()
	}
}