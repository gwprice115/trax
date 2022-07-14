import Phaser from 'phaser'
import SkiFreeScene from './scenes/Game'
import { DINOSAUR } from './Spawner';

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
        
        if (texture === DINOSAUR) {
            this.anims.play(DINOSAUR, true)
        }
	}

	update() {
		this.setVelocityX(this.gameScene.gameVelocity);
	}
}