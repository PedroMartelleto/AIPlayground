import Scalar from "../scalar";

type Int = number;

/**
 * Model for a reinforcement learning environment.
 */
export default abstract class EnvironmentModel {
	public readonly modelName: string;
	
	public readonly actions: Scalar[];

	/**
	 * Array of initial parameters for this model.
	 */
	public readonly paramsArray: Scalar[] = [];

	public hasReachedGoal = false;

	/**
	 * If not undefined, requests the current individual to be saved to disk when evaluation ends.
	 */
	public saveRequestedName?: string = undefined;

	protected readonly obsArray: Scalar[];

	/**
	 * @param modelName 
	 * @param actionsDef Defines the expected behaviour of each action (eg. is whole number, value range) and the action scalar count.
	 */
	public constructor(modelName: string) {
		this.modelName = modelName;
		this.actions = [];
		this.obsArray = [];
		this.paramsArray = [];
	}

	public reset(newParamsArray: Scalar[]) : void {
		for (const newParam of newParamsArray) {
			for (const param of this.paramsArray) {
				if (param.familyName === newParam.familyName && param.name === newParam.name) {
					param.value = newParam.value;
				}
			}
		}

		this.resetState();
	}

	public requestSave(withFileName) {
		this.saveRequestedName = withFileName;
	}

	public abstract resetState() : void;

	public actionsCount() : Int {
		return this.actions.length;
	}

	public obsCount() : Int {
		return this.obsArray.length;
	}

	public obsFormulaNames() : string[] {
		return this.obsArray.map(e => e.formulaName);
	}

	public obsValues() : number[] {
		return this.obsArray.map(e => e.value);
	}

	/**
	 * Resets the variables from the environment in order to start a new fitness evaluation.
	 */
	public abstract prepareForNewIndividual() : void;

	/**
	 * Called just before the next epoch
	 */
	public abstract prepareForEpoch() : void;

	/**
	 * Updates the environment based on the actions' values.
	 * @returns If true, the fitness evaluation should end.
	 */
	public abstract step(delta: number) : boolean;

	/**
	 * Draws the a visual representation of the environment
	 */
	public abstract draw(context: CanvasRenderingContext2D) : void;

	/**
	 * Returns the fitness calculated throughout the agent-environment interaction
	 */
	public abstract fitness() : number;

	/**
	 * Adds each scalar from the specified object as paramaters for this model.
	 * @param obj 
	 */
	protected addParamsFromObject(obj: any) {
		Scalar.addScalarsFromObjectToArray(obj, this.paramsArray);
	}

	/**
	 * Adds each scalar from the specified object as observations scalar for this model.
	 * @param obj 
	 */
	protected addObsFromObject(obj: any) {
		Scalar.addScalarsFromObjectToArray(obj, this.obsArray);
	}

	/**
	 * Adds each scalar from the specified object as actions for this model.
	 * @param obj 
	 */
	protected addActionsFromObject(obj: any) {
		Scalar.addScalarsFromObjectToArray(obj, this.actions);
	}

	protected addParam(scalar: Scalar) : Scalar {
		this.paramsArray.push(scalar);
		return scalar;
	}

	protected addObs(scalar: Scalar) : Scalar {
		this.obsArray.push(scalar);
		return scalar;
	}

	protected addAction(scalar: Scalar) : Scalar {
		this.actions.push(scalar);
		return scalar;
	}
}