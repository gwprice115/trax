import Phaser from 'phaser'
import SkiFreeScene, { SKI_TRAIL, GameStates } from './scenes/Game';

export default class Player extends Phaser.Physics.Arcade.Sprite {

	public static WIDTH = 74;
	public static HEIGHT = 68;
	public static VELOCITY = 160;

	public static DISPLAY_HEIGHT = 50;

	private gameScene: SkiFreeScene;
	public skiTrailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

	constructor(scene: SkiFreeScene, x: number, y: number, texture: string) {
		super(scene, x, y, texture);
		this.gameScene = scene;
		this.skiTrailEmitter = this.gameScene.add.particles(SKI_TRAIL).createEmitter({
			name: 'skiTrailEmitter',
			speedX: this.gameScene.gameVelocity,
		});
		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.setSize(this.width * 0.3, this.height * 0.5)
		this.setOffset(this.width / 3, this.height * 0.4)
		this.displayHeight = Player.DISPLAY_HEIGHT;
		this.scaleX = this.scaleY;

		this.setCollideWorldBounds(true);
		this.setOrigin(0, 1);
	}

	update() {
		if (this.gameScene.gameState === GameStates.PlayGame) {
			this.anims.play(this.texture, true);
			this.skiTrailEmitter.setPosition(this.x + 6, this.y - 3);
			if (this.gameScene.cursors?.up.isDown) {
				// sky bounds
				if (this.y < this.gameScene.getSkyHeight() + this.displayHeight / 2) {
					this.setVelocityY(0)
				} else {
					this.setVelocityY(-Player.VELOCITY);
					this.angle = -15;
					this.setOffset(this.width * 0.3, this.height * 0.2)
				}
			}
			else if (this.gameScene.cursors?.down.isDown) {
				this.setVelocityY(Player.VELOCITY);
				this.angle = 15;
				this.setOffset(this.width * 0.5, this.height * 0.6)
			}
			else {
				this.setVelocityY(0);
				this.angle = 0;
				this.setOffset(this.width * 0.4, this.height * 0.4)
			}
			this.displayHeight = this.gameScene.getSizeWithPerspective(this.y, Player.DISPLAY_HEIGHT)
			const scaleFactor = this.scaleY;
			this.scaleX = scaleFactor;
			this.skiTrailEmitter.resume();
			this.skiTrailEmitter.setSpeedX(this.gameScene.gameVelocity);
			this.skiTrailEmitter.setScaleX(scaleFactor * 0.1).setScaleY(scaleFactor * 0.07);
		}
	}

	public destruct() {
		this.skiTrailEmitter?.manager.emitters.remove(this.skiTrailEmitter);
		this.skiTrailEmitter?.manager.destroy();
		this.destroy();
	}
}