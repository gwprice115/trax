/*!
 * (c) Copyright 2022 Palantir Technologies Inc. All rights reserved.
 */
import * as Phaser from "phaser";

export const SCREEN_HEIGHT = 300;
export const GAME_DOM_ID = "skifree-game";

export const config = {
    type: Phaser.AUTO,
    parent: GAME_DOM_ID,
    backgroundColor: "#33A5E7",

    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    scale: {
        parent: GAME_DOM_ID,
        mode: Phaser.Scale.RESIZE,
    },
};
