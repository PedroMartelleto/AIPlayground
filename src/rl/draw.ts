/**
 * A helper class that implements common functionality for drawing on a canvas rendering context.
 * Origin is at the canvas center. Y positive is up and Y negative is down. X positive is right and X negative is left.
 * May be made useful for abstract layer purposes.
 */
export default class Draw {
	public static context?: CanvasRenderingContext2D;
	
	/**
	 * Whether or not the x coordinates passed at draw methods are normalized.
	 */
	public static normX = false;

	/**
	 * Whether or not the y coordinates passed at draw methods are normalized.
	 */
	public static normY = false;

	/**
	 * Whether or not the widths passed at draw methods are normalized.
	 */
	public static normWidth = false;

	/**
	 * Whether or not the heights passed at draw methods are normalized.
	 */
	public static normHeight = false;

	/**
	 * Draw.context must be set before calling this.
	 * Clears the specified context with a clearRect call.
	 */
	public static clear() {
		Draw.context!.clearRect(0, 0, Draw.context!.canvas.clientWidth, Draw.context!.canvas.clientHeight);
	}

	/**
	 * Draw.context must be set before calling this.
	 * Fills a rectangle at the canvas context with the given settings.
	 * @param x 
	 * @param y 
	 * @param width 
	 * @param height 
	 * @param color 
	 */
	public static rectFill(x: number, y: number, width: number, height: number, color = 'red') {
		const sizeX = Draw.sizeX(width);
		const sizeY = Draw.sizeY(height);
		const coordX = Draw.coordX(x, sizeX);
		const coordY = Draw.coordY(y, sizeY);

		Draw.context!.fillStyle = color;
		Draw.context!.fillRect(coordX, coordY, sizeX, sizeY);
	}

	/**
	 * Draw.context must be set before calling this.
	 * Strokes a rectangle at the canvas context with the given settings.
	 * @param x 
	 * @param y 
	 * @param width 
	 * @param height 
	 * @param color 
	 */
	public static rectStroke(x: number, y: number, width: number, height: number, color = 'red') {
		const sizeX = Draw.sizeX(width);
		const sizeY = Draw.sizeY(height);
		const coordX = Draw.coordX(x, sizeX);
		const coordY = Draw.coordY(y, sizeY);

		Draw.context!.strokeStyle = color;
		Draw.context!.strokeRect(coordX, coordY, sizeX, sizeY);
	}

	/**
	 * Draw.context must be set before calling this.
	 * Fills a circle at the specified location.
	 * If normalized size is set to true, the radius percentage is relative to the canvas width.
	 * @param x 
	 * @param y 
	 * @param radius 
	 * @param color 
	 * @param startAngle 
	 * @param endAngle 
	 */
	public static arcFill(x: number, y: number, radius: number, color = 'red', startAngle = 0, endAngle = Math.PI * 2) {
		Draw.arcPath(x, y, radius, startAngle, endAngle);
		Draw.context!.fillStyle = color;
		Draw.context!.fill();
	}

	/**
	 * Draw.context must be set before calling this.
	 * Fills a circle at the specified location.
	 * If normalized size is set to true, the radius percentage is relative to the canvas width.
	 * @param x 
	 * @param y 
	 * @param radius 
	 * @param color 
	 * @param startAngle 
	 * @param endAngle 
	 */
	public static arcStroke(x: number, y: number, radius: number, color = 'red', lineWidth = 5, startAngle = 0, endAngle = Math.PI * 2) {
		Draw.arcPath(x, y, radius, startAngle, endAngle);
		Draw.context!.strokeStyle = color;
		Draw.context!.lineWidth = lineWidth;
		Draw.context!.stroke();
	}

	/**
	 * Draw.context must be set before calling this.
	 * Draws a line at the specified context with the given arguments.
	 * @param fromX 
	 * @param fromY 
	 * @param toX 
	 * @param toY 
	 * @param color 
	 */
	public static line(fromX: number, fromY: number, toX: number, toY: number, color = 'red', lineWidth = 5) {	
		Draw.context!.lineWidth = lineWidth;
		Draw.context!.strokeStyle = color;

		const fX = Draw.coordX(fromX, 0);
		const fY = Draw.coordY(fromY, 0);
		const tX = Draw.coordX(toX, 0);
		const tY = Draw.coordY(toY, 0);
		
		Draw.context!.beginPath();
		Draw.context!.moveTo(fX, fY);
		Draw.context!.lineTo(tX, tY);
		Draw.context!.closePath();

		Draw.context!.stroke();
	}

	/**
	 * Draw.context must be set before calling this.
	 * Draws an arrow at the specified context with the given arguments.
	 * @param fromX 
	 * @param fromY 
	 * @param toX 
	 * @param toY 
	 * @param color 
	 * @param lineWidth 
	 * @param headLength 
	 */
	public static arrow(fromX: number, fromY: number, toX: number, toY: number, color = 'red', lineWidth: number = 5, headLength: number = 10) {		
		const fX = Draw.coordX(fromX, 0);
		const fY = Draw.coordY(fromY, 0);
		const tX = Draw.coordX(toX, 0);
		const tY = Draw.coordY(toY, 0);

		const angle = Math.atan2(tY - fY, tX - fX);

		Draw.context!.lineWidth = lineWidth;
		Draw.context!.strokeStyle = color;

		Draw.context!.beginPath();
		Draw.context!.moveTo(fX, fY);
		Draw.context!.lineTo(tX, tY);
		Draw.context!.moveTo(tX, tY);
		Draw.context!.lineTo(tX - headLength * Math.cos(angle - Math.PI/6), tY - headLength * Math.sin(angle - Math.PI/6));
		Draw.context!.moveTo(tX, tY);
		Draw.context!.lineTo(tX - headLength * Math.cos(angle + Math.PI/6), tY - headLength * Math.sin(angle + Math.PI/6));
		Draw.context!.closePath();

		Draw.context!.stroke();
	}

	/**
	 * Draw.context must be set before calling this.
	 * Fills a text at the specified context with the given arguments
	 * @param x 
	 * @param y 
	 * @param text 
	 * @param font 
	 * @param color 
	 */
	public static text(x: number, y: number, text: string, font: string, color = 'red') {
		const coordX = Draw.coordX(x, 0);
		const coordY = Draw.coordY(y, 0);

		Draw.context!.fillStyle = color;
		Draw.context!.font = font;
		Draw.context!.fillText(text, coordX, coordY);
	}

	/**
	 * Draw.context must be set before calling this.
	 * Sets line dashing settings.
	 * @param dashLength if lesser or equal to zero, no dashing will occur.
	 * @param dashSpacing if lesser or equal to zero, no dashing will occur.
	 */
	public static setLineDash(dashLength = 0, dashSpacing = 0) {
		if (dashLength > 0 && dashSpacing > 0) {
			Draw.context!.setLineDash([dashLength, dashSpacing]);
		} else {
			Draw.context!.setLineDash([]);
		}
	}

	/**
	 * Draw.context must be set before calling this.
	 * Sets line cap settings.
	 * @param cap 
	 */
	public static setLineCap(cap: 'round' | 'square' | 'butt') {
		Draw.context!.lineCap = cap;
	}

	/**
	 * Draw.context must be set before calling this.
	 * Sets the transformation of the context to a translation to (x, y)
	 * @param x 
	 * @param y 
	 */
	public static setTranslation(x: number, y: number) {
		const tx = Draw.normX ? (Draw.context!.canvas.width * x / 2) : x;
		const ty = - (Draw.normY ? (Draw.context!.canvas.height * y / 2) : y);
		Draw.context!.setTransform(1, 0, 0, 1, tx, ty);
	}

	/**
	 * Internal helper method.
	 * Creates an arc path at Draw.context.
	 * @param x 
	 * @param y 
	 * @param radius 
	 * @param startAngle 
	 * @param endAngle 
	 */
	private static arcPath(x: number, y: number, radius: number, startAngle = 0, endAngle = Math.PI * 2) {
		const size = Draw.sizeX(radius);
		const coordX = Draw.coordX(x, 0);
		const coordY = Draw.coordY(y, 0);

		Draw.context!.beginPath();
		Draw.context!.arc(coordX, coordY, size, startAngle, endAngle, false);
	}

	/**
	 * "Denormalizes" the given width if normHeight is set to true.
	 * @param height 
	 */
	private static sizeX(width: number) {
		return width * (Draw.normWidth ?  Draw.context!.canvas.width : 1);
	}

	/**
	 * "Denormalizes" the given height if normHeight is set to true.
	 * @param height 
	 */
	private static sizeY(height: number) {
		return height * (Draw.normHeight ?  Draw.context!.canvas.height : 1);
	}

	/**
	 * "Denormalizes" the given coordinate if normX is set to true.
	 * If sizeX is not 0, also centers the coordinate.
	 * @param y 
	 * @param sizeY 
	 */
	private static coordX(x: number, sizeX: number) {
		return (Draw.context!.canvas.width - sizeX)/2 + (Draw.normX ? (Draw.context!.canvas.width * x / 2) : x);
	}

	/**
	 * "Denormalizes" the given coordinate if normY is set to true.
	 * If sizeY is not 0, also centers the coordinate.
	 * @param y 
	 * @param sizeY 
	 */
	private static coordY(y: number, sizeY: number) {
		return (Draw.context!.canvas.height - sizeY)/2 - ((Draw.normY ? (Draw.context!.canvas.height * y / 2) : y));
	}

	private constructor() {}
}