type Int = number;

/**
 * Structure to store runtime data for each neuron
 */
export default class StringNeuronData {
	public id: Int;
	public input: string;
	public output: string;

	constructor(id: Int, input: string, output: string) {
		this.id = id;
		this.input = input;
		this.output = output;
	}
}