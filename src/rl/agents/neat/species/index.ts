import Community from '../community';
import Genome from '../genome';
import Helper from '../utils/helper';
import NEATParams from '../params';

type Int = number;

/**
 * A Species is a group of similar genomes
 * See http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf section 3.3 for more details
 * @param       {Genome} leader
 * @constructor
 */
export default class Species {
	public readonly community: Community;
	public readonly id: Int;

	public gensStagnated: Int = 0;		 // Number of generations without improvement
	public meanAdjustedFitness: Int = 0; // Average adjusted fitness of members
	
	public spawnCount: Int = 0;    		      // eliteSize + offspringCount
	public spawnCountReal: number = 0;   	  // The unrounded spawn count for this species
	public eliteSize: Int = 0;      		  // Number of elite genomes that will be kept for the next generation
	public offspringCount: Int = 0;   	      // Number of offsprings this species will produce
	public asexualReproductionCount: Int = 0; // Number of offspring generated from the same parent.
	public sexualReproductionCount: Int = 0;  // Number of offspring generated from two different parents
	public fittestParentsCutoff: Int = 0; 	  // Number of the fittest genomes that will be selected as parents 

	public leader: Genome;
	public genomes: Genome[] = [];

	constructor(community: Community, firstGenome: Genome) {
		this.community = community;
		++community.maxSpeciesID;
		this.id = community.maxSpeciesID;

		this.leader = firstGenome;
		this.genomes.push(this.leader);
	}

	/**
	 * Ensure offspringCount has already been calculated before calling.
	 * Computes asexual and sexual reproduction count, as well as the number of fittest genomes that will be used as parents.
	 * 
	 * @memberof Species
	 */
	public computeOffspringStats(offspringAsexualProportion: number, fittestParentsCutoffProportion: number) {
		if (this.offspringCount <= 0) {
			this.asexualReproductionCount = 0;
			this.sexualReproductionCount = 0;
			this.fittestParentsCutoff = 0;
			return;
		}
		
		const offspringAsexualCountReal = this.offspringCount * offspringAsexualProportion;
		this.asexualReproductionCount = Helper.stochasticRound(offspringAsexualCountReal);
		this.sexualReproductionCount = this.offspringCount - this.asexualReproductionCount;

		const fittestParentsCutoffReal = this.genomes.length * fittestParentsCutoffProportion;
		this.fittestParentsCutoff = Math.min(Math.max(2, Helper.stochasticRound(fittestParentsCutoffReal)), this.genomes.length);

		// If there is only one parent, we fallback to asexual reproduction
		if (this.fittestParentsCutoff === 1) {
			this.asexualReproductionCount += this.sexualReproductionCount;
			this.sexualReproductionCount = 0;
		}
	}

    /**
     * Must be called after computeAdjustedFitnesses.
     * Computes the spawn count of each individual and the total for the species.
     * @return
     */
	public computeSpawnCount(totalMeanFitness: number) {
		// If the total mean fitness is zero, we spawn the same number of genomes for each species.
		this.spawnCountReal = totalMeanFitness === 0 ? this.community.genomes.length / this.community.species.length
													 : (this.meanAdjustedFitness / totalMeanFitness) * this.community.genomes.length;

		this.spawnCount = Helper.stochasticRound(this.spawnCountReal);
	}

    /**
     * Calculates adjustedFitness value for each member genome, as well as the meanAdjustedFitness.
     * @param  params
     * @param  threshold  Affects how the adjusted fitness relates to the compatibility distance. Passed to the sh method.
     * @return
     */
	public computeAdjustedFitnesses(params: NEATParams) {
		let mean = 0;

		for (const mom of this.genomes) {
			let sharing = 0;

			for (const dad of this.genomes) {
				sharing += sh(mom.compatibilityDistance(dad, params), params.shThreshold.value);
			}

			if (sharing <= 0) {
				console.warn("Found a species with a genome that has zero sharing.");
			}

			mom.adjustedFitness = mom.fitness / sharing;
			mean += mom.adjustedFitness;
		}

		mean /= this.genomes.length;
		this.meanAdjustedFitness = mean;
	}

	/**
	 * Sorts member genomes in decrescent raw fitness order
	 * @return
	 */
	public sortGenomes() {
		this.genomes.sort((a, b) => {
			return b.fitness - a.fitness;
		});
	}
}

/**
 * Sharing function as described in the NEAT paper
 * @param  compatibilityDistance
 * @param  threshold
 * @return
 */
function sh(compatibilityDistance: number, threshold: number): Int {
	return compatibilityDistance > threshold ? 0 : 1;
}
