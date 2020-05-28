import StringNeuronData from './stringNeuronData';
import Genome from '../genome';
import LinkGene from '../genome/linkGene';
import NeuronGene from '../genome/neuronGene';

type Int = number;

export default class StringNeuralNetwork {
	/**
	 * Prevents RangeError (exceeding maximum string length).
	 * @private
	 * @static
	 */
	private static maximumStringLength = (1 << 27) - 10;

	public neurons: StringNeuronData[];
	private precisionMul: number = 100;

	constructor(genome: Genome, floatDigitsPrecision: number) {
		this.neurons = [];
		this.precisionMul = Math.pow(10, floatDigitsPrecision);

		for (let i = 0; i < genome.neuronGenes.length; ++i) {
			const neuron = genome.neuronGenes[i];

			// Empty strings for now
			this.neurons.push(new StringNeuronData(neuron.id, "", ""));

			// Adds bias if it exists and is not zero
			if (neuron.type !== 'input' && neuron.bias !== 0.0) {
				this.neurons[i].input = "" + this.numberToStr(neuron.bias!);
			}
		}
	}

	public feedForward(links: LinkGene[]) {
		for (const link of links) {
			if (!link.isEnabled || link.inNeuron.id === link.outNeuron.id) {
				continue;
			}

			const inIndex = this.getNeuronIndexByID(link.inNeuron.id);
			const outIndex = this.getNeuronIndexByID(link.outNeuron.id);
			let prefix = (!!this.neurons[outIndex].input ? "+" : "");
			const weightString = this.numberToStr(link.weight);

			if (weightString.startsWith("-")) {
				prefix = "";
			}
			
			this.neurons[outIndex].input = this.appendToStr(this.neurons[outIndex].input, prefix + weightString + "*" + this.neurons[inIndex].output);
		}
	}

	public getNeuronIndexByID(id: Int) : Int {
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
	public getNeuronDataByID(id: Int) : StringNeuronData | undefined {
		for (const neuron of this.neurons) {
			if (neuron.id === id) {
				return neuron;
			}
		}

		console.warn("Runtime data requested for invalid ID: " + id);

		return undefined;
	}

	/**
	 * Activates a neural network's neuron, and returns the activated neuron output
	 * Neuron must not be of type hidden or output
	 * @param  neuron
	 */
	public activateNeuron(neuronGene: NeuronGene) : string {
		if (neuronGene.type !== "hidden" && neuronGene.type !== "output") {
			console.warn("Tried to activate an input neuron!");
			return "NULL";
		}

		const index = this.getNeuronIndexByID(neuronGene.id);

		// Is looped recurrent link?
		if (neuronGene.loopedLink) {
			// See http://www.wildml.com/2015/09/recurrent-neural-networks-tutorial-part-1-introduction-to-rnns/
			// RNN unfold
			// RNN memory getNeuronIndexByID should be the same as our current neurons' getNeuronIndexByID
			const prefix = !!this.neurons[index].input ? "+" : "";
			this.neurons[index].input = this.appendToStr(this.neurons[index].input, prefix + this.numberToStr(neuronGene.loopedLink.weight) + "*M" + index);
		}

		this.neurons[index].output = this.appendToStr(this.neurons[index].output, "𝛼(" + this.neurons[index].input + ")");
		
		return this.neurons[index].output;
	}

	/**
	 * Safely appends strToAppend to dst. Prevents RangeErrors.
	 *
	 * @private
	 * @param {string} dstlllllllllllll
	 * @param {string} strToAppend
	 * @memberof StringNeuralNetwork
	 */
	private appendToStr(dst: string, strToAppend: string) {
		if (dst.length + strToAppend.length <= StringNeuralNetwork.maximumStringLength) {
			return dst + strToAppend;
		}

		console.warn("Attempted to append to dst a string with length " + strToAppend.length + ". Dst length is: " + dst.length + ".");
		return dst;
	}

	private numberToStr(n: number) {
		return String(Math.round(n * this.precisionMul) / this.precisionMul);
	}
}