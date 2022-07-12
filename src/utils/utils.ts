
export const getNoiseFunction = (num_coeff: integer) => {

    const offsets = Array.from({ length: num_coeff }, () => Math.PI / 16 * Math.random());
    const period = Array.from({ length: num_coeff }, () => Math.random());
    const zipped_arr = offsets.map((a, i) => [a, period[i]])

    return (t: number) => {
        return zipped_arr.reduce(
            (agg, val) => {
                return agg + Math.cos(val[0] * t + val[1]);
            }, 0
        )
    }
}