import Phaser from 'phaser'
import SkiFreeScene from '../scenes/Game'
import { WOLF } from '../Spawner';

export default class Chasing extends Phaser.Physics.Arcade.Sprite
{
	private gameScene: SkiFreeScene;
	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.play(texture);
		this.gameScene = scene;

		switch (texture) {
			case WOLF:
				this.displayHeight = 32
				this.scaleX = this.scaleY;
				this.setSize(this.width * 0.8, this.height * 0.4);
				break;
			default:
				console.error(`Chaser ${this} was not actually a chaser lmfao`)
		}
	}

    private chase() {
        this.setVelocityX(this.gameScene.gameVelocity - 200);
    }

	update() {
		this.chase()
	}
}