import Phaser from 'phaser';
import { config } from './config';
import GameScene from './scenes/Game';
import GameOverScene from './scenes/GameOver';

new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene, GameOverScene]
  })
);


