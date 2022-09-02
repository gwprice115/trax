/*!
 * (c) Copyright 2022 Palantir Technologies Inc. All rights reserved.
 */
export const getNoiseFunction = (num_coeff: integer) => {
    const offsets = Array.from({ length: num_coeff }, () => (Math.PI / 60) * Math.random());
    const period = Array.from({ length: num_coeff }, () => Math.PI * Math.random());
    const zipped_arr = offsets.map((a, i) => [a, period[i]]);

    return (t: number) => {
        return zipped_arr.reduce((agg, val) => {
            return agg + Math.cos(val[0] * t + val[1]);
        }, 0);
    };
};

export const TREE = "tree";
export const TREE_SNOWY_1 = "tree_snowy1";
export const TREE_SNOWY_2 = "tree_snowy2";
export const STICK = "stick";
export const STONE = "stone";
export const STONE2 = "stone2";
export const TREE_TRUNK = "tree_trunk";
export const TREE_EMPTY_1 = "tree_empty1";
export const TREE_EMPTY_2 = "tree_empty2";
export const HOUSE = "house";
export const ROCK = "rock";
export const BIG_ROCK = "big_rock";
export const LITTLE_ROCK = "little_rock";
export const SNOWMAN = "snowman";
export const SKIER = "skier";
export const BEAR = "bear";
export const WOLF = "wolf";
export const DINOSAUR = "dinosaur";

export const SKI_TRAIL = "ski-trail";
export const PAUSED = "paused";
export const START_GAME_VELOCITY = -100;

export const SNOWFLAKES = "snowflakes";
