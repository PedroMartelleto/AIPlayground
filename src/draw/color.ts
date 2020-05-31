export default class Color {
    private static bezier(t: number): number {
        return t*t*(3-2*t);
    }
 
    public r: number;
    public g: number;
    public b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    public transitionTo(other: Color, t: number): Color {
        const b = Color.bezier(t);

        return new Color((other.r - this.r) * b + this.r,
                         (other.g - this.g) * b + this.g,
                         (other.b - this.b) * b + this.b);
    }

    public equals(to: Color): boolean {
        return this.r === to.r && this.g === to.g && this.b === to.b;
    }

    public asString(): string {
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    }
}