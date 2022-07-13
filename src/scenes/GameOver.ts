import Phaser from 'phaser';
import { SCREEN_HEIGHT } from '../config';

export default class Demo extends Phaser.Scene {
  public canvas: { height: number; width: number } = { height: 0, width: 0 };

  private tryAgain = () => {
    console.log('try again')
    this.scene.start("GameScene");
  }

  constructor() {
    super('GameOverScene');
  }

  preload() {
    this.load.image('background', 'assets/background.png');
    this.load.image('gameOver', 'assets/game-over.png');
  }

  create() {
  this.add.tileSprite(0, 0, this.canvas?.width ?? 0, SCREEN_HEIGHT, "background").setOrigin(0);
  let gameOverButton = this.add.image(400, 100, 'gameOver').setInteractive();
  gameOverButton.once('pointerup', this.tryAgain, this);

  }

  update() {
    console.log('game over')
  }
}
