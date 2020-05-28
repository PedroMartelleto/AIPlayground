import Innovation from './innovation';
import NeuronGene from './neuronGene';

/**
 * A Link Gene. Use the community to the determine the innovation number.
 */
export default class LinkGene {
	public inNeuron: NeuronGene;
	public outNeuron: NeuronGene;
	public weight: number;
	public isEnabled: boolean;
	public readonly innovation?: Innovation;

	constructor(inNeuron: NeuronGene, outNeuron: NeuronGene, weight: number, isEnabled: boolean, innovation?: Innovation) {
		this.inNeuron = inNeuron;
		this.outNeuron = outNeuron;
		this.weight = weight;
		this.isEnabled = isEnabled;
		this.innovation = innovation;
	}
	
	/**
	 * Returns a new instance of this LinkGene.
	 * Does not copy innovations - passes them by reference instead.
	 * @param clonedInNeuron 
	 * @param clonedOutNeuron 
	 */
	public clone(clonedInNeuron: NeuronGene, clonedOutNeuron: NeuronGene) {
		// We are passing this.innovation by reference here, so it's not really copying everything
		// However, innovations should never change for a existing gene, so it makes no difference
		return new LinkGene(clonedInNeuron, clonedOutNeuron, this.weight, this.isEnabled, this.innovation);
	}
}
