type Int = number;

export default class Helper {
	/**
	 * Helper method
	 * Returns a random int in range [min, max] (inclusive on both sides)
	 * @param  min
	 * @param  max
	 * @return
	 */
	public static randomInt(min: Int, max: Int): Int {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * Helper method
	 * Shuffles the elements of an array
	 * @param  array
	 * @return
	 */
	public static shuffle(array: any[]): void {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}

	/**
	 * Rounds up or down to a whole number by using the fractional part of the input value
	 * as the probability that the value will be rounded up.
	 * @param x
	 * @return
	 */
	public static stochasticRound(value: number) {
		const integerPart = Math.floor(value);
		const fraction = value - integerPart;
		return Math.random() < fraction ? integerPart + 1 : integerPart;
	}

	private constructor() { }
}
