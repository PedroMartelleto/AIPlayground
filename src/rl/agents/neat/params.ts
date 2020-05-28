import Scalar from '../../scalar';

export default class NEATParams {
    public readonly showLog = new Scalar('Universal', 'Show errors', 1).wholeNumber().ranged(0, 1);

    public readonly initialGenomeCount = new Scalar('Universal', 'Initial genome count', 180).wholeNumber().ranged(1, 2000);
    public readonly initialSpeciesCount = new Scalar('Universal', 'Initial species count', 40).wholeNumber().ranged(1, 2000);


    // Epoch Params

    /**
     * For each possible link for the initial genome, the probability of making the connection.
     *
     * @memberof NEATParams
     */
    public readonly probOfMakingLinkInInitialGenome = new Scalar('Epoch', 'Probability of Making Each Link In Initial Genome', 0.25).ranged(0.0001, 1);

    /**
     * sh c1 linear coefficient (see compatibility distance function)
     */
	public readonly excessGenesCoefficient = new Scalar('Epoch', 'Sharing excess coefficient (C1)', 1).ranged(0.0001, 10);

    /**
     * sh c2 linear coefficient (see compatibility distance function)
     */
    public readonly disjointGenesCoefficient = new Scalar('Epoch', 'Sharing disjoint coefficient (C2)', 1).ranged(0.0001, 10);

    /**
     * c3 linear coefficient (see compatibility distance function)
     */
    public readonly weightsCoefficient = new Scalar('Epoch', 'Sharing weights coefficient (C3)', 0.4).ranged(0.0001, 10);

    /**
     * sh threshold
     */
    public readonly shThreshold = new Scalar('Epoch', "Sharing threshold", 3).ranged(0.0001, 10);

    /**
     * Chance of an offspring to be generated from two different species.
     * TODO: Implement this
     */
    public readonly interspeciesMatingRate = new Scalar('Epoch', "Interspecies mating rate", 0.0).ranged(0.00001, 1);

    
    /**
     * Chance of a link being disabled in the offspring if it was disabled in either parent.
     */
    public readonly offspringLinkDisableRate = new Scalar('Epoch', "Sharing threshold", 0.75).ranged(0.0001, 1);
    
    /**
     * Minimum compatibility distance for a genome to have with the representative genome of a species in order to add such genome to the species
     */
    public readonly minSpeciesCompatibilityDistance = new Scalar('Epoch', 'Min species compatibility distance', 0.2).ranged(0.0001, 3);

    /**
     * If a species has been stagnated for the specified amount of generations, it will be removed
     */
    public readonly maxStagnationAllowed = new Scalar('Epoch', 'Max species stagnation', 15).wholeNumber().ranged(1, 200);

    /**
     * Proportion of top genomes that will be retained for the next generation. If set to zero, no elitism is applied.
     */
    public readonly speciesEliteProportion = new Scalar('Epoch', 'Species elite proportion', 0.1).ranged(0, 1);

    /**
     * Proportion of offspring that result from asexual reproduction.
     */
    public readonly offspringAsexualProportion = new Scalar('Epoch', 'Asexual reproduction proportion', 0.75).ranged(0, 1);

    /**
     * Proportion of parents to pick amongst the fittest genomes of a species.
     */
    public readonly fittestParentsCutoffProportion = new Scalar('Epoch', 'Parents proportion amongst fittest', 0.3).ranged(0, 1);

    // -----------------
    //  Mutation Params
    // -----------------

    public readonly maxNumberOfHiddenNeurons = new Scalar('Mutation', 'Max Number of Hidden Neurons', 40).wholeNumber().ranged(0, 500);

    /**
     * Mutation rate for a hidden neuron.
     */
    public readonly hiddenNeuronMutationRate = new Scalar('Mutation', 'Hidden Neuron Mutation Rate', 0.45).ranged(0, 1);
    public readonly linkMutationRate = new Scalar('Mutation', 'Link Mutation Rate', 0.8).ranged(0, 1);

    /**
     * At the specified chance, if the two randomly selected neurons are the same neuron, a looped recurrency will be made
     */
    public readonly linkMutationChanceOfConsideringLoopedRecurrency = new Scalar('Mutation', 'Chance of Considering Looped Recurrencies', 0).ranged(0, 1);

	public readonly weightMutationRateForEachLink = new Scalar('Mutation', 'Weight Mutation Rate For Each Link', 0.9).ranged(0, 1);
    public readonly weightMutationProbNewVal = new Scalar('Mutation', 'New Weight Value Mutation Rate', 0.1).ranged(0, 1);

    public readonly biasMutationRateForEachLink = new Scalar('Mutation', 'Bias Mutation Rate For Each Link', 0.2).ranged(0, 1);
    public readonly biasMutationProbNewVal = new Scalar('Mutation', 'New Bias Value Mutation Rate', 0.07).ranged(0, 1);

    /**
     * New range for the node value when mutating (i.e. random value in [oldValue - 0.5, oldValue + 0.5])
     */
    public readonly weightMutationMaxPertubation = new Scalar('Mutation', 'Weight Mutation Max Pertubation', 0.5).ranged(0, 1);
    public readonly weightMutationNewValRange = new Scalar('Mutation', 'New Weight Value Mutation Range', 3).ranged(0, 1);

    /**
     * New range for the node value when mutating (i.e. random value in [oldValue - 0.5, oldValue + 0.5])
     */
    public readonly biasMutationMaxPertubation = new Scalar('Mutation', 'Bias Mutation Max Pertubation', 0.5).ranged(0, 1);
    public readonly biasMutationNewValRange = new Scalar('Mutation', 'New Bias Value Mutation Range', 3).ranged(0, 1);
}
