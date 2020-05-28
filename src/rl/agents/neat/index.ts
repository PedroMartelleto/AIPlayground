import Draw, { ILinkDrawData, INeuronDrawData } from '../../../draw';
import DrawLog from '../../../draw/log';
import EnvironmentModel from '../../envs/environmentModel';
import AgentModel from '../agentModel';
import Individual from '../individual';
import Community from './community';
import Genome from './genome';
import NeuralNetwork from './neuralNetworks';
import NEATParams from './params';
import UncannyValleySpeciationAlgorithm from './species/uncannyValleySpeciationAlgorithm';

interface INetworkDrawData {
	neurons: INeuronDrawData[];
	links: ILinkDrawData[];
}

export default class NEATAgent extends AgentModel {
	private params: NEATParams = new NEATParams();
	private community?: Community;
	private phenotype?: NeuralNetwork = undefined;
	private currentGenome?: Genome = undefined;
	private shouldStop = false;

	private savedGenomeCount = 0;

	private latexFormula: string[] = [];

	// Used for rendering purposes
	private popDrawIndex: number = 0;
	private popDrawData: INetworkDrawData[] = [];

	public constructor(env: EnvironmentModel) {
		super('neat', env);

		DrawLog.printToConsole = true;

		this.addParamsFromObject(this.params);

		this.resetState();
	}

	public resetState() {
		const speciationAlgorithm = new UncannyValleySpeciationAlgorithm(this.params);
		
		this.community = new Community(this.params, this.env.obsCount(), this.env.actionsCount(), speciationAlgorithm);
		this.community.init();

		this.phenotype = undefined;
		this.currentGenome = undefined;

		this.populationData();
	}

	public prepareForIndividual(individual: Individual) {
		if (!!this.env!.saveRequestedName) {
			this.currentGenome!.saveWithName(this.env!.saveRequestedName);
			this.env!.saveRequestedName = undefined;
		}

		if (!!this.env && this.env!.hasReachedGoal) {
			this.goalReached();
			return;
		}

		if (!individual) {
			console.warn("Tried preparing for null individual!");
			return;
		}

		const genome = individual as Genome;
		this.currentGenome = genome;
		this.phenotype = genome.createPhenotype();

		// this.latexFormula = this.phenotype.generateFormula(this.env.obsFormulaNames(), 2);

		++this.popDrawIndex;
	}

	public goalReached() {
		console.log("Fitness Goal Reached. Ending algorithm...");

		if (!!this.currentGenome) {
			this.currentGenome!.saveWithName("best.genome");
		}

		this.shouldStop = true;
	}

	public act() {
		if (!this.phenotype) {
			return;
		}

		let index = 0;
		const outputs = this.phenotype!.activate(this.env.obsValues());
		
		for (const s of this.env.actions) {
			let val = 0;

			if (outputs[index] >= 0) {
				val = 1;
			} else {
				val = 0;
			}

			s.value = val;
						
			++index;
		}
	} 

	public draw(context: CanvasRenderingContext2D) {
		Draw.context = context;
		Draw.clear();

		if (!this.community) {
			return;
		}

		DrawLog.render(context); // Draws logs
		
		Draw.setTranslation(0, 0);

		Draw.normX = Draw.normY = true;
		Draw.normWidth = Draw.normHeight = true;

		Draw.text(-0.98, 0.94, 'Gen ' + (this.community.generationCount + 1), '300 18px sans-serif', 'black', 'left');

		if (!!this.community.bestGenome) {
			Draw.text(-0.68, 0.94, 'Best: ' + Math.round(this.community.bestGenome.fitness * 100) / 100, 'Arial', 'black');
		}

		if (this.community.bestFitnesses.length > 0) {
			const bestFitness = this.community.bestFitnesses[this.community.generationCount - 1];
			Draw.text(0, 0.94, 'Gen Best: ' + Math.round(bestFitness * 100) / 100, 'Arial', 'black');
		}

		if (this.popDrawIndex >= 0) {
			Draw.text(-0.98, 0.85, 'Fitness: ' + Math.round(this.env.fitness() * 100) / 100, 'Arial', 'green', 'left');
		}

		if (this.popDrawIndex >= 0) {
			Draw.text(0, 0.85, 'Species: ' + this.community.species.length, 'Arial', 'black', 'left');
		}

		if (this.popDrawIndex >= 0) {
			Draw.normX = Draw.normY = true;
			Draw.normWidth = Draw.normHeight = true;

			if (!!this.popDrawData && !!this.popDrawData[this.popDrawIndex] && !!this.popDrawData[this.popDrawIndex].neurons && !!this.phenotype) {
				Draw.neuralNetwork(0, 0.1, 0.3, 0.5, 0.003, this.popDrawData[this.popDrawIndex].neurons, this.popDrawData[this.popDrawIndex].links, this.phenotype);
			}

			// Draws genotype
			Draw.normX = Draw.normY = false;
			Draw.text(-Draw.width()/2 + 64, -Draw.height()/3.2, 'Genotype:', '300 21px sans-serif', 'black');
			Draw.genome(-Draw.width()/2 + 64, -Draw.height()/2.9, this.currentGenome!);
			Draw.normX = Draw.normY = true;

			// Draws phenotype label
			Draw.normX = false;
			Draw.text(-Draw.width()/2 + 64, 0.34, 'Phenotype:', '300 21px sans-serif', 'black');
			Draw.normX = true;
			
			/*
			// Draws all latex formulas
			let yOffset = 0;
			for (const formula of this.latexFormula) {
				yOffset += 0.05;
				Draw.text(0, -0.34 - yOffset, formula, '300 19px sans-serif', 'black');
			}
			*/

			/*const width = 1 / this.popDrawData.length;
			
			for (let i = 0; i < this.community.genomes.length; ++i) {
				if (i === this.popDrawIndex) {
					continue;
				}

				Draw.neuralNetwork((i*width - 0.5) * 2 + width, -0.7, 0.125, 0.125, 0.008, this.popDrawData[i].neurons, this.popDrawData[i].links, undefined);

				if (i < this.popDrawIndex) {
					Draw.normX = false;
					const baseX = (i*width - 0.5) * Draw.width();
					Draw.text(baseX + 40, 0.87, String(Math.round(this.community.genomes[i].fitness * 100) / 100), '12px Arial', 'green');
					Draw.normX = true;
				}
			}*/
		}
	}

	public loop(delta: number) {
		if (this.shouldStop) {
			return;
		}

		if (this.env.hasReachedGoal) {
			this.goalReached();
			return;
		}
		
		super.lifecycle(delta, !!this.community ? this.community.genomes : []);
	}

	public epoch() {
		if (!this.community) {
			return;
		}

		this.community.epoch();
		
		if (!!this.community.bestGenome && this.savedGenomeCount < this.community.generationCount) {
			this.community.bestGenome.saveWithName("gen" + (this.community.generationCount) + ".genome");
			this.savedGenomeCount += 1;
		}

		console.log("Best fitnesses: ", this.community.bestFitnesses);
		console.log("Mean fitnesses: ", this.community.meanFitnesses);

		this.populationData();
	}

	/**
	 * Updates the data used for drawing the neurons and genomes.
	 */
	private populationData() {
		if (!this.community) {
			return;
		}

		this.popDrawIndex = -1;
		this.popDrawData = [];

		for (const genome of this.community.genomes) {
			const linksData = genome.linkGenes.map((link) => {
				return { inIndex: genome.getNeuronIndexByID(link.inNeuron.id), outIndex: genome.getNeuronIndexByID(link.outNeuron.id), isEnabled: false };
			});

			const neuronsData = genome.neuronGenes.map((neuron) => {
				return { splitX: neuron.splitX, splitY: neuron.splitY, type: neuron.type, id: neuron.id };
			});

			const nnData = { links: linksData, neurons: neuronsData };
			this.popDrawData.push(nnData);
		}
	}
}
