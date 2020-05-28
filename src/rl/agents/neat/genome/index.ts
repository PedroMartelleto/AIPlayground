import Individual from '../../individual';
import Community from '../community';
import LinkGene from './linkGene';
import NeuralNetwork from '../neuralNetworks';
import NeuronGene from './neuronGene';
import Species from '../species';
import { saveAs } from "file-saver";
import GenomeMutator from './genomeMutator';
import NEATParams from '../params';
import Helper from '../utils/helper';

type Int = number;

/**
 * A NEAT Genome.
 * @param community
 */
export default class Genome extends Individual {
    public static fromCommunity(community: Community) : Genome {
        ++community.maxGenomeID;

        const newGenome = new Genome(community.inputCount, community.outputCount, community.maxGenomeID);
        newGenome.community = community;

        return newGenome;
    }

    public static fromJSON(json: string) : Genome {
        const parsed = JSON.parse(json);
        const newGenome = new Genome(JSON.parse(parsed.inputCount), JSON.parse(parsed.outputCount), JSON.parse(parsed.id));
        
        newGenome.neuronGenes = JSON.parse(parsed.neuronGenes);
        newGenome.inputNeuronGenes = JSON.parse(parsed.inputNeuronGenes);
        newGenome.linkGenes = JSON.parse(parsed.linkGenes);
        newGenome.adjustedFitness = JSON.parse(parsed.adjustedFitness);
        newGenome.maxNeuronID = JSON.parse(parsed.maxNeuronID);

        return newGenome;
    }

    public community?: Community;
    public species?: Species;
    public readonly id: Int;
    public readonly inputCount: Int;
    public readonly outputCount: Int;

    public neuronGenes: NeuronGene[] = [];
    public inputNeuronGenes: NeuronGene[] = [];
    public linkGenes: LinkGene[] = [];
    public phenotype: NeuralNetwork | undefined = undefined;
    public adjustedFitness = 0; // Fitness when genome is inside a species
    public maxNeuronID: Int = 0; // Biggest neuron ID currently

    constructor(inputCount: number, outputCount: number, id: number) {
        super();
        
        this.id = id;
        this.inputCount = inputCount;
        this.outputCount = outputCount;
    }

    public toJSON() : string {
        return JSON.stringify({
            id: JSON.stringify(this.id),
            inputCount: JSON.stringify(this.inputCount),
            outputCount: JSON.stringify(this.outputCount),
            neuronGenes: JSON.stringify(this.neuronGenes),
            inputNeuronGenes: JSON.stringify(this.inputNeuronGenes),
            linkGenes: JSON.stringify(this.linkGenes),
            adjustedFitness: JSON.stringify(this.adjustedFitness),
            maxNeuronID: JSON.stringify(this.maxNeuronID),
        });
    }

    public saveWithName(name: string) {
        const blob = new Blob([ this.toJSON() ], { type: "text/plain;charset=utf-8" });
		saveAs(blob, name);
    }

    /**
     * Creates a phenotype based on this genome
     * Returns this.phenotype
     * @return
     */
    public createPhenotype(): NeuralNetwork {
        this.phenotype = new NeuralNetwork(this);
        return this.phenotype;
    }

    /**
     * Sorts this genome's neurons in crescent id order and links in crescent innovation number order.
     * Useful for crossover operations.
     * @return
     */
    public sortGenes(): void {
        this.neuronGenes.sort((a, b) => {
            return a.id - b.id;
        });

        this.linkGenes.sort((a, b) => {
            return a.innovation!.n - b.innovation!.n;
        });
    }

    /**
     * Calculates the compatibility distance between this and another genome.
     * See http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf section 3.3.
     * @param  other
     * @param  excessGenesCoefficient (c1)
     * @param  disjointGenesCoefficient (c2)
     * @param  weightsCoefficient (c3)
     * @return
     */
    public compatibilityDistance(other: Genome, params: NEATParams) {
        if (this.id === other.id) {
            return 0;
        }
        
        const recA = this.community!.alignAlleleGenes(this, other);

        let N = Math.max(this.linkGenes.length, other.linkGenes.length); // Number of genes of the larger genome

        if (N <= 0) {
            console.warn("Tried to calculate the compatibility distance of two genomes with no linkGenes");
        }

        let W = 0; // Average weight difference of matching genes, including disabled genes

        for (let i = 0; i < recA.matchingGenesA.length; ++i) {
            W += Math.abs(recA.matchingGenesA[i].weight - recA.matchingGenesB[i].weight);
        }

        W /= recA.matchingGenesA.length;

        return params.excessGenesCoefficient.value / N * (recA.excessGenesA.length + recA.excessGenesB.length) +
               params.disjointGenesCoefficient.value / N * (recA.disjointGenesA.length + recA.disjointGenesB.length) +
               params.weightsCoefficient.value * W;
    }

    /**
     * Initializes a minimal fully connected input layer and output layer genome
     * @return this
     */
    public initMinimalGenome() : Genome {
        // We use these variables to calculate the splitX value. Only for display purposes.
        const inputSplitXOffset = 0.5/this.community!.inputCount;
        const outputSplitXOffset = 0.5/this.community!.outputCount;

        this.inputNeuronGenes = [];
        this.neuronGenes = [];
        this.maxNeuronID = 0;

        for (let i = 0; i < this.community!.inputCount; ++i) {
            ++this.maxNeuronID;
            this.inputNeuronGenes.push(new NeuronGene(this.maxNeuronID, 'input', (i+1)/this.community!.inputCount - inputSplitXOffset, 1));
            this.neuronGenes.push(this.inputNeuronGenes[i]);
        }

        for (let i = 0; i < this.community!.outputCount; ++i) {
            ++this.maxNeuronID;
            this.neuronGenes.push(new NeuronGene(this.maxNeuronID, 'output', (i+1)/this.community!.outputCount - outputSplitXOffset, 0));
        }

        for (let i = 0; i < this.community!.inputCount; ++i) {
            for (let j = 0; j < this.community!.outputCount; ++j) {
                if (Math.random() < this.community!.params.probOfMakingLinkInInitialGenome.value) {
                    this.community!.addLinkToGenome(this, this.neuronGenes[i], this.neuronGenes[j + this.community!.inputCount], Math.random() * 2 - 1, true);
                }
            }
        }

        // If we have no links in our genome...
        // Pick a random one and add to it
        if (this.linkGenes.length <= 0) {
            const i = Helper.randomInt(0, this.community!.inputCount - 1);
            const j = Helper.randomInt(0, this.community!.outputCount - 1);
            this.community!.addLinkToGenome(this, this.neuronGenes[i], this.neuronGenes[j + this.community!.inputCount], Math.random() * 2 - 1, true);
        }

        return this;
    }

    /**
     * If another link with inNeuron and outNeuron given exists, returns true
     * @param  inNeuron
     * @param  outNeuron
     * @return
     */
    public isDuplicateLink(inNeuronID: Int, outNeuronID: Int) : boolean {
        for (const link of this.linkGenes) {
            if (link.inNeuron.id === inNeuronID && link.outNeuron.id === outNeuronID) {
                return true;
            }
        }

        return false;
    }

    /**
     * Given a neuron id, returns its index at this genome's neurons array.
     * Returns -1 if a neuron with the given ID was not found.
     * @param  neuronID
     * @return
     */
    public getNeuronIndexByID(neuronID: Int) : Int {
        for (let i = 0; i < this.neuronGenes.length; ++i) {
            if (this.neuronGenes[i].id === neuronID) {
                return i;
            }
        }

        console.warn("Tried to get neuron passing an invalid neuronID " + neuronID + " in genome " + this.id);

        return -1;
    }

    /**
     * Returns neuron with the given ID
     * @return
     */
    public getNeuronByID(neuronID: Int, warning?: boolean) : NeuronGene | undefined {
        for (const gene of this.neuronGenes) {
            if (gene.id === neuronID) {
                return gene;
            }
        }

        if (warning) {
            console.warn("Tried to get neuron passing an invalid neuronID " + neuronID + " in genome " + this.id);
        }

        return undefined;
    }

    /** Returns true if the genome has a neuron with the given ID
     * @param  neuronID
     * @return
     */
    public hasNeuronWithID(neuronID: Int) : boolean {
        for (const neuron of this.neuronGenes) {
            if (neuron.id === neuronID) {
                return true;
            }
        }

        return false;
    }

    /**
     * Iterates through this genome's links and neurons, calling onInputNeuron, onHiddenNeuron, onOutputNeuron when appropriate.
     * Return true in any of passed functions to break the current loop in the iterate function.
     * @param  onInputNeuron   Return true to stop iterating through the input neurons
     * @param  onHiddenNeuron  Return true to stop iterating through the hidden neurons
     * @param  onOutputNeuron  Return true to stop iterating through the output neurons
     * @return
     */
    public iterate(onInputNeuron: (inputNeuron: NeuronGene, inputOutLinks: LinkGene[], i: Int) => boolean,
            onHiddenNeuron: (hiddenNeuron: NeuronGene, hiddenOutLinks: LinkGene[], i: Int) => boolean,
            onOutputNeuron: (outputNeuron: NeuronGene, i: Int) => boolean) : void {
        let allLinks: LinkGene[] = [];

        // Input neurons
        for (let i = 0; i < this.inputNeuronGenes.length; ++i) {
            const inputOutLinks = this.getNonLoopedLinksWithSource(this.inputNeuronGenes[i]);
            Array.prototype.push.apply(allLinks, inputOutLinks);
            if (onInputNeuron(this.inputNeuronGenes[i], inputOutLinks, i)) {
                break;
            }
        }

        whileLoop: while (allLinks.length > 0) {
            const newAllLinks: LinkGene[] = [];

            for (let i = 0; i < allLinks.length; ++i) {
                const hiddenOutLinks = this.getNonLoopedLinksWithSource(allLinks[i].outNeuron);
                Array.prototype.push.apply(newAllLinks, hiddenOutLinks);

                if (hiddenOutLinks.length > 0) {
                    if (onHiddenNeuron(allLinks[i].outNeuron, hiddenOutLinks, i)) {
                        break whileLoop;
                    }
                }
                // else outNeuron is actually an output neuron (or a disjoint hidden neuron)
            }

            allLinks = newAllLinks;
        }

        for (let i = 0; i < this.neuronGenes.length; ++i) {
            if (this.neuronGenes[i].type === 'output') {
                if (onOutputNeuron(this.neuronGenes[i], i)) {
                    break;
                }
            }
        }
    }

    /**
     * Checks if the genome has a structure that will loop forever when trying to feed forward the phenotype
     * @return
     */
    public hasLoop() : boolean {
        const recordedNeuronsID: Int[] = [];
        let foundLoop = false;

        this.iterate(
            (inputNeuron: NeuronGene, outLinks: LinkGene[], index: Int) : boolean => {
                return false;
            },
            (hiddenNeuron: NeuronGene, outLinks: LinkGene[], index: Int) : boolean => {
                recordedNeuronsID.push(hiddenNeuron.id);

                for (const outLink of outLinks) {
                    if (recordedNeuronsID.indexOf(outLink.outNeuron.id) >= 0) {
                        foundLoop = true;
                        return true;
                    }
                }

                return false;
            },
            (outputNeuron: NeuronGene, index: Int) : boolean => {
                return false;
            }
        );

        return foundLoop;
    }

    /**
     * Checks if a link is going to create a loop in this genome. See the hasLoop function.
     * @param  inNeuron
     * @param  outNeuron
     * @return
     */
    public isLinkPotentialLoop(inNeuron: NeuronGene, outNeuron: NeuronGene) : boolean {
        // Add link temporally
        this.linkGenes.push(new LinkGene(inNeuron, outNeuron, 1, true, undefined));
        const hasLoop = this.hasLoop();
        // Remove the temporary link
        this.linkGenes.pop();

        return hasLoop;
    }

    /**
     * Returns the id of all destination neurons of all links that have one of the neurons ids passed as a source
     * @param  srcNeuronsIDs
     * @return
     */
    public getNonLoopedOutIDsFromInIDs(srcNeuronsIDs: Int[]): Int[] {
        const destsIDs = new Array<Int>();

        for (const link of this.linkGenes) {
            for (const srcID of srcNeuronsIDs) {
                if (link.inNeuron.id === srcID && (link.inNeuron.id !== link.outNeuron.id)) {
                    destsIDs.push(link.outNeuron.id);
                }
            }
        }

        return destsIDs;
    }

    /**
     * Returns all links with source equal to the given NeuronGene
     * @param  src
     * @return
     */
    public getNonLoopedLinksWithSource(src: NeuronGene): LinkGene[] {
        const linksWithSrc = new Array<LinkGene>();

        for (const linkGene of this.linkGenes) {
            if (linkGene.inNeuron.id === src.id && (linkGene.inNeuron.id !== linkGene.outNeuron.id)) {
                linksWithSrc.push(linkGene);
            }
        }

        return linksWithSrc;
    }

    public createOffspring(params: NEATParams): Genome {
        const offspring = this.clone();

        GenomeMutator.mutate(offspring, params);

        return offspring;
    }

    /**
     * Clones a genome and generates a new ID for it.
     *
     * @param {Genome} genome
     * @returns
     */
    public clone(): Genome {
        const newGenome = Genome.fromCommunity(this.community!); // When we do this, a new ID is automatically generated for us

        newGenome.phenotype = undefined;
        newGenome.fitness = this.fitness;
        newGenome.adjustedFitness = this.adjustedFitness;
        newGenome.species = this.species;
        newGenome.maxNeuronID = this.maxNeuronID;

        // Copies each link and neuron from the old genome into the new one
        for (const link of this.linkGenes) {
            newGenome.copyLinkAndNeuronsToGenome(link);
        }

        return newGenome;
    }

    /**
     * Same as copyLinkAndNeuronsToGenome, except with a X% (defaults to 75) of disabling the link if maybeDisable is set to true.
     * This method is called during crossover, and maybeDisable is set to true if either parent has that link gene disabled.
     * @param  genome
     * @param  linkGene
     * @param  maybeDisable
     * @param  disableChance
     * @return
     */
    public copyLinkAndNeuronsToGenomeAndMaybeDisable(linkGene: LinkGene, maybeDisable: boolean, disableChance: number): void {
        // Note: If the fittest parent doesn't have loops (as it should never have), then its children won't have loops either, so we don't need to call isLinkPotentialLoop on linkGene before pushing
        const inNeuron = this.copyNeuronToGenome(linkGene.inNeuron!);
        const outNeuron = this.copyNeuronToGenome(linkGene.outNeuron!);

        let isEnabled = true;

        if (maybeDisable && Math.random() < disableChance) {
            isEnabled = false;
        }

        // Innovations should never be altered, so we pass it by reference
        this.linkGenes.push(new LinkGene(inNeuron, outNeuron, linkGene.weight, isEnabled, linkGene.innovation));
    }

    /**
     * If the passed link will make a loop, we cancel the operation.
     * Copies linkGene's inNeuron and outNeuron to genome if they don't already exist in it.
     * Proceeds to copying the linkGene to genome (the passed link must not exist!).
     * @param  genome
     * @param  linkGene
     * @return
     */
    public copyLinkAndNeuronsToGenome(linkGene: LinkGene): void {
        // Note: If the fittest parent doesn't have loops (as it should never have), then its children won't have loops either, so we don't need to call isLinkPotentialLoop on linkGene before pushing
        const inNeuron = this.copyNeuronToGenome(linkGene.inNeuron!);
        const outNeuron = this.copyNeuronToGenome(linkGene.outNeuron!);
        // Innovations should never be altered, so we pass it by reference
        this.linkGenes.push(new LinkGene(inNeuron, outNeuron, linkGene.weight, linkGene.isEnabled, linkGene.innovation));
    }

    /**
     * Copies neuron to genome if that neuron does not already exist in it.
     * @param  genome
     * @param  neuron
     * @return
     */
    private copyNeuronToGenome(neuron: NeuronGene) : NeuronGene {
        let newNeuron = this.getNeuronByID(neuron.id, false);

        if (!!newNeuron) {
            return newNeuron;
        }

        newNeuron = neuron.clone();

        if (!!neuron.loopedLink) {
            const newLoopedLink = neuron.loopedLink.clone(newNeuron, newNeuron);
            newNeuron.loopedLink = newLoopedLink;
        }

        this.neuronGenes.push(newNeuron);

        if (newNeuron.type === 'input') {
            this.inputNeuronGenes.push(newNeuron);
        }

        return newNeuron;
    }
}
