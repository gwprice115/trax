import Phaser from 'phaser'
import SkiFreeScene from '../scenes/Game';

export default class Falling extends Phaser.Physics.Arcade.Sprite
{
    private gameScene: SkiFreeScene;
	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
        this.gameScene = scene;
    }

    private fall() {
        this.setVelocityX(this.gameScene.gameVelocity * 3);
        this.setVelocityY(Math.random() * 200 + 50)
    }

	update() {
		this.fall()
	}
}