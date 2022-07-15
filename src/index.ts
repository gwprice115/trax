import Phaser from 'phaser';
import { config } from './config';
import GameScene from './scenes/Game';
import Highscore from './scenes/Highscore';

new Phaser.Game(
  Object.assign(config, {
    scene: [GameScene, Highscore]
  })
);


