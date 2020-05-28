import Point from "./point";

export default class Polygon {
	public static fromRectangle(x: number, y: number, w: number, h: number, angle: number): Polygon {
        const c = Math.cos(angle)/2;
        const s = Math.sin(angle)/2;

        const x0 = x + w/2;
        const y0 = y + h/2;

        const cw = c * w;
        const sh = s * h;
        
        const ch = c * h;
        const sw = s * w;

        return new Polygon([ new Point(x0 + sh - cw, y0 + -ch - sw), new Point(x0 + sh + cw, y0 + -ch + sw), new Point(x0 + -sh + cw, y0 + ch + sw), new Point(x0 - sh - cw, y0 + ch - sw) ]);
    }
	
	public points: Point[];

	public constructor(points: Point[]) {
		this.points = points;
	}

    public draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.moveTo(this.points[0].x*2 + 194, this.points[0].y*2 + 140);
        
        for (let i = 1; i < this.points.length; ++i) {
            context.lineTo(this.points[i].x*2 + 194, this.points[i].y*2 + 140);
        }
        
        context.closePath();
        context.fillStyle = "red";
        context.fill();
    }

	/**
	 * Determines whether there is an intersection between two polygons. Uses the Separating Axis Theorem.
	 * Adapted from https://stackoverflow.com/questions/10962379/how-to-check-intersection-between-2-rotated-rectangles.
	 * 
	 * @param other a polygon to compare with
	 * @return
	 */
	public isIntersecting(other: Polygon): boolean {
		const polygons: Array<ReadonlyArray<Point>> = [ this.points, other.points ];

		const pointsFirst: ReadonlyArray<Point> = polygons[0];
		const pointsSecond: ReadonlyArray<Point> = polygons[1];

		let minA: number | undefined;
		let maxA: number | undefined;
		let projected: number | undefined;
		let minB: number | undefined;
		let maxB: number | undefined;

		for (const polygon of polygons) {
			// For each polygon, look at each edge of the polygon, and determine if it separates the two shapes
			for (let i1 = 0; i1 < polygon.length; i1++) {

				// Grab 2 vertices to create an edge
				const i2 = (i1 + 1) % polygon.length;
				const p1 = polygon[i1];
				const p2 = polygon[i2];

				// Find the line perpendicular to this edge
				const normal = {
					x: p2.y - p1.y,
					y: p1.x - p2.x
				};

				minA = maxA = undefined;
				// For each vertex in the first shape, project it onto the line perpendicular to the edge
				// and keep track of the min and max of these values
				for (const point1 of pointsFirst) {
					projected = normal.x * point1.x + normal.y * point1.y;

					if (!minA || projected <= minA) {
						minA = projected;
					}

					if (!maxA || projected >= maxA) {
						maxA = projected;
					}
				}

				// For each vertex in the second shape, project it onto the line perpendicular to the edge
				// and keep track of the min and max of these values
				minB = maxB = undefined;
				for (const point2 of pointsSecond) {
					projected = normal.x * point2.x + normal.y * point2.y;

					if (!minB || projected <= minB) {
						minB = projected;
					}

					if (!maxB || projected >= maxB) {
						maxB = projected;
					}
				}

				// If there is no overlap between the projects, the edge we are looking at separates the two
				// polygons, and we know there is no overlap
				if (maxA! <= minB! || maxB! <= minA!) {
					return false;
				}
			}
		}

		return true;
	}
}