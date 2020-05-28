import Innovation from './innovation';
import NeuronGene from './neuronGene';

/**
 * If there are no existing records of the link gene mutation being processed, a new one created with an innovation determined by the Community.
 * This class simply holds such records.
 */
export default class LinkGeneMutationRecord {
    public readonly innovation: Innovation;
    public readonly inNeuron: NeuronGene;
    public readonly outNeuron: NeuronGene;

    constructor(innovation: Innovation, inNeuron: NeuronGene, outNeuron: NeuronGene) {
        this.innovation = innovation;
        this.inNeuron = inNeuron;
        this.outNeuron = outNeuron;
    }
}
