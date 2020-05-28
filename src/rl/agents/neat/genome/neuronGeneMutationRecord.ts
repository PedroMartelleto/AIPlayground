import NeuronGene from './neuronGene';

type Int = number;

/**
 * Hidden neurons are create in a mutation that splits an existing link. When we do so, a new record is made (if there are no existing ones).
 * @param id
 * @param inNeuron
 * @param outNeuron
 */
export default class NeuronGeneMutationRecord {
    public readonly id: Int;
    public readonly inNeuron: NeuronGene;
    public readonly outNeuron: NeuronGene;

    constructor(id: Int, inNeuron: NeuronGene, outNeuron: NeuronGene) {
        this.id = id;
        this.inNeuron = inNeuron;
        this.outNeuron = outNeuron;
    }
}
