/*!
 * (c) Copyright 2022 Palantir Technologies Inc. All rights reserved.
 */
import * as Phaser from "phaser";
import type { SkiFreeScene } from "../scenes/Game";

export class Tracking extends Phaser.Physics.Arcade.Sprite {
    private player: Phaser.Types.Physics.Arcade.GameObjectWithBody;
    private gameScene: SkiFreeScene;
    private setDepthFunction: (y: number) => number;

    constructor(
        scene: SkiFreeScene,
        x: number,
        y: number,
        setDepthFunction: (y: number) => number,
        texture: string,
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ) {
        super(scene, x, y, texture);
        this.player = player;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.play(texture);
        this.gameScene = scene;
        this.setDepthFunction = setDepthFunction;

        this.displayHeight = this.height * 0.8;
        this.scaleX = this.scaleY;
        this.setSize(this.width * 0.1, this.height * 0.15);
    }

    private trackPlayer() {
        const playerX = this.player.body.x;
        const playerY = this.player.body.y;

        const rotationAngle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
        this.setRotation(rotationAngle);
        this.setVelocityX(this.gameScene.gameVelocity - 200);

        // slow down Y velocity when bear gets close to player to make bear less deadly
        if (this.x > playerX + 300) {
            this.setVelocityY(Math.sin(rotationAngle) * this.gameScene.gameVelocity * 1);
        } else {
            this.setVelocityY(Math.sin(rotationAngle) * this.gameScene.gameVelocity * 0.5);
        }
    }

    public update() {
        this.trackPlayer();
        this.setDepthFunction(this.y + this.height / 2);
    }
}
