import Color from "./color";

export default class ColorAnimator {
    private static fromColors: { [transitionID: string]: Color } = {};
	private static tMap: { [transitionID: string]: number } = {};

    public static transition(transitionID: string, color: Color): Color {
        if (!ColorAnimator.fromColors[transitionID]) {
            ColorAnimator.fromColors[transitionID] = color;
        }

        if (ColorAnimator.tMap[transitionID] === undefined) {
            ColorAnimator.tMap[transitionID] = 0;
        }

        if (!ColorAnimator.fromColors[transitionID].equals(color)) {
            ColorAnimator.tMap[transitionID] += 0.064;

            if (ColorAnimator.tMap[transitionID] > 1) {
                ColorAnimator.tMap[transitionID] = 1;
            }

            return ColorAnimator.fromColors[transitionID].transitionTo(color, ColorAnimator.tMap[transitionID]);
        } else {
            ColorAnimator.tMap[transitionID] = 0;
            ColorAnimator.fromColors[transitionID] = color;
            return color;
        }
    }
}