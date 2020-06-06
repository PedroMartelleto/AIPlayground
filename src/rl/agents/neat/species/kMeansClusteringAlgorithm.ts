import SpeciationAlgorithm from "./speciationAlgorithm";
import Genome from "../genome";

export default class KMeansClusteringAlgorithm extends SpeciationAlgorithm {
    constructor() {
        super();
    }
    
    public init(genomes: Genome[], speciesCount: number) {
    }
    
    public respeciateAll(genomes: Genome[], offspring: Genome[]) {
    }

    public integrateNewGenomes(genomes: Genome[], offspring: Genome[]) {
    }
}