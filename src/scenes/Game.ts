/*!
 * (c) Copyright 2022 Palantir Technologies Inc. All rights reserved.
 */
import * as Phaser from "phaser";

import { SCREEN_HEIGHT } from "../config";

import { Player } from "../Player";
import { Spawner } from "../Spawner";
import {
    BEAR,
    BIG_ROCK,
    DINOSAUR,
    HOUSE,
    LITTLE_ROCK,
    PAUSED,
    SKI_TRAIL,
    SKIER,
    SNOWFLAKES,
    SNOWMAN,
    START_GAME_VELOCITY,
    STICK,
    STONE,
    STONE2,
    TREE,
    TREE_EMPTY_1,
    TREE_EMPTY_2,
    TREE_SNOWY_1,
    TREE_SNOWY_2,
    TREE_TRUNK,
    WOLF,
} from "../utils/utils";
import { GameStates } from "./GameStates";

export default class SkiFreeScene extends Phaser.Scene {
    public canvas: { height: number; width: number } = { height: 0, width: 0 };
    public static username: string | undefined = "";
    private ticks: number = 0;
    public gameState: GameStates | undefined;
    public player: Player | undefined;
    private spawner: Spawner | undefined;
    private snowflakeEmitter: Phaser.GameObjects.Particles.ParticleEmitter | undefined;
    public cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    public gameOver: Phaser.GameObjects.Image | undefined;
    public leaderboardBox: Phaser.GameObjects.Image | undefined;
    public gamePaused: Phaser.GameObjects.Image | undefined;
    public tryAgain: Phaser.GameObjects.Image | undefined;
    public instructions: Phaser.GameObjects.Image | undefined;
    public start: Phaser.GameObjects.Image | undefined;
    private lastUpdate?: Date;
    private skiSound?: Phaser.Sound.BaseSound;
    private soundButton: Phaser.GameObjects.Image | undefined;

    public rainbowText: Phaser.GameObjects.BitmapText | undefined;
    public rainbowColor: number = 0;

    public scoreBitmapText: Phaser.GameObjects.BitmapText | undefined;
    public playerText: Phaser.GameObjects.BitmapText | undefined;
    public currentScore: number = 0;
    public leaderboardArr: Array<[string, number]> = [
        ["Karp", 9999],
        ["Karp", 5000],
        ["Karp", 3900],
        ["Karp", 300],
        ["Karp", 200],
    ];
    public curRank: number = -1;
    public leaderboardText: any[] | undefined;
    public leaderboardButton: Phaser.GameObjects.Image | undefined;

    public gameVelocity: number = START_GAME_VELOCITY;

    public BOX_WIDTH = 0;
    public BOX_HEIGHT = 0;
    public TITLE_PADDING = 20;

    constructor() {
        super("GameScene");
    }

    private bg_snow?: Phaser.GameObjects.TileSprite;
    private bg_sky?: Phaser.GameObjects.TileSprite;
    private bg_mtnnear?: Phaser.GameObjects.TileSprite;
    private bg_mtnfar?: Phaser.GameObjects.TileSprite;

    public staticObstacles?: Phaser.Physics.Arcade.Group;
    public dynamicObstacles?: Phaser.Physics.Arcade.Group;

    private hitObstacle = (
        player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    ) => {
        this.sound.play("ouch");
        this.physics.pause();
        this.anims.pauseAll();
        this.gameVelocity = START_GAME_VELOCITY;
        this.player?.skiTrailEmitter.pause();
        this.ticks = 0;
        (player as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
        (obstacle as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).setTint(0xff0000);
        const result = this.ifHighScore();
        if (result === -1) {
            this.gameState = GameStates.GameOver;
        } else {
            this.gameState = GameStates.Leaderboard;
        }
    };

    public getSizeWithPerspective = (yPosition: number, baseSize: number) =>
        (baseSize * 0.3 * yPosition) / this.canvas.height + baseSize * 0.7;

    public getSkyHeight = () => this.canvas.height * 0.3;

    public destroyGame = () => {
        // destroy previous elements, if they exist
        this.staticObstacles?.clear(true, true);
        this.dynamicObstacles?.clear(true, true);
        this.snowflakeEmitter?.manager.emitters.remove(this.snowflakeEmitter);
        this.snowflakeEmitter?.manager.destroy();
        this.snowflakeEmitter = undefined;

        this.player?.destruct();
        this.scoreBitmapText?.destroy();
    };

    public createGameElements = () => {
        if (!this.spawner) {
            this.spawner = new Spawner(this);
        }
        this.player = new Player(
            this,
            100,
            (this.canvas.height - this.getSkyHeight()) / 2 + this.getSkyHeight(),
            SKIER,
        );

        // set up static and dynamic obstacle groups
        this.staticObstacles = this.physics.add.group({
            runChildUpdate: true,
        });
        this.dynamicObstacles = this.physics.add.group({
            runChildUpdate: true,
        });

        // hook up collisions
        if (this.player) {
            this.physics.add.overlap(this.player, this.staticObstacles, this.hitObstacle, undefined, this);
            this.physics.add.overlap(this.player, this.dynamicObstacles, this.hitObstacle, undefined, this);
        }

        this.createSnowflakes();

        // load score text
        this.scoreBitmapText = this.add.bitmapText(16, 16, "arcadeFont", "Score: 0", 20).setTint(0x000000).setDepth(2);
    };

    public createAnimations = () => {
        // define animations for dude
        this.anims.create({
            key: SKIER,
            frames: this.anims.generateFrameNumbers(SKIER, { start: 0, end: 1 }),
            frameRate: 2,
        });

        this.anims.create({
            key: BEAR,
            frames: this.anims.generateFrameNumbers(BEAR, { start: 30, end: 48 }),
            frameRate: 15,
            repeat: -1,
        });

        this.anims.create({
            key: DINOSAUR,
            frames: this.anims.generateFrameNumbers(DINOSAUR, { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1,
        });

        this.anims.create({
            key: WOLF,
            frames: this.anims.generateFrameNumbers(WOLF, { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });
    };

    public initGame = (state: GameStates) => {
        this.ticks = 0;
        this.gameVelocity = START_GAME_VELOCITY;
        this.gameState = state;
        this.destroyGame();
        this.createGameElements();

        this.physics.resume();
        this.anims.resumeAll();
    };

    private createSoundButton = () => {
        if (this.soundButton) {
            return;
        }

        const createMuteButton = () => {
            return this.add
                .image(this.canvas.width - 60, 20, "unmuted")
                .setInteractive({ cursor: "pointer" })
                .on("pointerup", () => {
                    this.sound.play("click");
                    this.sound.mute = true;
                    this.soundButton?.destroy();
                    this.soundButton = createUnmuteButton();
                })
                .setDepth(2);
        };

        const createUnmuteButton = () => {
            return this.add
                .image(this.canvas.width - 60, 20, "muted")
                .setInteractive({ cursor: "pointer" })
                .on("pointerup", () => {
                    this.sound.play("click");
                    this.sound.mute = false;
                    this.soundButton?.destroy();
                    this.soundButton = createMuteButton();
                })
                .setDepth(2);
        };

        return this.sound.mute ? createUnmuteButton() : createMuteButton();
    };

    private displayLeaderboardTitle = () => {
        if (this.curRank !== -1) {
            if (!this.rainbowText) {
                this.rainbowText = this.add
                    .bitmapText(
                        this.canvas.width / 2 - 205,
                        SCREEN_HEIGHT / 2 - this.BOX_HEIGHT / 2 - 5,
                        "arcadeFont",
                        "You got a high score!",
                        20,
                    )
                    .setTint(0xfff);
            }
            this.rainbowColor++;
            if (this.rainbowColor === 360) {
                this.rainbowColor = 0;
            }

            // @ts-ignore
            const top = Phaser.Display.Color.HSVColorWheel()[this.rainbowColor].color;
            // @ts-ignore
            const bottom = Phaser.Display.Color.HSVColorWheel()[359 - this.rainbowColor].color;
            this.rainbowText?.setTint(top, bottom, bottom, top);
        } else {
            if (!this.rainbowText) {
                this.rainbowText = this.add
                    .bitmapText(
                        this.canvas.width / 2 - 100,
                        SCREEN_HEIGHT / 2 - this.BOX_HEIGHT / 2 - 5,
                        "arcadeFont",
                        "Leaderboard",
                        20,
                    )
                    .setTint(0x0);
            }
        }
        if (!this.rainbowText) {
            this.rainbowText = this.add
                .bitmapText(
                    this.canvas.width / 2 - 205,
                    SCREEN_HEIGHT / 2 - this.BOX_HEIGHT / 2 - 5,
                    "arcadeFont",
                    "You got a high score!",
                    20,
                )
                .setTint(0xfff);
        }
        this.rainbowText?.setDepth(300);
    };

    private onStart = () => {
        if (this.gameState !== GameStates.Instructions) {
            return;
        }
        this.sound.play("click");
        this.initGame(GameStates.PlayGame);
        this.instructions?.destroy();
        this.instructions = undefined;
        this.start?.destroy();
        this.start = undefined;
    };

    private createStartMenu = () => {
        if (this.start) {
            return;
        }

        this.instructions = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 3 + 20, "instructions");
        this.start = this.add
            .image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 30, "start")
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.start?.setTexture("startHover");
            })
            .on("pointerout", () => {
                this.start?.setTexture("start");
            })
            .on("pointerup", this.onStart);
        this.input.keyboard
            .addKey("SPACE")
            .on("down", () => {
                this.start?.setTexture("startHover");
            })
            .on("up", this.onStart);

        this.input.keyboard
            .addKey("ENTER")
            .on("down", () => {
                this.start?.setTexture("startHover");
            })
            .on("up", this.onStart);

        this.start?.setDepth(1);
        this.instructions?.setDepth(1);
    };

    private onTryAgain = () => {
        if (this.gameState !== GameStates.GameOver && this.gameState !== GameStates.Leaderboard) {
            return;
        }
        this.sound.play("click");
        this.gameOver?.destroy();
        this.gameOver = undefined;
        this.tryAgain?.destroy();
        this.tryAgain = undefined;
        this.leaderboardButton?.destroy();
        this.leaderboardButton = undefined;
        this.leaderboardBox?.destroy();
        this.leaderboardBox = undefined;
        this.rainbowText?.destroy();
        this.rainbowText = undefined;
        this.leaderboardText?.forEach(e => e.destroy());
        this.leaderboardText = [];
        this.initGame(GameStates.PlayGame);
    };

    private onLeaderboard = () => {
        this.sound?.play("click");
        this.gameOver?.destroy();
        this.gameOver = undefined;
        this.tryAgain?.destroy();
        this.tryAgain = undefined;
        this.leaderboardButton?.destroy();
        this.leaderboardButton = undefined;
        this.gameState = GameStates.Leaderboard;
    };

    private updateScale() {
        this.scale.refresh();
        this.bg_mtnnear && (this.bg_mtnnear.width = this.canvas.width);
        this.bg_mtnfar && (this.bg_mtnfar.width = this.canvas.width);
        this.bg_snow && (this.bg_snow.width = this.canvas.width);
        this.bg_sky && (this.bg_sky.width = this.canvas.width);

        this.tryAgain && (this.tryAgain.x = this.canvas.width / 2);
        this.gameOver && (this.gameOver.x = this.canvas.width / 2);
        this.leaderboardButton && (this.leaderboardButton.x = this.canvas.width / 2);
        this.gamePaused && (this.gamePaused.x = this.canvas.width / 2);
        this.start && (this.start.x = this.canvas.width / 2);
        this.instructions && (this.instructions.x = this.canvas.width / 2);
        this.soundButton && (this.soundButton.x = this.canvas.width - 60);
        this.leaderboardBox && (this.leaderboardBox.x = this.canvas.width / 2);
        this.leaderboardText?.forEach(e => e.destroy());
        this.populateLeaderboardText();
    }

    private createGameOver = () => {
        if (this.gameOver) {
            return;
        }
        this.gameOver = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2, "gameOver");
        this.tryAgain = this.add
            .image(this.canvas.width / 2, SCREEN_HEIGHT / 2, "tryAgain")
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.tryAgain?.setTexture("tryAgainHover");
            })
            .on("pointerout", () => {
                this.tryAgain?.setTexture("tryAgain");
            })
            .on("pointerup", this.onTryAgain);

        this.leaderboardButton = this.add
            .image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 60, "leaderboard_button")
            .setInteractive({ cursor: "pointer" })
            .on("pointerup", this.onLeaderboard);

        this.input.keyboard
            .addKey("SPACE")
            .on("down", () => {
                this.tryAgain?.setTexture("tryAgainHover");
            })
            .on("up", this.onTryAgain);

        this.input.keyboard
            .addKey("ENTER")
            .on("down", () => {
                this.tryAgain?.setTexture("tryAgainHover");
            })
            .on("up", this.onTryAgain);

        this.gameOver?.setDepth(1);
        this.tryAgain?.setDepth(2);
        this.leaderboardButton?.setDepth(2);
    };

    public ifHighScore = () => {
        for (const i in this.leaderboardArr) {
            if (this.currentScore >= this.leaderboardArr[i][1]) {
                this.leaderboardArr.splice(parseInt(i, 10), 0, [
                    (SkiFreeScene.username ?? "jfan").substring(0, 6),
                    this.currentScore,
                ]);
                this.leaderboardArr.pop();
                this.curRank = parseInt(i, 10);
                return i;
            }
        }
        this.curRank = -1;
        return -1;
    };

    private populateLeaderboardText() {
        if (this.gameState !== GameStates.Leaderboard || !this.leaderboardBox) {
            return;
        }

        this.BOX_WIDTH = this.leaderboardBox ? this.leaderboardBox.width : 0;
        this.BOX_HEIGHT = this.leaderboardBox ? this.leaderboardBox.height : 0;
        let { BOX_HEIGHT, BOX_WIDTH, TITLE_PADDING } = this;

        TITLE_PADDING = 20;

        this.leaderboardText?.forEach(e => e.destroy());
        this.leaderboardText = [];

        this.leaderboardText.push(
            this.add
                .bitmapText(
                    this.canvas.width / 2 - BOX_WIDTH / 2 + TITLE_PADDING,
                    BOX_HEIGHT / 4,
                    "arcadeFont",
                    "RANK",
                    15,
                )
                .setTint(0x000000),
        );
        this.leaderboardText.push(
            this.add
                .bitmapText(this.canvas.width / 2 - BOX_WIDTH / 10, BOX_HEIGHT / 4, "arcadeFont", "SCORE", 15)
                .setTint(0x000000),
        );
        this.leaderboardText.push(
            this.add
                .bitmapText(
                    this.canvas.width / 2 + BOX_WIDTH / 3 - TITLE_PADDING,
                    BOX_HEIGHT / 4,
                    "arcadeFont",
                    "NAME",
                    15,
                )
                .setTint(0x000000),
        );

        if (this.curRank === -1) {
            for (let i = 1; i <= 5; i++) {
                this.leaderboardText.push(
                    this.add
                        .bitmapText(
                            this.canvas.width / 2 - BOX_WIDTH / 2 + TITLE_PADDING,
                            BOX_HEIGHT / 4 + (i * BOX_HEIGHT) / 8,
                            "arcadeFont",
                            i.toString(),
                            15,
                        )
                        .setTint(0x000000),
                );
                this.leaderboardText.push(
                    this.add
                        .bitmapText(
                            this.canvas.width / 2 - BOX_WIDTH / 10,
                            BOX_HEIGHT / 4 + (i * BOX_HEIGHT) / 8,
                            "arcadeFont",
                            this.leaderboardArr[i - 1][1].toString(),
                            15,
                        )
                        .setTint(0x000000),
                );
                this.leaderboardText.push(
                    this.add
                        .bitmapText(
                            this.canvas.width / 2 + BOX_WIDTH / 3 - TITLE_PADDING,
                            BOX_HEIGHT / 4 + (i * BOX_HEIGHT) / 8,
                            "arcadeFont",
                            this.leaderboardArr[i - 1][0],
                            15,
                        )
                        .setTint(0x000000),
                );
            }
        } else {
            for (let i = 1; i <= 5; i++) {
                this.leaderboardText.push(
                    this.add
                        .bitmapText(
                            this.canvas.width / 2 - BOX_WIDTH / 2 + TITLE_PADDING,
                            BOX_HEIGHT / 4 + (i * BOX_HEIGHT) / 8,
                            "arcadeFont",
                            i.toString(),
                            15,
                        )
                        .setTint(0x000000),
                );
                this.leaderboardText.push(
                    this.add
                        .bitmapText(
                            this.canvas.width / 2 - BOX_WIDTH / 10,
                            BOX_HEIGHT / 4 + (i * BOX_HEIGHT) / 8,
                            "arcadeFont",
                            this.leaderboardArr[i - 1][1].toString(),
                            15,
                        )
                        .setTint(0x000000),
                );
                this.leaderboardText.push(
                    this.add
                        .bitmapText(
                            this.canvas.width / 2 + BOX_WIDTH / 3 - TITLE_PADDING,
                            BOX_HEIGHT / 4 + (i * BOX_HEIGHT) / 8,
                            "arcadeFont",
                            this.leaderboardArr[i - 1][0],
                            15,
                        )
                        .setTint(0x000000),
                );
            }
        }

        this.leaderboardText.forEach(text => text.setDepth(201));
    }

    private displayLeaderboard() {
        if (this.leaderboardBox) {
            return;
        }

        this.leaderboardBox = this.add.image(this.canvas.width / 2, this.canvas.height / 2 - 25, "bg_leaderboard");
        this.leaderboardBox.setDepth(200);

        this.leaderboardText = [];
        this.populateLeaderboardText();

        this.tryAgain = this.add
            .image(this.canvas.width / 2, SCREEN_HEIGHT / 2 + 120, "tryAgain")
            .setInteractive({ cursor: "pointer" })
            .on("pointerover", () => {
                this.tryAgain?.setTexture("tryAgainHover");
            })
            .on("pointerout", () => {
                this.tryAgain?.setTexture("tryAgain");
            })
            .on("pointerup", this.onTryAgain);
        this.tryAgain?.setDepth(202);
    }

    public preload() {
        this.scale.refresh();
        this.canvas = this.game.canvas;
        this.load.image('muted', 'assets/sound-off.png');
        this.load.image('unmuted', 'assets/sound-on.png');
        this.load.image('tryAgain', 'assets/try-again.png');
        this.load.image('tryAgainHover', 'assets/try-again-hover.png');
        this.load.image('gameOver', 'assets/game-over.png');
        this.load.image('start', 'assets/start.png');
        this.load.image('startHover', 'assets/start-hover.png');
        this.load.image('instructions', 'assets/instructions.png');
        this.load.image('bg_mtnnear', 'assets/bg_mtnnear.png');
        this.load.image('bg_mtnfar', 'assets/bg_mtnfar.png');
        this.load.image('bg_sky', 'assets/bg_sky.png');
        this.load.image('bg_snow', 'assets/bg_snow.png');
        this.load.image(PAUSED, 'assets/paused.png');
        this.load.image(HOUSE, 'assets/house.png');
        this.load.image(SNOWMAN, 'assets/snowman.png');
        this.load.image(SKI_TRAIL, 'assets/trail.png');
        this.load.image(STICK, 'assets/stick.png');
        this.load.image(STONE, 'assets/stone.png');
        this.load.image(STONE2, 'assets/stone2.png');
        this.load.image(TREE_EMPTY_1, 'assets/tree_empty1.png');
        this.load.image(TREE_EMPTY_2, 'assets/tree_empty2.png');
        this.load.image(TREE_SNOWY_1, 'assets/tree_snowy1.png');
        this.load.image(TREE_SNOWY_2, 'assets/tree_snowy2.png');
        this.load.image(TREE_TRUNK, 'assets/tree_trunk.png');
        this.load.image(TREE, 'assets/tree.png');
        this.load.image(LITTLE_ROCK, 'assets/rock_little.png');
        this.load.image(BIG_ROCK, 'assets/rock_big.png');
        this.load.spritesheet(SNOWFLAKES, 'assets/snowflakes.png', { frameWidth: 17, frameHeight: 17 });
        this.load.spritesheet(DINOSAUR, 'assets/dinosaur.png', { frameWidth: 100, frameHeight: 100 });
        this.load.spritesheet(SKIER, 'assets/skier.png', { frameWidth: Player.WIDTH, frameHeight: Player.HEIGHT });
        this.load.spritesheet(WOLF, 'assets/running_wolf_sprite.png', { frameWidth: 563, frameHeight: 265 });
        this.load.spritesheet(BEAR, 'assets/bear.png', { frameWidth: 200, frameHeight: 200 });

        // Leaderboard stuff
        this.load.image("bg_leaderboard", 'assets/leaderboard-background.png');
        this.load.image("block", 'assets/block.png');
        this.load.image("leaderboard_button", 'assets/leaderboard-button.png');

        this.load.bitmapFont("arcadeFont", "assets/arcade.png", "assets/arcade.xml");
        this.load.audio("wind", "assets/blizzard.wav");
        this.load.audio("click", "assets/click.wav");
        this.load.audio("ouch", "assets/ouch.m4a");
        this.load.audio("ski", "assets/ski.m4a");
    }

    public create() {
        this.sound.mute = false;
        this.soundButton = this.createSoundButton();

        const wind_sound = this.sound.add("wind", { loop: true, volume: 0.5 });

        const ENABLE_SKI_SOUND = false;
        ENABLE_SKI_SOUND && (this.skiSound = this.sound.add("ski", { loop: true, volume: 1 }));
        wind_sound.play();

        this.bg_sky = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_sky").setOrigin(0);
        this.bg_mtnfar = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtnfar").setOrigin(0);
        this.bg_mtnnear = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_mtnnear").setOrigin(0);
        this.bg_snow = this.add.tileSprite(0, 0, this.canvas.width, SCREEN_HEIGHT, "bg_snow").setOrigin(0);

        this.createAnimations();
        this.createSnowflakes();
        this.gameState = GameStates.Instructions;

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    private createSnowflakes = () => {
        if (this.snowflakeEmitter) {
            return;
        }

        const topOfCanvas = new Phaser.Geom.Line(0, 0, this.canvas.width * 2, 0);
        this.snowflakeEmitter = this.add
            .particles(SNOWFLAKES)
            .setDepth(0.5)
            .createEmitter({
                name: "snowflakeEmitter",
                gravityY: 10,
                // @ts-ignore
                emitZone: { type: "random", source: topOfCanvas },
                lifespan: 10000,
            })
            .setScale(0.5);
    };

    public dt = 0;
    private updateTime = () => {
        const currTime = new Date();
        if (this.lastUpdate) {
            this.dt = currTime.getTime() - this.lastUpdate.getTime();
        }
        this.lastUpdate = currTime;
    };

    private moveBackground = () => {
        const translate = (velocity: number) => {
            const fps = 1000 / this.dt;
            return velocity / fps;
        };

        this.bg_snow && (this.bg_snow.tilePositionX -= translate(this.gameVelocity));
        this.bg_mtnnear && (this.bg_mtnnear.tilePositionX -= translate(0.9 * this.gameVelocity));
        this.bg_mtnfar && (this.bg_mtnfar.tilePositionX -= translate(0.7 * this.gameVelocity));
        this.bg_sky && (this.bg_sky.tilePositionX -= translate(0.5 * this.gameVelocity));
    };

    private emitSnowflakes = () => {
        const { snowflakeEmitter } = this;
        if (snowflakeEmitter) {
            snowflakeEmitter.setFrame(Math.floor(6 * Math.random()));
            snowflakeEmitter.setSpeedX(this.gameVelocity);
            if (this.gameState === GameStates.GameOver || this.gameState === GameStates.GamePaused) {
                snowflakeEmitter.pause();
            } else {
                snowflakeEmitter.resume();
            }
        }
    };

    public update() {
        this.updateTime();
        this.updateScale();
        this.emitSnowflakes();
        switch (this.gameState) {
            case GameStates.Instructions:
                this.moveBackground();
                this.createStartMenu();
                break;
            case GameStates.PlayGame:
                if (this.skiSound && !this.skiSound.isPlaying) {
                    this.skiSound?.play();
                }
                this.gamePaused?.destroy();
                this.gamePaused = undefined;
                this.physics.resume();
                this.anims.resumeAll();

                this.input.keyboard.addKey("SPACE").on("up", () => (this.gameState = GameStates.GamePaused));

                this.moveBackground();
                this.ticks++;
                this.gameVelocity -= 0.05;
                this.currentScore = Math.floor(this.ticks / 10);
                this.scoreBitmapText?.setText("Score: " + this.currentScore).setFontSize(12);

                this.player?.update();
                this.spawner?.updateCurveSetter(this.ticks);
                this.spawner?.maybeSpawnObstacle(this.ticks);

                // update static obstacle positions
                this.staticObstacles?.children.entries.forEach(child => {
                    const typedChild = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                    if (typedChild.body.right <= 0) {
                        this.staticObstacles?.remove(typedChild, true, true);
                    }
                });

                // Dynamic obstacle trash collection
                this.dynamicObstacles?.children.entries.forEach(child => {
                    const typedChild = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                    if (typedChild.body.right <= 0) {
                        this.dynamicObstacles?.remove(typedChild, true, true);
                    }
                });
                break;
            case GameStates.GamePaused:
                this.physics.pause();
                this.anims.pauseAll();
                this.player?.skiTrailEmitter.pause();
                this.input.keyboard.addKey("SPACE").on("up", () => (this.gameState = GameStates.PlayGame));
                if (this.gamePaused == null) {
                    this.gamePaused = this.add.image(this.canvas.width / 2, SCREEN_HEIGHT / 2, PAUSED).setDepth(1);
                }
                break;
            case GameStates.GameOver:
                this.skiSound?.stop();
                this.createGameOver();
                break;
            case GameStates.Leaderboard:
                // TODO: Add logic for putting leaderboard
                this.displayLeaderboard();
                this.displayLeaderboardTitle();
                break;
        }
    }
}
