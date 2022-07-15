import Phaser from 'phaser'
import SkiFreeScene from './scenes/Game'
import { BIG_ROCK, DINOSAUR, HOUSE, LITTLE_ROCK, STICK, STONE, STONE2, TREE, TREE_EMPTY_1, TREE_EMPTY_2, TREE_SNOWY_1, TREE_SNOWY_2, TREE_TRUNK } from './Spawner';

export default class StaticObstacle extends Phaser.Physics.Arcade.Sprite {
	private gameScene: SkiFreeScene;

	constructor(scene: SkiFreeScene, x: number, y: number, setDepthFunction: (y: number) => number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.gameScene = scene;

		this.displayHeight = this.gameScene.getSizeWithPerspective(this.y, this.height) - Math.random() * 0.3 * this.height // random small variations in size
		this.scaleX = this.scaleY;
		this.depth = setDepthFunction(this.y + this.height / 2);

		switch (texture) {
			case TREE:
			case TREE_SNOWY_1:
			case TREE_SNOWY_2:
				this.setSize(this.width * 0.3, this.height * 0.6)
				this.setOffset(this.width * 0.3, this.height * 0.4)
				break;
			case TREE_TRUNK:
			case TREE_EMPTY_1:
			case TREE_EMPTY_2:
				this.setSize(this.width * 0.3, this.height * 0.6)
				this.setOffset(this.width * 0.4, this.height * 0.4)
				break;
			case LITTLE_ROCK:
			case BIG_ROCK:
				this.setSize(this.width * 0.5, this.height * 0.5);
				break;
			case STONE:
			case STONE2:
				this.setSize(this.width * 0.6, this.height * 0.6);
				break;
			case STICK:
				this.setSize(this.width * 0.9, this.height * 0.2);
				break;
			case HOUSE:
				this.setSize(this.width * 0.8, this.height * 0.6);
				break;
			case DINOSAUR:
				this.anims.play(DINOSAUR, true);
				this.setSize(this.width * 0.3, this.height * 0.75);
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