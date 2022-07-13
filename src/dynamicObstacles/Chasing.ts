import Phaser from 'phaser'
import SkiFreeScene, { GAME_VELOCITY } from '../scenes/Game'

export default class Chasing extends Phaser.Physics.Arcade.Sprite
{
	private gameScene: SkiFreeScene;
	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture)
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.gameScene = scene;
	}

    private chase() {
        this.setVelocityX(this.gameScene.gameVelocity * 4);
    }

	update() {
		this.chase()
	}
}