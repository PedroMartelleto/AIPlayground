import EnvironmentModel from "../envs/environmentModel";
import Scalar from '../scalar';
import Individual from './individual';
import StringParam from "../stringParam";

type Int = number;

export default abstract class AgentModel {
	/**
	 * Name string must be in camel case and have no spaces.
	 * Digits are allowed after the first character.
	 */
	public readonly modelName: string;

	public readonly env: EnvironmentModel;

	/**
	 * Array of initial scalar parameters for this model.
	 */
	public readonly paramsArray: Scalar[];

	/**
	 * Array of initial string parameters for this model.
	 */
	public readonly stringParamsArray: StringParam[];
	
	/**
	 * Index at the individual array of the individual that is currently being evaluated.
	 */
	private index: Int;

	private hasDoneFirstEval: boolean;

	public constructor(modelName: string, env: EnvironmentModel) {
		this.modelName = modelName;
		this.paramsArray = [];
		this.stringParamsArray = [];
		this.env = env;
		this.index = -1;
		this.hasDoneFirstEval = false;
	}

	public reset(newParamsArray: Scalar[]) {
		for (const newParam of newParamsArray) {
			for (const param of this.paramsArray) {
				if (param.familyName === newParam.familyName && param.name === newParam.name) {
					param.value = newParam.value;
				}
			}
		}
		
		this.resetState();
	}

	public abstract goalReached() : void;

	public abstract resetState() : void;

	/**
	 * Should call the tick method
	 * @param delta 
	 */
	public abstract loop(delta: number) : void;

	public abstract draw(context: CanvasRenderingContext2D) : void;

	public abstract prepareForIndividual(individual: Individual) : void;

	/**
	 * Sets the value for each of the environment's actions.
	 */
	public abstract act() : void;

	public abstract epoch() : void;

	/**
	 * Should be called in the loop function.
	 * Evaluates fitness for all individuals, then runs epoch.
	 * Repeats until the agent stops on some condition imposed at superclasses.
	 * @param delta 
	 * @param individuals 
	 */
	protected lifecycle(delta: number, individuals: Individual[]) {
		if (this.index >= individuals.length) {
			return;
		}

		// Are we currently evaluating an individual?
		if (this.index >= 0) {
			// Make the individual act on the environment
			this.act();
			
			// If step returns true, the fitness evaluation for the current individual should end and the index is incremented.
			if (this.env.step(delta)) {
				individuals[this.index].fitness = this.env.fitness();
				++this.index;

				// If there are no individuals left, the index is set to -1, and epoch gets called next tick
				if (this.index > individuals.length - 1) {
					this.index = -1;
					this.hasDoneFirstEval = true;
					return;
				}

				this.prepareForIndividual(individuals[this.index]);
				this.env.prepareForNewIndividual();
			}
		} else {
			if (this.hasDoneFirstEval) {
				this.env.prepareForEpoch();
				this.epoch();
			}

			// Fitness evaluation is going to be done next time tick is called
			this.index = 0;
			this.prepareForIndividual(individuals[this.index]);
			this.env.prepareForNewIndividual();
		}
	}
	
	/**
	 * Adds each scalar from the specified object as a paramater for this model
	 * @param obj 
	 */
	protected addParamsFromObject(obj: any) {
		Scalar.addScalarsFromObjectToArray(obj, this.paramsArray);
		StringParam.addStringParamsFromObjectToArray(obj, this.stringParamsArray);
	}

	protected addParam(scalar: Scalar) : Scalar {
		this.paramsArray.push(scalar);
		return scalar;
	}
}