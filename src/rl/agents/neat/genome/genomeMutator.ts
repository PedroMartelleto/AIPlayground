import Genome from '.';
import Helper from '../utils/helper';
import LinkGene from './linkGene';
import NeuronGene from './neuronGene';
import NeuronGeneMutationRecord from './neuronGeneMutationRecord';
import NEATParams from '../params';

type Int = number;

interface ILinkIndex {
	from: Int;
	to: Int;
}

export default class GenomeMutator {
	public static mutate(genome: Genome, params: NEATParams) {
		genome.fitness = 0;
        genome.adjustedFitness = 0;
        genome.phenotype = undefined;

		if (genome.neuronGenes.length - genome.inputCount - genome.outputCount < params.maxNumberOfHiddenNeurons.value) {
			GenomeMutator.addHiddenNeuronMutation(genome, params.hiddenNeuronMutationRate.value);
		}

		GenomeMutator.addLinkMutation(genome, params.linkMutationRate.value,
											params.linkMutationChanceOfConsideringLoopedRecurrency.value);
		
		GenomeMutator.weightsMutation(genome, params.weightMutationRateForEachLink.value,
											params.weightMutationProbNewVal.value,
											params.weightMutationMaxPertubation.value,
											params.weightMutationNewValRange.value);
		
		GenomeMutator.biasesMutation(genome, params.biasMutationRateForEachLink.value,
										   params.biasMutationProbNewVal.value,
										   params.biasMutationMaxPertubation.value,
										   params.biasMutationNewValRange.value);
	}

	/**
	 * Mutation that adds a link to a genome
	 * @param  genome
	 * @param  mutationRate
	 * @param  chanceOfConsideringLoopedRecurrency See EpochConfig.
	 * @return
	 */
	public static addLinkMutation(genome: Genome, mutationRate: number, chanceOfConsideringLoopedRecurrency: number) : void {
		if (Math.random() >= mutationRate) {
			return;
		}

		// Array of all possible combinations of source and destination
		const possibleLinks: ILinkIndex[] = [];

		for (let i = 0; i < genome.neuronGenes.length; ++i) {
			for (let j = 0; j < genome.neuronGenes.length; ++j) {
				if (genome.neuronGenes[i].id !== genome.neuronGenes[j].id) {
					possibleLinks.push({ from: i, to: j });
				}
			}
		}

		if (Math.random() < chanceOfConsideringLoopedRecurrency) {
			// We add source=dest links separatedly to avoid duplicate links
			for (let i = 0; i < genome.neuronGenes.length; ++i) {
				possibleLinks.push({ from: i, to: i });
			}
		}

		// Shuffles our array
		Helper.shuffle(possibleLinks);

		// Go through the shuffled possibleLinks array until we find a combination of (src, dst) that is valid to make the mutation
		for (const link of possibleLinks) {
			const src = link.from;
			const dst = link.to;

			// The destination neuron
			// Input neurons don't take inputs from other neurons
			if (genome.neuronGenes[dst].type !== 'input' && !genome.isDuplicateLink(genome.neuronGenes[src].id, genome.neuronGenes[dst].id)) {
				if (dst === src) {
					if (genome.neuronGenes[src].loopedLink) {
						continue;
					}
				} else if (genome.neuronGenes[src].type === 'output') {
					// We don't allow links that have output neuron as source unless the link is looped recurrent
					continue;
				}

				// Checks if the link might create an infinite loop when trying to activate the phenotype
				if (src !== dst && genome.isLinkPotentialLoop(genome.neuronGenes[src], genome.neuronGenes[dst])) {
					continue;
				}

				// Also sets the 'loopedLink' variable at our neuron
				genome.community!.addLinkToGenome(genome, genome.neuronGenes[src], genome.neuronGenes[dst], Math.random() * 4 - 2, true);

				// Break loop
				return;
			}
		}
	}

	/**
	 * Mutation that adds a hidden neuron to a genome
	 * @param  genome
	 * @param  mutationRate
	 * @return
	 */
	public static addHiddenNeuronMutation(genome: Genome, mutationRate: number) : void {
		if (Math.random() >= mutationRate) {
			return;
		}

		// Links which we can use to perform the mutation at
		const validLinks: LinkGene[] = [];

		for (const link of genome.linkGenes) {
			// If the link is enabled and is not looped recurrent, then it is valid for mutation
			if (link.isEnabled && link.inNeuron.id !== link.outNeuron.id) {
				validLinks.push(link);
			}
		}

		// It is possible that every link is disabled
		if (validLinks.length <= 0) {
			return;
		}

		let chosenLinkIndex = 0;

		// If the genome has more than 5 hidden neurons or is at its minimal state, any link from the validLinks list can be picked
		// Else, we limit ourselves to pick one of the older genes (which are the ones that are closer to the start of our validLinks array)
		// This is done in order to avoid a mutation chaining effect (a lot of neurons added at the same connection), which is the likely scenario if any link index is picked at all cases)
		// FIXME: There's probably a better way to avoid chaining (number of steps to input and output - weighted probability)

		if (genome.linkGenes.length === genome.inputCount * genome.outputCount || genome.neuronGenes.length >= genome.inputCount + genome.outputCount + 5) {
			chosenLinkIndex = Helper.randomInt(0, validLinks.length - 1);
		} else {
			// Genome too small, limit our randomness to older neurons
			chosenLinkIndex = Helper.randomInt(0, validLinks.length - Math.floor(Math.sqrt(validLinks.length)) - 1);
		}

		// Found a good link, start the actual mutation process

		const chosenLink = validLinks[chosenLinkIndex];
		chosenLink.isEnabled = false;

		let neuronID = genome.community!.findNeuronIDForMutationAtLink(chosenLink.inNeuron, chosenLink.outNeuron);
		// A new innovation will be created if we could not find a neuron ID for this link
		const shouldCreateNewInnovation = (neuronID < 0);

		// Found a neuron id for the mutation but genome already has such id?
		if (neuronID >= 0 && genome.hasNeuronWithID(neuronID)) {
			// If so, a new neuron id is created
			neuronID = -1;
		}

		// Either the genome has a neuron with the ID from the innovation already or the innovation was not found at our database
		if (neuronID < 0) {
			// A new id is made for the neuron
			++genome.maxNeuronID;
			neuronID = genome.maxNeuronID;
		}

		// At this point, neuronID must be valid

		// We only want to create a new innovation if we don't already have a similar one (similar: innovationInNeuron=inNeuron and innovationOutNeuron=outNeuron)
		if (shouldCreateNewInnovation) {
			genome.community!.neuronGenesRecords.push(new NeuronGeneMutationRecord(neuronID, chosenLink.inNeuron, chosenLink.outNeuron));
		}

		const newNeuron = new NeuronGene(neuronID, 'hidden',
									  	(chosenLink.inNeuron.splitX + chosenLink.outNeuron.splitX) / 2, // splitX
									  	(chosenLink.inNeuron.splitY + chosenLink.outNeuron.splitY) / 2); // splitY
		genome.neuronGenes.push(newNeuron);
		// The new weights assigned attempt to minimize the disturbance to the genome's current output
		genome.community!.addLinkToGenome(genome, chosenLink.inNeuron, newNeuron, 1, true);
		genome.community!.addLinkToGenome(genome, newNeuron, chosenLink.outNeuron, chosenLink.weight, true);
	}

	/**
	 * Mutates the weights of our connections within the predifined limits
	 * Note that the actual chance of a newWeightMutation is: mutationRateForEachLink * probNewWeightMutation
	 * @param  genome
	 * @param  mutationRateForEachLink
	 * @param  probNewWeightMutation
	 * @param  maxPertubation
	 * @param  newWeightRange
	 * @return
	 */
	public static weightsMutation(genome: Genome, mutationRateForEachLink: number, probNewWeightMutation: number, maxPertubation: number, newWeightRange: number) : void {
		for (const link of genome.linkGenes) {
			if (Math.random() < mutationRateForEachLink) {
				if (Math.random() >= probNewWeightMutation) {
					link.weight += (Math.random() * 2 - 1) * maxPertubation * (1 - mutationRateForEachLink);
				} else {
					// This means that we want to replace our weight with a completely new one
					link.weight = Math.random() * newWeightRange * 2 - newWeightRange;
				}
			}
		}
	}

	/**
	 * Mutates the weights of our connections within the predifined limits
	 * Note that the actual chance of a newBiasMutation is: mutationRateForEachLink * probNewWeightMutation
	 * @param  genome
	 * @param  mutationRateForEachLink
	 * @param  probNewBiasMutation
	 * @param  maxPertubation
	 * @param  newBiasRange
	 * @return
	 */
	public static biasesMutation(genome: Genome, mutationRateForEachLink: number, probNewBiasMutation: number, maxPertubation: number, newBiasRange: number) : void {
		for (const neuron of genome.neuronGenes) {
			if (neuron.type === 'input') {
				continue;
			}

			if (Math.random() < mutationRateForEachLink) {
				if (Math.random() >= probNewBiasMutation) {
					neuron.bias! += (Math.random() * 2 - 1) * maxPertubation * (1 - mutationRateForEachLink);
				} else {
					// Means that we want to replace our bias with a completely new one
					neuron.bias = Math.random() * newBiasRange * 2 - newBiasRange;
				}
			}
		}
	}

	private constructor() {}
}
