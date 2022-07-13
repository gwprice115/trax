import { SCREEN_HEIGHT } from "./config";
import Chasing from "./dynamicObstacles/Chasing";
import Falling from "./dynamicObstacles/Falling";
import Tracking from "./dynamicObstacles/Tracking";
import Player from "./Player";
import SkiFreeScene from "./scenes/Game";
import { getNoiseFunction } from "./utils/utils";


export const TREE = 'tree';
export const ROCK = 'rock';
export const BIG_ROCK = 'big_rock'
export const LITTLE_ROCK = 'little_rock'
export const PORTAL = 'portal';
export const SNOWMAN = 'snowman';
export const SKIER = 'skier';
export const BEAR = 'bear';
export const WOLF = 'wolf';
export const DINOSAUR = 'dinosaur';

enum CurveSetterDirection {
    Up = -1,
    Down = 1,
}

const curveSetterNoise = getNoiseFunction(10);

const SPAWN_CHECK_RATE = 20;
const PROBABILITY_OF_SPAWN = .5;

const SHOW_CURVE_SETTER = true;

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const valueSum = Object.values(weights).reduce((a, b) => a + b);
    const coefficient = 1 / valueSum;
    return Object.entries(weights).reduce((p, [k, v]) => Object.assign(p, { [k]: v * coefficient }), {});
}

const PROBABILITY_WEIGHTS = normalizeWeights({
    [LITTLE_ROCK]: 5,
    [BIG_ROCK]: 3,
    [TREE]: 10,
    [PORTAL]: 0,
    [SNOWMAN]: 3,
    [BEAR]: 2,
    [WOLF]: 1,
    [DINOSAUR]: 2,
});

export class Spawner {

    private scene: SkiFreeScene;
    private curveSetter: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    constructor(scene: SkiFreeScene) {
        this.scene = scene;
        this.curveSetter = scene.physics.add.sprite(scene.canvas.width, scene.canvas.height / 2, SKIER);
        this.curveSetter.body.checkCollision.up = this.curveSetter.body.checkCollision.down = true;
        this.curveSetter.displayHeight = Player.DISPLAY_HEIGHT;
        if (!SHOW_CURVE_SETTER) {
            this.curveSetter.disableBody(false, true);
        }
    }

    public updateCurveSetter(ticks: number) {
        const direction = curveSetterNoise(ticks) < 0 ? CurveSetterDirection.Down : CurveSetterDirection.Up;
        if ((direction == CurveSetterDirection.Up &&
            this.curveSetter.y > Player.HEIGHT / 2) && this.curveSetter.y > this.scene.getSkyHeight() ||
            (direction == CurveSetterDirection.Down &&
                this.curveSetter.y < this.scene.canvas.height - Player.HEIGHT / 2)
        ) {
            this.curveSetter.setVelocityY(direction * (Player.VELOCITY - 100)); // make curve setter a little slower than player to make game less difficult
        } else {
            this.curveSetter.setVelocityY(0);
        }
    }

    private getValidSpawnY = () => Math.random() * (this.scene.canvas.height - this.scene.getSkyHeight()) + this.scene.getSkyHeight();

    public maybeSpawnObstacle(ticks: number) {
        if (ticks % SPAWN_CHECK_RATE === 0 && Math.random() < PROBABILITY_OF_SPAWN) {
            const { staticObstacles, dynamicObstacles, player, gameOver } = this.scene;
            if (!gameOver && staticObstacles != null && dynamicObstacles != null && player != null) {
                let weightSum = 0;
                let assetPlaced = false;
                const randomValue = Math.random();
                Object.keys(PROBABILITY_WEIGHTS).forEach(assetKey => {
                    if (!assetPlaced && randomValue <= weightSum + PROBABILITY_WEIGHTS[assetKey]) {
                        assetPlaced = true;
                        let yPosition = this.getValidSpawnY();
                        while (yPosition > this.curveSetter.y - 60 && yPosition < this.curveSetter.y + 60) {
                            yPosition = this.getValidSpawnY();
                        }
                        console.log(assetKey)
                        switch (assetKey) {
                            case BEAR:
                                const bear = new Tracking(this.scene, this.scene.canvas.width, yPosition, BEAR, player);
                                bear.body.setSize(32, 48);
                                dynamicObstacles.add(bear, true);
                                break;
                            case SNOWMAN:
                                const snowman = new Falling(this.scene, this.scene.canvas.width * (Math.random() + 1) / 2, 0, SNOWMAN)
                                dynamicObstacles.add(snowman, true);
                            case WOLF:
                                const wolf = new Chasing(this.scene, this.scene.canvas.width, yPosition, WOLF)
                                wolf.body.setSize(80, 32);
                                wolf.displayHeight = 32
                                wolf.scaleX = wolf.scaleY;
                                dynamicObstacles.add(wolf, true);
                                break;
                            default: //static obstacles
                                const newObstacle = staticObstacles.create(this.scene.canvas.width, yPosition, assetKey, 0);
                                newObstacle.displayHeight = this.scene.getSizeWithPerspective(newObstacle.y, newObstacle.height)
                                newObstacle.scaleX = newObstacle.scaleY;
                                break;
                        }
                    } else {
                        weightSum += PROBABILITY_WEIGHTS[assetKey];
                    }
                });
                assetPlaced = false;
                weightSum = 0;
            }
        }
    }
}