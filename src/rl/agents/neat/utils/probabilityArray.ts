/**
 * Holds an array of probabilities, and may be asked to randomly select an element in that array based on its probability.
 *
 * @export
 * @class ProbabilityArray
 */
export default class ProbabilityArray {
    private readonly probs: number[];
    private readonly indexes: number[];

    constructor(probs: number[]) {
        this.probs = probs;
        this.indexes = new Array<number>(this.probs.length);

        for (let i = 0; i < probs.length; ++i) {
            this.indexes[i] = i;
        }

        this.normalize();
    }

    public length() {
        return this.probs.length;
    }

    public removeAt(index: number) {
        this.probs.splice(index, 1);
        this.indexes.splice(index, 1);
        this.normalize();
    }

    /**
     * Randomly picks an index and returns it.
     *
     * @returns
     * @memberof ProbabilityArray
     */
    public randomlySelect() {
        console.assert(this.probs.length > 0, "Tried to pick from an empty ProbabilityArray!");

        const threshold = Math.random();
        let acc = 0.0;

        for (let i = 0; i < this.probs.length; i++) {
            acc += this.probs[i];

            if (acc > threshold) {
                return this.indexes[i];
            }
        }
        
        for (let i = 0; i < this.probs.length; ++i) {
            if (0.0 !== this.probs[i]) {
                return this.indexes[i];
            }
        }

        console.warn("Found a probabilities array filled with zero probabilities.");

        return 0;
    }

    /**
     * Normalizes the probabilities in our array (so that they sum up to one).
     * 
     * @returns
     * @memberof ProbabilityArray
     */
    private normalize() {
        console.assert(this.probs.length > 0, "Tried to normalize an empty ProbabilityArray!");
        
        let total = 0;

        for (const p of this.probs) {
            total += p;
        }

        if (total <= 0.000001) {
            const p = 1 / this.probs.length;

            for (let i = 0; i < this.probs.length; ++i) {
                this.probs[i] = p;
            }
        }

        // If we have already normalized...
        if (Math.abs(1.0 - total) < 0.000001) {
            return;
        }

        const factor = 1 / total;

        for (let i = 0; i < this.probs.length; ++i) {
            this.probs[i] *= factor;
        }
    }
}