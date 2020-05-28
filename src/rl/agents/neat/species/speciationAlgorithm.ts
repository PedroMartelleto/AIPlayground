import Genome from "../genome";
import Species from "./index";

export default abstract class SpeciationAlgorithm {
    protected species: Species[] = [];

    /**
     * Initializes speciation for a certain genome population.
     *
     * @abstract
     * @param {Genome[]} genomes
     * @param {number} speciesCount
     * @memberof SpeciationAlgorithm
     */
    public abstract init(genomes: Genome[], speciesCount: number): void;
    
    /**
     * Respeciates all genomes.
     * 
     * @abstract
     * @param {Genome[]} genomes
     * @param {Genome[]} offspring
     * @memberof SpeciationAlgorithm
     */
    public abstract respeciateAll(genomes: Genome[], offspring: Genome[]): void;

    /**
     * Integrates new genomes into existing species.
     *
     * @abstract
     * @param {Genome[]} genomes
     * @param {Genome[]} offspring
     * @memberof SpeciationAlgorithm
     */
    public abstract integrateNewGenomes(genomes: Genome[], offspring: Genome[]): void;

    public get result() {
        return this.species;
    }
}