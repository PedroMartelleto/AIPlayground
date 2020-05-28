type StringParamType = 'text' | 'file';

export default class StringParam {
	/**
	 * Adds each string param from the specified object to an array of string params.
	 *
	 * @static
	 * @param {*} obj
	 * @param {StringParam[]} to
	 * @memberof StringParam
	 */
	public static addStringParamsFromObjectToArray(obj: any, to: StringParam[]) {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const prop = obj[key];
				
				if ((prop.familyName != null) && (prop.name != null) && (prop.values != null) && (prop.type != null)) {
					to.push(prop);
				}
			}
		}
	}

	public values: string[];
	
	public fileNames: string[];

	public readonly name: string;
	public readonly familyName: string;

	/**
	 * Name used to represent this scalar on a formula (eg. if this obs is an angle, this value may be "θ")
	 */
	public readonly type: StringParamType;

	public constructor(familyName: string, name: string, value: string, type: StringParamType) {
		this.familyName = familyName;
		this.name = name;
		this.values = [ value ];
		this.fileNames = [];
		this.type = type;
	}
}