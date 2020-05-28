import AlleleGenesData from './genome/alleleGenesData';
import Genome from './genome';
import Helper from './utils/helper';
import Innovation from './genome/innovation';
import LinkGene from './genome/linkGene';
import LinkGeneMutationRecord from './genome/linkGeneMutationRecord';
import NeuronGene from './genome/neuronGene';
import NeuronGeneMutationRecord from './genome/neuronGeneMutationRecord';
import NEATParams from './params';
import Species from './species';
import ProbabilityArray from './utils/probabilityArray';
import SpeciationAlgorithm from './species/speciationAlgorithm';

type Int = number;

/**
 * A group of various species that share the same fitness function, inputCount and outputCount.
 * Also stores innovation databases.
 * Some of the epoch code is inspired by SharpNEAT (https://github.com/colgreen/sharpneat).
 * 
 * @export
 * @class Community
 */
export default class Community {
	// MARK: Constant parameters chosen at the start

	public readonly params: NEATParams;

	public readonly inputCount: Int;
	public readonly outputCount: Int;

	public readonly populationSize: Int;

	/**
	 * The algorithm chosen for speciation.
	 */
	public readonly speciationAlgorithm: SpeciationAlgorithm;


	// MARK: Our genomes and species

	public genomes: Genome[] = [];
	public species: Species[] = [];


	// MARK: Innovation and ID-related databases

    /**
     * Used to determine the id of new genomes
     */
	public maxGenomeID: Int = 0;

    /**
     * Used to determine the id of new species
     */
	public maxSpeciesID: Int = 0;

	/**
	 * Stores { inNeuron, outNeuron, id }.
	 * Note this database does NOT keep track of link innovations.
	 * However, we store the inNeuron, outNeuron of the link where the neuron was inserted.
	 * We have a neuron innovation database in order to assign the proper ids to our neurons, thus not confounding our link innovation database.
	 */
	public neuronGenesRecords: NeuronGeneMutationRecord[] = [];

	/**
	 * Stores { inNeuron, outNeuron, innovation } objects.
	 */
	public linkGenesRecords: LinkGeneMutationRecord[] = [];

	private innovationNumber: Int = 0;
	private generationCounter: Int = 0;


	// MARK: Statistics about the community

	/**
	 * The index of the best species.
	 */
	public bestSpeciesIndex: number = 0;

	/**
	 * The best genome alive. May change from generation to generation.
	 */
	public bestGenome?: Genome = undefined;

	/**
	 * The best fitness for each generation.
	 */
	public bestFitnesses: number[] = [];

	/**
	 * Mean fitness for each generation.
	 */
	public meanFitnesses: number[] = [];

	/**
	 * Creates an instance of Community.
	 * @param {NEATParams} params
	 * @param {Int} inputCount
	 * @param {Int} outputCount
	 * @param {SpeciationAlgorithm} speciationAlgorithm
	 * @memberof Community
	 */
	constructor(params: NEATParams, inputCount: Int, outputCount: Int, speciationAlgorithm: SpeciationAlgorithm) {
		this.params = params;
		this.inputCount = inputCount;
		this.outputCount = outputCount;
		this.speciationAlgorithm = speciationAlgorithm;

		this.populationSize = this.params.initialGenomeCount.value;
		console.assert(Number.isFinite(this.populationSize) && this.populationSize > 0, "Population size must be a non zero natural number.");
	}

	public init() {
		this.genomes = [];

		for (let i = 0; i < this.params.initialGenomeCount.value; ++i) {
			const minimalGenome = Genome.fromCommunity(this).initMinimalGenome();
			this.genomes.push(minimalGenome);
		}

		this.speciationAlgorithm.init(this.genomes, this.params.initialSpeciesCount.value);
		this.species = this.speciationAlgorithm.result;

		this.assertForNoEmptySpecies();
	}

	/**
	 * Crossover between two genomes.
	 * We expect that mom and dad are two different genomes.
	 * See http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf section 3.2
	 * @param mom 
	 * @param dad 
	 */
	public crossover(mom: Genome, dad: Genome): Genome {
		if (mom.id === dad.id) {
			console.warn("Called crossover with momID === dadID. This should never happen.");
			return mom.clone();
		}

		let fittest = mom;
		let other = dad;

		// If dad is more fit than mom or if the fitness of both parents is equal and a 50% chance passes, update our variables
		if ((dad.fitness > mom.fitness) ||
			(mom.fitness === dad.fitness && Math.floor(Math.random() * 2))) {
			fittest = dad;
			other = mom;
		}

		console.assert(other.fitness <= fittest.fitness, "The fittest parent has not been chosen correctly.");
		console.assert(fittest.id !== other.id, "The fittest parent has not been chosen correctly.");

		// Note that genome A is always the fittest (as per convetion)
		const recA = this.alignAlleleGenes(fittest, other);
		const baby = Genome.fromCommunity(this);
		baby.maxNeuronID = fittest.maxNeuronID; // because we take the excess and disjoint from the fittest

		// Copy matching genes at random
		for (let i = 0; i < recA.matchingGenesA.length; ++i) {
			const maybeDisable = !recA.matchingGenesA[i].isEnabled || !recA.matchingGenesB[i].isEnabled;

			if (Math.floor(Math.random() * 2)) {
				baby.copyLinkAndNeuronsToGenomeAndMaybeDisable(recA.matchingGenesA[i], maybeDisable, this.params.offspringLinkDisableRate.value);
			} else {
				baby.copyLinkAndNeuronsToGenomeAndMaybeDisable(recA.matchingGenesB[i], maybeDisable, this.params.offspringLinkDisableRate.value);
			}
		}

		// We only care about excess and disjoint genes from A (the fittest parent)
		for (const gene of recA.disjointGenesA) {
			baby.copyLinkAndNeuronsToGenome(gene);
		}

		for (const gene of recA.excessGenesA) {
			baby.copyLinkAndNeuronsToGenome(gene);
		}

		// As a convetion, we set the baby's species initially to the fittest parent's species.
		// Note that this species may change during speciation.
		baby.species = fittest.species;

		return baby;
	}

	/**
	 * The epoch method.
	 * Expects that all genomes have their fitness calculated before calling the function.
	 * Implements the core evolution algorithm:
	 *   1. Sorts genomes in each species by fitness.
	 * 	 2. Updates the best genome and the best species.
	 *   3. Update general statistics about the algorithm (eg. generation count)
	 * 	 4. Computes spawn counts and creates offsprings.
	 * 	 5. Updates the genome list.
	 *   6. Speciates.
	 */
	public epoch() {
		console.log("Epoch start");

		this.generationCounter += 1;
		
		this.sortEachSpecies();
		this.updateBestGenome();
		this.updateStats();

		const totalOffspringCount = this.computeSpeciesStats();

		// Creates offspring.
		const offspring = this.createOffspring();

		console.assert(totalOffspringCount === offspring.length, "Too little or too many offspring have been created!");

		// Trims species back to their elite genomes.
		const emptySpeciesFlag = this.trimSpeciesBackToElite();

		// Rebuilds the genomes array so that it contains only the elite genomes.
		this.updateGenomesArray();

		this.genomes.push(...offspring);

		// Speciates the new individuals...

		console.log("Speciation start");

		// If we have terminated species...
		if (emptySpeciesFlag) {
			// We need to re-speciate all genomes to divide them evenly between the required number of species.
			this.speciationAlgorithm.respeciateAll(this.genomes, offspring);
			this.species = this.speciationAlgorithm.result;
		}
		else {
			// Else, simply integrate offspring into the existing species. 
			this.speciationAlgorithm.integrateNewGenomes(this.genomes, offspring);
			this.species = this.speciationAlgorithm.result;
		}

		this.assertForNoEmptySpecies();

		console.log("Speciation end");

		// Since bestSpeciesIndex may have changed, we need to once again update the best genome
		this.sortEachSpecies();
		this.updateBestGenome();

		console.assert(this.genomes.length === this.populationSize, "Population size must be equal to the genome count after epoch.");

		console.log("Epoch end");
	}

	/**
	 * Returns the number of "generations" that have been processed.
	 */
	public get generationCount(): Int {
		return this.generationCounter;
	}

	/**
	 * Tries to find a neuron id associated to the given link using our neurons database
	 * If an id could not be found, -1 is returned
	 * @param  inNeuron
	 * @param  outNeuron
	 */
	public findNeuronIDForMutationAtLink(inNeuron: NeuronGene, outNeuron: NeuronGene): Int {
		for (const record of this.neuronGenesRecords) {
			if (record.inNeuron.id === inNeuron.id && record.outNeuron.id === outNeuron.id) {
				return record.id;
			}
		}

		return -1;
	}

    /**
     * Tries to find the Innovation associated to the given link using our links database
     * If we can't find such Innovation at our database, a new Innovation is created, added to the database and returned
     * @param  inNeuron
     * @param  outNeuron
     * @return
     */
	public determineInnovationForLink(inNeuron: NeuronGene, outNeuron: NeuronGene): Innovation {
		for (const record of this.linkGenesRecords) {
			if (record.inNeuron.id === inNeuron.id && record.outNeuron.id === outNeuron.id) {
				return record.innovation;
			}
		}

		// If we haven't returned by now, it is because we couldn't find the given link at our database
		// Thus we add a new link innovation to this population's database
		this.innovationNumber++;

		const innovation = new Innovation(this.innovationNumber, inNeuron, outNeuron);
		this.linkGenesRecords.push({ inNeuron, outNeuron, innovation });

		return innovation;
	}

	/**
	 * Adds link to genome, with the proper innovation number
	 * @param  genome
	 * @param  inNeuron
	 * @param  outNeuron
	 * @param  weight
	 * @param  isEnabled
	 */
	public addLinkToGenome(genome: Genome, inNeuron: NeuronGene, outNeuron: NeuronGene, weight: number, isEnabled: boolean): void {
		const newLink = new LinkGene(inNeuron, outNeuron, weight, isEnabled, this.determineInnovationForLink(inNeuron, outNeuron));

		if (inNeuron.id === outNeuron.id) {
			inNeuron.loopedLink = newLink;
		}

		genome.linkGenes.push(newLink);
	}

	/**
	 * Aligns genes of A with B, returning AlleleGenesData
	 * Note that matchingGenesA.length = matchingGenesB.length
	 * @param  a
	 * @param  b
	 * @return
	 */
	public alignAlleleGenes(A: Genome, B: Genome): AlleleGenesData {
		A.sortGenes();
		B.sortGenes();

		const c = new AlleleGenesData();

		if (A.id === B.id) {
			// There won't be any disjoint or exccess genes.
			c.matchingGenesA = A.linkGenes;
			c.matchingGenesB = A.linkGenes;
			return c;
		}

		if (A.linkGenes.length <= 0 || B.linkGenes.length <= 0) {
			c.matchingGenesA = [];
			console.error(`Tried to align allele genes of invalid genome(s). Link Genes in A: ${A.linkGenes.length}. Link Genes in B: ${B.linkGenes.length}`);
			return c;
		}

		const maxInnovationNumberA = A.linkGenes[A.linkGenes.length - 1].innovation!.n;
		const maxInnovationNumberB = B.linkGenes[B.linkGenes.length - 1].innovation!.n;

		const maxInnovationNumber = Math.max(maxInnovationNumberA, maxInnovationNumberB);

		// Aligns the two link genes arrays by adding void genes where there is no link gene with the given
		// innovation number, which now serves as index.
		const voidedGenesA = new Array<LinkGene | undefined>(maxInnovationNumber).fill(undefined);
		const voidedGenesB = new Array<LinkGene | undefined>(maxInnovationNumber).fill(undefined);

		for (const geneA of A.linkGenes) {
			voidedGenesA[geneA.innovation!.n - 1] = geneA;
		}

		for (const geneB of B.linkGenes) {
			voidedGenesB[geneB.innovation!.n - 1] = geneB;
		}

		for (let i = 0; i < maxInnovationNumber; ++i) {
			// Note i+1 is the innovation number, not i.
			const voidGeneA = voidedGenesA[i];
			const voidGeneB = voidedGenesB[i];

			// If two genes exist with the same innovation number, they are matching genes.
			if (!!voidGeneA && !!voidGeneB) {
				c.matchingGenesA.push(voidGeneA);
				c.matchingGenesB.push(voidGeneB);
			} else if (!!voidGeneA) {
				// Excess genes from A occur when a gene from A has an innovation number is greater than
				// the max innovation number of B.
				if (i + 1 > maxInnovationNumberB) {
					c.excessGenesA.push(voidGeneA);
				} else { // Else it is a disjoint gene.
					c.disjointGenesA.push(voidGeneA);
				}
			} else if (!!voidGeneB) {
				// Excess genes from B occur when a gene from B has an innovation number greater than
				// the max innovation number of A.
				if (i + 1 > maxInnovationNumberA) {
					c.excessGenesB.push(voidGeneB);
				} else { // Else it is a disjoint gene.
					c.disjointGenesB.push(voidGeneB);
				}
			}
		}

		return c;
	}

	/**
	 * Asserts that there are no empty species.
	 *
	 * @memberof Community
	 */
	public assertForNoEmptySpecies() {
		let foundNoEmptySpecies = true;

		for (const species of this.species) {
			if (species.genomes.length <= 0) {
				foundNoEmptySpecies = false;
				break;
			}
		}

		console.assert(foundNoEmptySpecies, "One or more species are empty. It is likely that speciation was not done correctly.");
	}

	public updateStats() {
		let meanFitness = 0;

		for (const genome of this.genomes) {
			meanFitness += genome.fitness;
		}

		meanFitness /= this.genomes.length;

		this.meanFitnesses[this.generationCounter - 1] = meanFitness;
	}

	/**
	 * Computes spawn count and species' adjusted fitness
	 */
	public computeSpeciesStats(): number {
		let totalMeanFitness = 0;
		let totalSpawnCount = 0;

		// Computes the adjusted fitness and its mean
		for (const species of this.species) {
			if (species.genomes.length <= 0) {
				console.warn("Found a species with no members while running NEAT.");
			}

			species.computeAdjustedFitnesses(this.params);

			totalMeanFitness += species.meanAdjustedFitness;
		}

		for (const species of this.species) {
			// Now, we compute the spawnCount for each species

			species.computeSpawnCount(totalMeanFitness);
			totalSpawnCount += species.spawnCount;
		}

		// Since we are rounding the spawn count for each species, we may have a new generation with too many or too little genomes.
		// Thus, we need to handle those two cases separately to try to mantain the population size constant.
		const deltaSpawnCount = totalSpawnCount - this.populationSize;

		if (deltaSpawnCount < 0) {
			if (deltaSpawnCount === -1) {
				// Special (and simpler to handle) case.
				this.species[this.bestSpeciesIndex].spawnCount++;
				totalSpawnCount += 1;
			} else {
				// In this case, randomly assign the remaining spawn count to each species based on the rounding error of its spawn count.
				const probabilities = new Array<number>(this.species.length);

				for (let i = 0; i < this.species.length; ++i) {
					probabilities[i] = Math.max(0, this.species[i].spawnCountReal - this.species[i].spawnCount);
				}

				const probArray = new ProbabilityArray(probabilities);

				for (let i = 0; i < Math.abs(deltaSpawnCount); ++i) {
					const speciesIndex = probArray.randomlySelect();

					this.species[speciesIndex].spawnCount += 1;
					this.species[speciesIndex].spawnCountReal = this.species[speciesIndex].spawnCount;
					totalSpawnCount += 1;

					if (probArray.length() > 1) {
						probArray.removeAt(speciesIndex);
					}
				}
			}
		}
		else if (deltaSpawnCount > 0) {
			// This case is treated analogously to the case above, except we remove from the spawn count instead of adding to it.
			const probabilities = new Array<number>(this.species.length);

			for (let i = 0; i < this.species.length; ++i) {
				probabilities[i] = Math.max(0, this.species[i].spawnCount - this.species[i].spawnCountReal);
			}

			const probArray = new ProbabilityArray(probabilities);

			for (let i = 0; i < Math.abs(deltaSpawnCount); ++i) {
				const speciesIndex = probArray.randomlySelect();

				this.species[speciesIndex].spawnCount -= 1;
				this.species[speciesIndex].spawnCountReal = this.species[speciesIndex].spawnCount;
				totalSpawnCount -= 1;

				if (probArray.length() > 1) {
					probArray.removeAt(speciesIndex);
				}
			}
		}

		console.assert(this.populationSize === totalSpawnCount, `The total spawn count (${totalSpawnCount}) is different from the expected population size (${this.populationSize}).`);

		// In order to preserve the best genome, we ensure that the spawn count of the best species is not zero.
		if (this.species[this.bestSpeciesIndex].spawnCount <= 0) {
			this.species[this.bestSpeciesIndex].spawnCount += 1;

			// To compensate, we randomly decrease the spawn count of one of the species by one.
			const shuffledSpecies = this.species.slice();
			Helper.shuffle(shuffledSpecies);

			for (const species of shuffledSpecies) {
				if (species.spawnCount > 0 &&
					species.id !== this.species[this.bestSpeciesIndex].id) {
					species.spawnCount -= 1;
					species.spawnCountReal -= 1;
					species.spawnCountReal = Math.max(0, species.spawnCountReal);
				}
			}
		}

		let totalOffspringCount = 0;

		for (let i = 0; i < this.species.length; ++i) {
			const species = this.species[i];

			if (species.spawnCount <= 0) {
				species.eliteSize = 0;
				continue;
			}

			const eliteSizeReal = species.genomes.length * this.params.speciesEliteProportion.value;
			let eliteSize = Math.min(Helper.stochasticRound(eliteSizeReal), species.spawnCount);

			// Ensures that the best genome is passed to the next generation
			if (i === this.bestSpeciesIndex && eliteSize <= 0) {
				eliteSize = 1;
			}

			species.eliteSize = eliteSize;
			species.offspringCount = species.spawnCount - eliteSize;

			totalOffspringCount += species.offspringCount;

			// Computes asexual and sexual reproduction count, as well as the number of fittest genomes that will be used as parents
			species.computeOffspringStats(this.params.offspringAsexualProportion.value, this.params.fittestParentsCutoffProportion.value);
		}

		return totalOffspringCount;
	}

	/**
	 * Creates offsprings for all species.
	 * Note that computeSpeciesStats must be called before this method.
	 *
	 * @private
	 * @returns {Genome[]}
	 * @memberof Community
	 */
	public createOffspring(): Genome[] {
		const offspring = new Array<Genome>();

		let totalAsexual = 0;
		let totalSexual = 0;
		let totalElite = 0;

		for (const species of this.species) {
			totalAsexual += species.asexualReproductionCount;
			totalSexual += species.sexualReproductionCount;
			totalElite += species.eliteSize;

			if (species.offspringCount <= 0) {
				continue;
			}

			// First, we setup the probabilities array that will be used for getting the parents for asexual & sexual reproduction
			const probs = new Array<number>(species.genomes.length);
			let nonZeroFitness = 0;

			for (let i = 0; i < species.genomes.length; ++i) {
				probs[i] = species.genomes[i].fitness;

				if (probs[i] !== 0) {
					nonZeroFitness += 1;
				}
			}

			// If everyone has a zero probability of being selected...
			if (nonZeroFitness <= 0) {
				// Makes it so everyone has an equal probability of being selected
				for (let i = 0; i < species.genomes.length; ++i) {
					probs[i] = 1;
				}
			}

			// Then, we do asexual reproduction
			if (species.asexualReproductionCount > 0) {
				const probArray = new ProbabilityArray(probs);

				for (let i = 0; i < species.asexualReproductionCount; ++i) {
					const index = probArray.randomlySelect();
					offspring.push(species.genomes[index].createOffspring(this.params));
				}
			}

			// Now, we do sexual reproduction (if sexualReproductionCount > 0)
			if (species.sexualReproductionCount > 0 && species.fittestParentsCutoff <= species.genomes.length) {
				// We can reuse the probs array since having normalized the probabilities will make no difference
				const parentsProbs = probs.splice(0, species.fittestParentsCutoff);

				for (let i = 0; i < species.sexualReproductionCount; ++i) {
					// Copies parentsProbs and initializes a new ProbabilityArray from that copy.
					// The copy avoids emptying out the parents array accidentally.
					// This also ensures that the indexes match 1:1 to our species' genomes.
					const parentsProbsArray = new ProbabilityArray(parentsProbs.slice());

					// Picks parent 1
					const parent1Index = parentsProbsArray.randomlySelect();

					// If there is another parent...
					if (parentsProbsArray.length() > 1) {
						// Removes the first parent so that it is not considered again
						parentsProbsArray.removeAt(parent1Index);
						const parent2Index = parentsProbsArray.randomlySelect();

						const child = this.crossover(species.genomes[parent1Index], species.genomes[parent2Index]);
						offspring.push(child);
					}
					else {
						// There is only one parent, so we fallback so asexual reproduction
						offspring.push(species.genomes[parent1Index].createOffspring(this.params));
					}
				}
			}
		}

		console.log(`Offspring Report. Asexual: ${totalAsexual}, Sexual: ${totalSexual} and Elite: ${totalElite}.`);

		return offspring;
	}

	public trimSpeciesBackToElite(): boolean {
		let foundEmptySpecies = false;
		let foundBestGenomeNextGen = false;

		for (const species of this.species) {
			console.assert(species.eliteSize <= species.spawnCount && species.eliteSize <= species.genomes.length, "Some of the elite genomes for this species do not exist!");

			if (species.eliteSize <= 0 || species.spawnCount <= 0) {
				species.genomes = [];
				foundEmptySpecies = true;
				continue;
			}

			species.genomes = species.genomes.splice(0, species.eliteSize);

			if (!!this.bestGenome && species.genomes[0].id === this.bestGenome!.id) {
				foundBestGenomeNextGen = true;
			}
		}

		console.assert(foundBestGenomeNextGen, "The best genome has not been passed to the next generation as elite.");

		return foundEmptySpecies;
	}

	/**
	 * Sets the genomes array to be the genomes present at our species.
	 *
	 * @private
	 * @memberof Community
	 */
	public updateGenomesArray() {
		this.genomes = [];

		for (const species of this.species) {
			this.genomes.push(...species.genomes);
		}
	}

	public sortEachSpecies() {
		for (const species of this.species) {
			species.sortGenomes();
		}
	}

	/**
	 * Updates bestGenome and bestSpeciesIndex.
	 *
	 * @private
	 * @memberof Community
	 */
	public updateBestGenome() {
		if (this.generationCounter <= 0) {
			console.warn("Tried to call update best genome before epoch!");
			return;
		}

		if (this.generationCounter - 1 >= this.bestFitnesses.length) {
			this.bestFitnesses.push(-1);
		}

		this.bestGenome = undefined;
		this.bestFitnesses[this.generationCounter - 1] = -1;

		for (let i = 0; i < this.species.length; ++i) {
			// Best genome from specices
			const genome = this.species[i].genomes[0];

			if (genome.fitness > this.bestFitnesses[this.generationCounter - 1]) {
				this.bestFitnesses[this.generationCounter - 1] = genome.fitness;
				this.bestGenome = genome;
				this.bestSpeciesIndex = i;
			}
		}
	}
}