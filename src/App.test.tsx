import Species from "./rl/agents/neat/species";
import Community from "./rl/agents/neat/community";
import NEATParams from "./rl/agents/neat/params";
import UncannyValleySpeciationAlgorithm from "./rl/agents/neat/species/uncannyValleySpeciationAlgorithm";

describe("NEAT", () => {
	it("does crossover", () => {
		const params = new NEATParams();
		const algo = new UncannyValleySpeciationAlgorithm(params);
		const community = new Community(params, 3, 3, algo);
	
		community.init();
	
		community.genomes[1].fitness = 10;
	
		const child = community.crossover(community.genomes[0], community.genomes[1]);
	
		expect(child.linkGenes.length).toBeGreaterThan(0);
		expect(child.neuronGenes.length).toBeGreaterThan(0);
		expect(child.id).not.toEqual(community.genomes[0].id);
		expect(child.id).not.toEqual(community.genomes[1].id);
	})
	
	it("best genome is calculated and kept after epoch", () => {
		const params = new NEATParams();
		const algo = new UncannyValleySpeciationAlgorithm(params);
		const community = new Community(params, 3, 3, algo);
	
		community.init();
	
		for (const genome of community.genomes) {
			genome.fitness = 1;
		}
	
		const bestGenome = community.genomes[community.genomes.length - 1];
		bestGenome.fitness = 100;
	
		community.epoch();
		
		expect(community.bestGenome!.id).toEqual(bestGenome.id);
		expect(community.species[community.bestSpeciesIndex].genomes[0].fitness).toEqual(bestGenome.fitness);
		expect(community.species[community.bestSpeciesIndex].genomes[0].id).toEqual(bestGenome.id);
		expect(community.species[community.bestSpeciesIndex].id).toEqual(bestGenome.species!.id);
	});
	
	it("computes offspring stats", () => {
		const params = new NEATParams();
		const algo = new UncannyValleySpeciationAlgorithm(params);
		const community = new Community(params, 3, 3, algo);
	
		community.init();
	
		const species = community.species[0];
		species.offspringCount = 4;
		species.spawnCount = 6;
		species.eliteSize = 2;
	
		species.computeOffspringStats(0, 0);
		
		expect(species.sexualReproductionCount).toEqual(4);
	
		species.computeOffspringStats(1, 1);
	
		expect(species.asexualReproductionCount).toEqual(4);
	});
})