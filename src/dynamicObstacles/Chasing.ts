/*!
 * (c) Copyright 2022 Palantir Technologies Inc. All rights reserved.
 */
import * as Phaser from "phaser";
import type { SkiFreeScene } from "../scenes/Game";
import { WOLF } from "../utils/utils";
export class Chasing extends Phaser.Physics.Arcade.Sprite {
    private gameScene: SkiFreeScene;
    private setDepthFunction: (y: number) => number;

    constructor(scene: SkiFreeScene, x: number, y: number, setDepthFunction: (y: number) => number, texture: string) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.play(texture);
        this.gameScene = scene;
        this.setDepthFunction = setDepthFunction;

        switch (texture) {
            case WOLF:
                this.displayHeight = 32;
                this.scaleX = this.scaleY;
                this.setSize(this.width * 0.8, this.height * 0.4);
                break;
            default:
                console.error(`Chaser ${this} was not actually a chaser lmfao`);
        }
    }

    private chase() {
        this.setVelocityX(this.gameScene.gameVelocity - 200);
    }

    public update() {
        this.chase();
        this.setDepthFunction(this.y + this.height / 2);
    }
}
