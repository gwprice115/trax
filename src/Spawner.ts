import { SCREEN_HEIGHT } from "./config";
import Chasing from "./dynamicObstacles/Chasing";
import Falling from "./dynamicObstacles/Falling";
import Tracking from "./dynamicObstacles/Tracking";
import Player from "./Player";
import SkiFreeScene from "./scenes/Game";
import { getNoiseFunction } from "./utils/utils";


export const TREE = 'tree';
export const ROCK = 'rock';
export const PORTAL = 'portal';
export const STAR = 'star';
export const SKIER = 'skier';
export const BEAR = 'bear';
export const CARTMAN = 'cartman';

enum CurveSetterDirection {
    Up = -1,
    Down = 1,
}

const curveSetterNoise = getNoiseFunction(10);

const SPAWN_CHECK_RATE = 10;
const PROBABILITY_OF_SPAWN = .5;

const SHOW_CURVE_SETTER = true;

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const valueSum = Object.values(weights).reduce((a, b) => a + b);
    const coefficient = 1 / valueSum;
    return Object.entries(weights).reduce((p, [k, v]) => Object.assign(p, { [k]: v * coefficient }), {});
}

const PROBABILITY_WEIGHTS = normalizeWeights({
    [ROCK]: 4,
    [TREE]: 4,
    [PORTAL]: 0,
    [STAR]: 2,
    [BEAR]: 1,
    [CARTMAN]: 0.5,
});

export class Spawner {

    private scene: SkiFreeScene;
    private curveSetter: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    constructor(scene: SkiFreeScene) {
        this.scene = scene;
        this.curveSetter = scene.physics.add.sprite(scene.canvas.width, scene.canvas.height / 2, SKIER);
        this.curveSetter.body.checkCollision.up = this.curveSetter.body.checkCollision.down = true;
        if(!SHOW_CURVE_SETTER) {
            this.curveSetter.disableBody(false, true);
        }
    }

    public updateCurveSetter(ticks: number) {
        const direction = curveSetterNoise(ticks) < 0 ? CurveSetterDirection.Down : CurveSetterDirection.Up;
        if ((direction == CurveSetterDirection.Up &&
            this.curveSetter.y > Player.HEIGHT / 2) ||
            (direction == CurveSetterDirection.Down &&
                this.curveSetter.y < this.scene.canvas.height - Player.HEIGHT / 2)
        ) {
            this.curveSetter.setVelocityY(direction * Player.VELOCITY);
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
                        while (yPosition > this.curveSetter.y - 50 && yPosition < this.curveSetter.y + 50) {
                            yPosition = this.getValidSpawnY();
                        }
                        console.log(assetKey)
                        switch (assetKey) {
                            case BEAR:
                                const bear = new Tracking(this.scene, this.scene.canvas.width, yPosition, BEAR, player);
                                bear.body.setSize(32, 48);
                                dynamicObstacles.add(bear, true);
                                break;
                            case STAR:
                                const star = new Falling(this.scene, this.scene.canvas.width * (Math.random() + 1) / 2, 0, STAR)
                                dynamicObstacles.add(star, true);
                            case CARTMAN:
                                const cartman = new Chasing(this.scene, this.scene.canvas.width, Math.random() * SCREEN_HEIGHT, CARTMAN)
                                cartman.displayHeight = 30;
                                cartman.scaleX = cartman.scaleY;
                                dynamicObstacles.add(cartman, true);
                                break;
                            default: //static obstacles
                                const newObstacle = staticObstacles.create(this.scene.canvas.width, yPosition, assetKey, 0);
                                newObstacle.displayHeight = this.scene.getSizeWithPerspective(newObstacle.y, 40)
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