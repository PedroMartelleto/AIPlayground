import Genome from '../genome';
import LinkGene from '../genome/linkGene';
import NeuronData from './neuronData';
import NeuronGene from '../genome/neuronGene';
import StringNeuralNetwork from './stringNeuralNetwork';

type Int = number;

function beautifyFormulaString(str: string) {
	return str.replace(/1\*/g, "").replace(/\*1/g, "").replace(/\*/g, "");
}

/**
 * A Neural network that may have looped recurrencies
 * Depth defines the amount of unfolding/size of memory stored for looped recurrent links
 * Only single looped recurrencies are allowed - there must be no loops defined between multiple neurons
 * @param  {Genome} genome
 * @param  {number} depth
 * @constructor
 */
export default class NeuralNetwork {
	public readonly genome: Genome;

	/**
	 * Runtime input/output data used during activation.
	 */
	public readonly neurons: NeuronData[] = [];

	/**
	 * Holds the previous neuron data.
	 * Used in recursive links.
	 */
	private rnnMemory: NeuronData[] = [];

	private hasActivated: boolean = false;

	constructor(genome: Genome) {
		this.genome = genome;
	}

    public generateFormula(inputsAsFormulaNames: string[], digitsPrecision: Int) : string[] {
		const nn = new StringNeuralNetwork(this.genome, digitsPrecision);

		const finalOutputs: string[] = [];

		this.genome.iterate(
			(inputNeuron, outLinks, _) => {
				// Note that the index is from the genome's array
				const i = nn.getNeuronIndexByID(inputNeuron.id);
				nn.neurons[i].input = nn.neurons[i].output = inputsAsFormulaNames[i];
				nn.feedForward(outLinks);
				return false;
			},
			(hiddenNeuron, outLinks, _) => {
				// Note that the index is from the genome's array
				nn.activateNeuron(hiddenNeuron);
				nn.feedForward(outLinks);
				return false;
			},
			(outputNeuron, _) => {
				// Note that the index is from the genome's array
				nn.activateNeuron(outputNeuron);
				finalOutputs.push(nn.getNeuronDataByID(outputNeuron.id)!.output);
				return false;
			}
		);

		// Beautifies formula and returns
		return finalOutputs.map(element => beautifyFormulaString(element));
    }

    /**
     * Activates the neural network with the given inputs
     * Returns the output from the NeuralNetwork, or
     * undefined if the number of inputs given isn't the same as the number of input neurons in the network
     * @param  inputs
     * @return
     */
	public activate(inputs: number[]) : number[] {
		if (inputs.length !== this.genome.inputCount) {
			console.warn(`Tried to activate a phenotype passing an incorrect number of inputs for the original genome. Genome input count: ${this.genome.inputCount}. Passed input count: ${inputs.length}.`);
			return [];
		}

		this.prepareForActivation();

		const outputs: number[] = [];
		const network = this;

		this.genome.iterate(
			(inputNeuron, outLinks, _) => {
				// Note that the index is from the genome's array
				const i = network.getNeuronIndexByID(inputNeuron.id);
				network.neurons[i].input = network.neurons[i].output = inputs[i];
				network.feedForward(outLinks);
				return false;
			},
			(hiddenNeuron, outLinks, _) => {
				// Note that the index is from the genome's array
				network.activateNeuron(hiddenNeuron);
				network.feedForward(outLinks);
				return false;
			},
			(outputNeuron, _) => {
				// Note that the index is from the genome's array
				network.activateNeuron(outputNeuron);
				outputs.push(network.getNeuronDataByID(outputNeuron.id)!.output);
				return false;
			}
		);

		this.hasActivated = true;

		return outputs;
	}

	/**
	 * Sets inputs to the respective neuron's bias, resets outputs, and stores the previous input/output data
	 * @return {void}
	 */
	private prepareForActivation() : void {
		if (this.hasActivated) {
			// Copies elements to the rnn memory
			this.rnnMemory = []; // First we reset the rnn memory

			for (const neuron of this.neurons) {
				this.rnnMemory.push(new NeuronData(neuron.id, neuron.input, neuron.output));
			}
		}

		for (let i = 0; i < this.genome.neuronGenes.length; ++i) {
			const neuron = this.genome.neuronGenes[i];

			// If it is the first time activating, we need to populate the list
			if (!this.hasActivated) {
				this.neurons.push(new NeuronData(neuron.id, 0, 0));
			}

		    // We need the runtime data to be zeroed in order for the calculations to be proper (+=)

			// Bias is added here (0 + bias = bias)
			if (neuron.type === 'input') {
				// Input neurons don't have biases
				this.neurons[i].input = 0;
			} else {
				this.neurons[i].input = neuron.bias!;
			}

			this.neurons[i].output = 0;
		}
	}
	
	/**
	 * Activates a neural network's neuron, and returns the activated neuron output
	 * Neuron must not be of type hidden or output
	 * @param  neuron
	 */
	private activateNeuron(neuron: NeuronGene) : number {
		if (neuron.type !== 'hidden' && neuron.type !== 'output') {
			console.warn("Tried to activate a input neuron!");
			return -1;
		}

		const index = this.getNeuronIndexByID(neuron.id);

		// Is looped recurrent link?
		if (neuron.loopedLink && this.hasActivated) {
			// See http://www.wildml.com/2015/09/recurrent-neural-networks-tutorial-part-1-introduction-to-rnns/
			// RNN unfold
			// RNN memory indexByID should be the same as our current neurons' indexByID
			this.neurons[index].input += neuron.loopedLink.weight * this.rnnMemory[index].output;
		}

		this.neurons[index].output = activation(this.neurons[index].input);
		return this.neurons[index].output;
	}

	/**
	 * Internal use.
	 * Feeds the output data from some neuron to its enabled links, sending the data to the proper destination neurons
	 * @param  network
	 * @param  links
	 * @return
	 */
	private feedForward(links: LinkGene[]) {
		for (const link of links) {
			if (!link.isEnabled || link.inNeuron.id === link.outNeuron.id) {
				continue;
			}

			const inIndex = this.getNeuronIndexByID(link.inNeuron.id);
			const outIndex = this.getNeuronIndexByID(link.outNeuron.id);
			this.neurons[outIndex].input += link.weight * this.neurons[inIndex].output;
		}
	}

	/**
	 * Internal use.
	 * Returns the index of the neuron runtime data given an ID
	 * @param  network
	 * @param  id
	 * @return
	 */
	private getNeuronIndexByID(id: Int) : Int {
		for (let i = 0; i < this.neurons.length; ++i) {
			if (this.neurons[i].id === id) {
				return i;
			}
		}

		console.warn("Runtime index requested for invalid ID: " + id);

		return -1;
	}

	/**
	 * Internal use.
	 * Returns the NeuronData for the neuron with the given ID.
	 * @param  network
	 * @param  id
	 * @return
	 */
	private getNeuronDataByID(id: Int) : NeuronData | undefined {
		for (const neuron of this.neurons) {
			if (neuron.id === id) {
				return neuron;
			}
		}

		console.warn("Runtime data requested for invalid ID: " + id);

		return undefined;
	}
}

/**
 * Activation function.
 * https://sharpneat.sourceforge.io/research/activation-fn-review/activation-fn-review.html
 * @param  x
 * @return
 */
function activation(x: number): number {
	return 2/(1 + Math.exp(-4.9 * x)) - 1;

	// const gradient = 0.001;
	// relu: return x > 0 ? x : gradient * x;
	// logisticsteep: return 2/(1 + Math.exp(-4.9 * x)) - 1;
	// tanh: return return Math.tanh(x);
}
