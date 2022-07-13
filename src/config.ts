import Phaser from 'phaser';

export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;

export const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#33A5E7',

  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scale: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }

};
