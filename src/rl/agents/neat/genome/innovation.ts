import NeuronGene from './neuronGene';

type Int = number;

export default class Innovation {
	public readonly n: Int;
	public readonly inNeuron: NeuronGene;
	public readonly outNeuron: NeuronGene;

	constructor(n: Int, inNeuron: NeuronGene, outNeuron: NeuronGene) {
		this.n = n;
		this.inNeuron = inNeuron;
		this.outNeuron = outNeuron;
	}
}
