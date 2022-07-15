import Phaser from 'phaser'
import SkiFreeScene from '../scenes/Game';
import { SNOWMAN } from '../Spawner';

export default class Falling extends Phaser.Physics.Arcade.Sprite {
	private gameScene: SkiFreeScene;
	private setDepthFunction: (y: number) => number;

	constructor(scene: SkiFreeScene, x: number, y: number, setDepthFunction: (y: number) => number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.gameScene = scene;
		this.setDepthFunction = setDepthFunction;

		switch (texture) {
			case SNOWMAN:
				this.setSize(this.width * 0.7, this.height * 0.8);
				break;
			default:
				console.error(`Falling ${this} was not actually falling lmfao`)
		}
	}

	private fall() {
		this.setVelocityX(this.gameScene.gameVelocity - 200);
		this.setVelocityY(-this.gameScene.gameVelocity + 50)
	}

	update() {
		this.fall();
		this.setDepthFunction(this.y + this.height / 2);
	}
}