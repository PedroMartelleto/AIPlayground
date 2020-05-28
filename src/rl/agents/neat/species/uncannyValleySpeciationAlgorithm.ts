import SpeciationAlgorithm from "./speciationAlgorithm";
import Genome from "../genome";
import Species from "./index";
import NEATParams from "../params";

export default class UncannyValleySpeciationAlgorithm extends SpeciationAlgorithm {
    public speciesCount: number = 0;

    private readonly params: NEATParams;

    constructor(params: NEATParams) {
        super();
        this.params = params;
    }
    
    public init(genomes: Genome[], speciesCount: number) {
        this.speciesCount = speciesCount;
        this.species = new Array<Species>(speciesCount);

        let assignedGenomesCount = 0;
        let speciesIndex = 0;

        while (assignedGenomesCount < genomes.length) {
            if (speciesIndex > this.species.length - 1) {
                speciesIndex = 0;
            }

            if (!this.species[speciesIndex]) {
                this.species[speciesIndex] = new Species(genomes[0].community!, genomes[assignedGenomesCount]);
            } else {
                this.species[speciesIndex].genomes.push(genomes[assignedGenomesCount]);
            }

            genomes[assignedGenomesCount].species = this.species[speciesIndex];

            assignedGenomesCount += 1;
            speciesIndex += 1;
        }
    }
    
    public respeciateAll(genomes: Genome[], offspring: Genome[]) {
        for (let i = this.species.length - 1; i >= 0; --i) {
            if (this.species[i].genomes.length <= 0) {
                this.species.splice(i, 1);
            }
        }

        this.integrateNewGenomes(genomes, offspring);
    }

    public integrateNewGenomes(genomes: Genome[], offspring: Genome[]) {
        this.updateLeaders(genomes);
        
        // newGenomes are offspring from the previous generation. As a convention, their species are set to the parents' species.
        
        const newSpeciesPool: Species[] = [];

        for (const genome of offspring) {
            if (!genome.species) {
                console.warn("Could not find parent species.");
                continue;
            }

            const isCompatibleWithParent = genome.compatibilityDistance(genome.species!.leader, this.params) < this.params.minSpeciesCompatibilityDistance.value;

            // If compatible with parent...
            if (isCompatibleWithParent) {
                // Search for non-parent species below threshold
                for (const species of this.species) {
                    if (species.id !== genome.species!.id) {
                        const isCompatible = genome.compatibilityDistance(genome.species!.leader, this.params) < this.params.minSpeciesCompatibilityDistance.value;
                        
                        if (isCompatible) {
                            genome.species = species;
                            break;
                        }
                    }
                }
                // Else just stick to the parent species
            } else {
                // If not, we either create a new species or we place the genome with the most compatible amongst the parent and the new species.
                
                if (newSpeciesPool.length + this.species.length < this.speciesCount) {
                    newSpeciesPool.push(new Species(genome.community!, genome));
                } else {
                    let minCompatDistance = Number.POSITIVE_INFINITY;
                    let closestSpecies: Species | undefined;

                    for (const species of newSpeciesPool) {
                        const compatDistance = genome.compatibilityDistance(species.leader, this.params);

                        if (compatDistance < minCompatDistance) {
                            closestSpecies = species;
                            minCompatDistance = compatDistance;
                        }
                    }

                    if (genome.compatibilityDistance(genome.species.leader, this.params) < minCompatDistance) {
                        closestSpecies = genome.species;
                    }

                    genome.species = closestSpecies;
                }
            }
        }

        this.species.push(...newSpeciesPool);
    }

    private updateLeaders(genomes: Genome[]) {
        let newLeader: Genome | undefined;
        let newLeaderCompat = 0;
        let unspeciatedCount = 0;

        // It is possible that the leader of a species was removed
        // So we search for an unspeciated genome that is closest to the previous leader
        for (const species of this.species) {
            newLeader = species.genomes[0];

            // The genome with smallest compatibility distance to the previous leader to be the new leader
            for (const genome of genomes) {
                // Checks if the old leader is at the new generation
                if (genome.id === species.leader.id) {
                    // If it is, just pick him
                    newLeader = genome;
                    break;
                }

                if (!genome.species || genome.species.id === species.id) {
                    const compat = genome.compatibilityDistance(species.leader, this.params);
                    ++unspeciatedCount;

                    if (compat < newLeaderCompat) {
                        newLeader = genome;
                        newLeaderCompat = compat;
                    }
                }
            }

            if (newLeader == null) {
                console.error("Could not find new leader for a species. Unspeciated count: " + unspeciatedCount + ", Genome count: " + genomes.length);
            }

            newLeader = newLeader!;
        }
    }
}