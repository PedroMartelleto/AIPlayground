import Color from "./color";

export default class DynamicColor {
    public zero: Color;
    public positive: Color;
    public negative: Color;

    constructor(zero: Color, positive: Color, negative: Color) {
        this.zero = zero;
        this.positive = positive;
        this.negative = negative;
    }

    public pick(value: number): Color {
		if (Math.abs(value) < 0.001) {
			return this.zero;
		} else if (value > 0) {
			return this.positive;
		} else {
			return this.negative;
		}
	}
}