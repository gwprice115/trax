import Phaser from 'phaser';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../config';


const PLAYER_WIDTH = 74;
const PLAYER_HEIGHT = 68;
const PLAYER_VELOCITY = 160;

const BACKGROUND = 'background';


export default class Demo extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  preload() {
    this.load.image(BACKGROUND, 'assets/portal.png');
  }


  create() {
    this.add.image(400, 300, BACKGROUND);
  }

  update() {
  }
}
