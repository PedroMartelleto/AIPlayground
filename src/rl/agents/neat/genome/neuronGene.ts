import LinkGene from './linkGene';

type Int = number;

export type NeuronType = 'hidden' | 'input' | 'output';

/**
 * A Neuron Gene. Use the static functions to create instances.
 * @param  splitX
 * @param  splitY
 * @return
 */
export default class NeuronGene {
	public loopedLink?: LinkGene = undefined;
	public readonly id: Int;
	public readonly type: NeuronType;
	// Used for display purposes
	public readonly splitX: number;
	public readonly splitY: number;
	public bias?: number;

	constructor(id: Int, type: NeuronType, splitX: number, splitY: number) {
		this.id = id;
		this.type = type;
		this.splitX = splitX;
		this.splitY = splitY;

		// Input neurons may not have biases
		if (type !== 'input') {
			this.bias = 0;
		}
	}

	/**
	 * Clones this neuron.
	 * Does not clone looped link (or set it).
	 */
	public clone() {
		// Type should never change at this point, so we pass it by reference
		const clonedNeuron = new NeuronGene(this.id, this.type, this.splitX, this.splitY);

		if (this.type !== 'input') {
			clonedNeuron.bias = this.bias;
		}

		return clonedNeuron;
	}
}
