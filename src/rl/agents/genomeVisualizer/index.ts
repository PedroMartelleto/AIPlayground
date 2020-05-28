import Draw, { ILinkDrawData, INeuronDrawData } from '../../../draw';
import DrawLog from '../../../draw/log';
import EnvironmentModel from '../../envs/environmentModel';
import AgentModel from '../agentModel';
import Individual from '../individual';
import GenomeVisualizerParams from './params';
import Genome from '../neat/genome';
import NeuralNetwork from '../neat/neuralNetworks';

interface INetworkDrawData {
	neurons: INeuronDrawData[];
	links: ILinkDrawData[];
}

export default class GenomeVisualizerAgent extends AgentModel {
	private params: GenomeVisualizerParams = new GenomeVisualizerParams();
    private phenotype?: NeuralNetwork = undefined;
    private currentGenome?: Genome = undefined;
    private latexFormula?: string[] = undefined;
    private genomeNames: string[] = [];
    private genomes: Genome[] = [];

	// Used for rendering purposes
	private popDrawIndex: number = 0;
	private popDrawData: INetworkDrawData[] = [];

	public constructor(env: EnvironmentModel) {
		super("genomeVisualizer", env);

		DrawLog.printToConsole = true;

		this.addParamsFromObject(this.params);

		this.resetState();
	}

	public resetState() {
		this.currentGenome = undefined;

		this.populationData();
	}

	public prepareForIndividual(individual: Individual) {
		const genome = individual as Genome;
		this.currentGenome = genome;
        this.phenotype = genome.createPhenotype();
        this.latexFormula = this.phenotype!.generateFormula(this.env.obsFormulaNames(), 2);

		++this.popDrawIndex;
	}

	public goalReached() {
        console.log("[GENOME VISUALIZER] Goal reached!");
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

		DrawLog.render(context); // Draws logs
		
		Draw.setTranslation(0, 0);

		Draw.normX = Draw.normY = true;
		Draw.normWidth = Draw.normHeight = true;

		if (this.popDrawIndex >= 0) {
			Draw.normX = Draw.normY = true;
			Draw.normWidth = Draw.normHeight = true;

			if (!!this.popDrawData && !!this.popDrawData[this.popDrawIndex] && !!this.popDrawData[this.popDrawIndex].neurons && !!this.phenotype) {
				Draw.linkShadowBlur = 2;
				Draw.neuronShadowBlur = 7;
				Draw.neuralNetwork(0, 0.1, 0.3, 0.5, 0.003, this.popDrawData[this.popDrawIndex].neurons, this.popDrawData[this.popDrawIndex].links, this.phenotype);
			}

			// Draws genotype
			Draw.normX = Draw.normY = false;
			Draw.text(-Draw.width()/2 + 64, -Draw.height()/3.2, 'Genotype:', '300 21px sans-serif', 'black');
			Draw.genome(-Draw.width()/2 + 64, -Draw.height()/2.9, this.currentGenome!);
			Draw.normX = Draw.normY = true;

			// Draws phenotype label
			Draw.normX = false;
			Draw.text(-Draw.width()/2 + 8, 0.34, 'Phenotype (' + this.genomeNames[this.popDrawIndex] + '):', '300 21px sans-serif', 'black', 'left');
			Draw.normX = true;
			
			// Draws all latex formulas
            /*let yOffset = 0;
            if (!!this.latexFormula) {
                for (const formula of this.latexFormula) {
                    yOffset += 0.05;
                    Draw.text(0, -0.34 - yOffset, formula, '300 19px sans-serif', 'black');
                }
            }*/

			const width = 1 / this.popDrawData.length;

			Draw.linkShadowBlur = 0;
			Draw.neuronShadowBlur = 0;
			for (let i = 0; i < this.genomes.length; ++i) {
				if (i === this.popDrawIndex) {
					continue;
				}

				Draw.neuralNetwork((i*width - 0.5) * 2 + width, -0.7, 0.125, 0.18, 0.002, this.popDrawData[i].neurons, this.popDrawData[i].links, undefined);

				if (i < this.popDrawIndex) {
					Draw.normX = false;
					const baseX = (i*width - 0.5) * Draw.width();
					Draw.text(baseX + 40, 0.87, String(Math.round(this.genomes[i].fitness * 100) / 100), '12px Arial', 'green');
					Draw.normX = true;
				}
			}
		}
	}

	public loop(delta: number) {
		if (this.params.fileInput.values[0] !== "__NULL__" && this.genomes.length <= 0) {
			for (let i = 0; i < Math.min(this.params.fileInput.values.length, this.params.fileInput.fileNames.length); ++i) {
				this.genomes.push(Genome.fromJSON(this.params.fileInput.values[i]));
				this.genomeNames.push(this.params.fileInput.fileNames[i]);
			}
			this.populationData();
		}

        if (this.genomes.length > 0) {
            super.lifecycle(delta, this.genomes);
        }
	}

	public epoch() {
		this.populationData();
	}

	/**
	 * Updates the data used for drawing the neurons and genomes.
	 */
	private populationData() {
		this.popDrawIndex = -1;
		this.popDrawData = [];

        if (!this.genomes) {
            return;
        }

		for (const genome of this.genomes) {
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
