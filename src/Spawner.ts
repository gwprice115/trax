import Chasing from "./dynamicObstacles/Chasing";
import Falling from "./dynamicObstacles/Falling";
import Tracking from "./dynamicObstacles/Tracking";
import StaticObstacle from "./StaticObstacle";
import Player from "./Player";
import SkiFreeScene, { START_GAME_VELOCITY, GameStates } from "./scenes/Game";
import { getNoiseFunction } from "./utils/utils";


export const TREE = 'tree';
export const TREE_SNOWY_1 = 'tree_snowy1';
export const TREE_SNOWY_2 = 'tree_snowy2';
export const STICK = 'stick';
export const STONE = 'stone';
export const STONE2 = 'stone2';
export const TREE_TRUNK = 'tree_trunk';
export const TREE_EMPTY_1 = 'tree_empty1';
export const TREE_EMPTY_2 = 'tree_empty2';
export const HOUSE = 'house';
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

const curveSetterNoise = getNoiseFunction(3);

const SHOW_CURVE_SETTER = false;

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const valueSum = Object.values(weights).reduce((a, b) => a + b);
    const coefficient = 1 / valueSum;
    return Object.entries(weights).reduce((p, [k, v]) => Object.assign(p, { [k]: v * coefficient }), {});
}

const PROBABILITY_WEIGHTS = {
    [LITTLE_ROCK]: 5,
    [BIG_ROCK]: 3,
    [HOUSE]: 1,
    [STICK]: 5,
    [STONE]: 2,
    [STONE2]: 2,
    [TREE_EMPTY_1]: 5,
    [TREE_EMPTY_2]: 5,
    [TREE_SNOWY_1]: 50,
    [TREE_SNOWY_2]: 20,
    [TREE]: 10,
    [TREE_TRUNK]: 2,
    [PORTAL]: 0,
    [SNOWMAN]: 3,
    [BEAR]: 2,
    [WOLF]: 1,
    [DINOSAUR]: 2,
};

const ENTRANCE_TIMES = {
    [DINOSAUR]: 1000,
    [SNOWMAN]: 2000,
    [WOLF]: 3000,
    [BEAR]: 4000,
};

export class Spawner {

    private scene: SkiFreeScene;
    private curveSetter: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private spawnProbability =  0;

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
        const fps = 1000 / this.scene?.dt;
        const SPAWN_CHECK_RATE = Math.round(fps / 6); // normalize for different framerates
        const spawn_plane = this.scene.canvas.width + 100;

        if (ticks % SPAWN_CHECK_RATE === 0 && Math.random() < this.spawnProbability) {
            const { staticObstacles, dynamicObstacles, player, gameState } = this.scene;
            if (gameState === GameStates.PlayGame && staticObstacles != null && dynamicObstacles != null && player != null) {
                let weightSum = 0;
                let assetPlaced = false;
                const randomValue = Math.random();
                const timeGatedProbabilityWeights = normalizeWeights(Object.entries(PROBABILITY_WEIGHTS).filter(([k, v]) => 
                    ENTRANCE_TIMES[k as keyof typeof ENTRANCE_TIMES] == null || ENTRANCE_TIMES[k as keyof typeof ENTRANCE_TIMES] < ticks
                ).reduce((p, [k, v]) => Object.assign(p, { [k]: v }), {}));
                Object.keys(timeGatedProbabilityWeights).forEach(assetKey => {
                    if (!assetPlaced && randomValue <= weightSum + timeGatedProbabilityWeights[assetKey]) {
                        assetPlaced = true;
                        let yPosition = this.getValidSpawnY();
                        while (yPosition > this.curveSetter.y - 60 && yPosition < this.curveSetter.y + 60) {
                            yPosition = this.getValidSpawnY();
                        }
                        switch (assetKey) {
                            case BEAR:
                                const bear = new Tracking(this.scene, spawn_plane, yPosition, BEAR, player);
                                dynamicObstacles.add(bear, true);
                                break;
                            case SNOWMAN:
                                const snowman = new Falling(this.scene, spawn_plane * (Math.random() + 1) / 2, 0, SNOWMAN)
                                dynamicObstacles.add(snowman, true);
                                break;
                            case WOLF:
                                const wolf = new Chasing(this.scene, spawn_plane, yPosition, WOLF)
                                dynamicObstacles.add(wolf, true);
                                break;
                            default: //static obstacles
                                const staticObstacle = new StaticObstacle(this.scene, spawn_plane, yPosition, assetKey);
                                staticObstacles.add(staticObstacle, true);
                                break;
                        }
                    } else {
                        weightSum += timeGatedProbabilityWeights[assetKey];
                    }
                });
                assetPlaced = false;
                weightSum = 0;
            }
        } 
        if (this.spawnProbability < 1) {
            this.spawnProbability = 0.2 + Math.pow(this.scene.gameVelocity - START_GAME_VELOCITY, 2) / 100000; // slightly exponential increase in probability
        }
    }
}
