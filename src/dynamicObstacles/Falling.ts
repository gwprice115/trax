import Phaser from 'phaser'
import SkiFreeScene from '../scenes/Game';
import { SNOWMAN } from '../Spawner';

export default class Falling extends Phaser.Physics.Arcade.Sprite
{
    private gameScene: SkiFreeScene;
	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
        this.gameScene = scene;

		switch (texture) {
			case SNOWMAN:
				this.setSize(this.width * 0.7, this.height * 0.8);
				break;
			default:
				console.error(`Falling ${this} was not actually falling lmfao`)
		}
    }

    private fall() {
        this.setVelocityX(this.gameScene.gameVelocity * 3);
        this.setVelocityY(Math.random() * 200 + 50)
    }

	update() {
		this.fall()
	}
}