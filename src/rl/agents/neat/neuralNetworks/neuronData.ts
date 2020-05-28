type Int = number;

/**
 * Structure to store runtime data for each neuron
 */
export default class NeuronData {
	public id: Int;
	public input: number;
	public output: number;

	constructor(id: Int, input: number, output: number) {
		this.id = id;
		this.input = input;
		this.output = output;
	}
}