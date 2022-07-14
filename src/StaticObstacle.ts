import Phaser from 'phaser'
import SkiFreeScene from './scenes/Game'
import { BIG_ROCK, DINOSAUR, LITTLE_ROCK, TREE } from './Spawner';

export default class StaticObstacle extends Phaser.Physics.Arcade.Sprite
{
	private gameScene: SkiFreeScene;
	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.gameScene = scene;

        this.displayHeight = this.gameScene.getSizeWithPerspective(this.y, this.height)
        this.scaleX = this.scaleY;

		switch (texture) {
			case DINOSAUR:
				this.anims.play(DINOSAUR, true);
				this.displayHeight = this.gameScene.getSizeWithPerspective(this.y, this.height * 0.8)
				this.scaleX = this.scaleY;
				this.setSize(this.width * 0.3, this.height * 0.75);
				break;
			case LITTLE_ROCK:
				this.setSize(this.width * 0.75, this.height * 0.6);
				break;
			case BIG_ROCK:
				this.setSize(this.width * 0.8, this.height * 0.8);
				break;
			case TREE:
				this.displayHeight =  this.displayHeight - Math.random() * 20;
				this.scaleX = this.scaleY;

				this.setSize(this.width * 0.7, this.height * 0.7)
				this.setOffset(this.width * 0.2, this.height * 0.2)
				break;
			default:
				console.error(`Static Obstacle ${this} not actually a static obstacle`);
				break;
		}

	}

	update() {
		this.setVelocityX(this.gameScene.gameVelocity);
	}
}