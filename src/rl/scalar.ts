/**
 * A number with stablished bounds that might be whole.
 * The "type classification" is useful for displaying purposes and dynamic number validity checks.
 */
export default class Scalar {
	/**
	 * Adds each scalar from the specified object to an array of scalars.
	 * @param obj 
	 * @param to
	 */
	public static addScalarsFromObjectToArray(obj: any, to: Scalar[]) {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const prop = obj[key];
				
				if ((prop.familyName != null) && (prop.name != null) && (prop.value != null) && (prop.min != null) && (prop.max != null) && (prop.isWhole != null)) {
					to.push(prop);
				}
			}
		}
	}

	public isWhole = false;
	public min = Number.NEGATIVE_INFINITY;
	public max = Number.POSITIVE_INFINITY;
	public value: number;

	public readonly name: string;
	public readonly familyName: string;

	/**
	 * Name used to represent this scalar on a formula (eg. if this obs is an angle, this value may be "θ")
	 */
	public readonly formulaName: string;

	public constructor(familyName: string, name: string, value: number, formulaName?: string) {
		this.familyName = familyName;
		this.name = name;
		this.value = value;
		
		if (!formulaName) {
			this.formulaName = name;
		} else {
			this.formulaName = formulaName;
		}
	}

	/**
	 * Returns true if this.value is within the specified range and is whole if set to be so
	 */
	public isValid(forValue: number) : boolean {
		return this.min <= forValue && forValue <= this.max && (!this.isWhole || Number.isInteger(forValue));
	}

	public ranged(min: number, max: number) : Scalar {
		this.min = min;
		this.max = max;
		return this;
	}

	public wholeNumber() : Scalar {
		this.isWhole = true;
		return this;
	}
}