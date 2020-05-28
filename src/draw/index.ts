import Genome from '../rl/agents/neat/genome';
import NeuralNetwork from 'src/rl/agents/neat/neuralNetworks';

export interface INeuronDrawData {
	splitX: number;
	splitY: number;
	type: 'hidden' | 'input' | 'output';
	id: number;
}

export interface ILinkDrawData {
	inIndex: number;
	outIndex: number;
	isEnabled: boolean;
}

/**
 * A helper class that implements common functionality for drawing on a canvas rendering context.
 * Origin at the canvas center. Y positive is up and Y negative is down. X positive is right and X negative is left.
 * May be made useful as an abstract rendering layer.
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
	 * Neural network drawing settings
	 *
	 * @static
	 * @memberof Draw
	 */
	public static neuronLineWidth = 0;
	public static inputNeuronFill = '#d17d77';
	public static inputNeuronAltFill = '#b84c44'; // "#77d18f";
	public static inputNeuronStroke = '#454545';
	public static hiddenNeuronFill = '#c4b17c';
	public static hiddenNeuronAltFill = "#ab914a"; // "#9d7cc4";
	public static hiddenNeuronStroke = '#454545';
	public static outputNeuronFill = '#7cd985';
	public static outputNeuronAltFill = "#d1d1d1"; // "#d97e7c";
	public static outputNeuronStroke = '#7cd985';
	
	public static inputNeuronPositiveFill = "#8e9191";
	public static inputNeuronZeroFill = "#d1d1d1";
	public static inputNeuronNegativeFill = "#e07777";

	public static outputNeuronPositiveFill = "#4ced76";
	public static outputNeuronNegativeFill = "#d1d1d1";
	
	public static linkLineWidth = 1.5;
	public static linkColor = '#454545';
	public static neuronShadowBlur = 7;
	public static linkShadowBlur = 2;

	/**
	 * "Denormalizes" the given coordinate if normX is set to true.
	 * If sizeX is not 0, also centers the coordinate.
	 * @param y 
	 * @param sizeY 
	 */
	public static coordX(x: number, sizeX: number) {
		return (Draw.context!.canvas.width - sizeX)/2 + (Draw.normX ? (Draw.context!.canvas.width * x / 2) : x);
	}

	/**
	 * "Denormalizes" the given coordinate if normY is set to true.
	 * If sizeY is not 0, also centers the coordinate.
	 * @param y 
	 * @param sizeY 
	 */
	public static coordY(y: number, sizeY: number) {
		return (Draw.context!.canvas.height - sizeY)/2 - ((Draw.normY ? (Draw.context!.canvas.height * y / 2) : y));
	}
	
	public static imageScaledRotated(image: HTMLImageElement, x: number, y: number, scale: number, angle: number) {
		const sizeX = Draw.sizeX(image.naturalWidth * scale);
		const sizeY = Draw.sizeY(image.naturalHeight * scale);
		const coordX = Draw.coordX(x, sizeX);
		const coordY = Draw.coordY(y, sizeY);

		const pivotX = coordX + sizeX/2;
		const pivotY = coordY + sizeY/2;

		Draw.context!.translate(pivotX, pivotY);
		Draw.context!.rotate(angle);
		Draw.context!.translate(-pivotX, -pivotY);
		Draw.context!.drawImage(image, coordX, coordY, sizeX, sizeY);
		Draw.context!.setTransform(1, 0, 0, 1, 0, 0);
	}

	public static imageScaled(image: HTMLImageElement, x: number, y: number, scale: number) {
		Draw.image(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
	}

	public static image(image: HTMLImageElement, x: number, y: number, width: number, height: number) {
		const sizeX = Draw.sizeX(width < 0 ? image.naturalWidth : width);
		const sizeY = Draw.sizeY(height < 0 ? image.naturalHeight : height);
		const coordX = Draw.coordX(x, sizeX);
		const coordY = Draw.coordY(y, sizeY);

		Draw.context!.drawImage(image, coordX, coordY, sizeX, sizeY);
	}

	/**
	 * Draw.context must be set before calling this.
	 * Clears the specified context with a clearRect call.
	 */
	public static clear() {
		Draw.context!.clearRect(0, 0, Draw.context!.canvas.clientWidth, Draw.context!.canvas.clientHeight);
	}

	/**
	 * Returns context.canvas.clientWidth.
	 */
	public static width() {
		return Draw.context!.canvas.clientWidth;
	}

	/**
	 * Returns context.canvas.clientWidth.
	 */
	public static height() {
		return Draw.context!.canvas.clientHeight;
	}

	/**
	 * Draw.context must be set before calling this.
	 * Clears a rectangle at the canvas context with the given settings.
	 * @param x 
	 * @param y 
	 * @param width 
	 * @param height 
	 * @param color 
	 */
	public static rectClear(x: number, y: number, width: number, height: number) {
		const sizeX = Draw.sizeX(width);
		const sizeY = Draw.sizeY(height);
		const coordX = Draw.coordX(x, sizeX);
		const coordY = Draw.coordY(y, sizeY);

		Draw.context!.clearRect(coordX, coordY, sizeX, sizeY);
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
	 * X and Y must be denormalized.
	 * Draws the given genome.
	 * @param genome 
	 */
	public static genome(x: number, y: number, genome: Genome) {
		const normX = Draw.normX;
		const normY = Draw.normY;
		const normWidth = Draw.normWidth;
		const normHeight = Draw.normHeight;

		Draw.normX = Draw.normY = Draw.normWidth = Draw.normHeight = false;
		Draw.context!.lineWidth = 1;

		const linkGenesHeight = 76;
		let xOffset = 0;

		for (const linkGene of genome.linkGenes) {
			if (!linkGene.isEnabled) {
				Draw.rectFill(x + xOffset, y - 16, 48, linkGenesHeight, '#e4e4e4');
			}

			Draw.text(x + xOffset, y, linkGene.innovation!.n + '', '400 14px sans-serif', 'black');
			Draw.text(x + xOffset, y - 32, linkGene.inNeuron.id + "->" + linkGene.outNeuron.id, '400 14px sans-serif', 'black');

			Draw.rectStroke(x + xOffset, y - 16, 48, linkGenesHeight, 'black');

			xOffset += 48;
		}

		xOffset = 0;
		
		for (const neuronGene of genome.neuronGenes) {
			Draw.text(x + xOffset, y - linkGenesHeight, neuronGene.id + '', '400 14px sans-serif', 'black');
			Draw.text(x + xOffset, y - linkGenesHeight - 32, neuronGene.type, '400 14px sans-serif', 'black');
			Draw.rectStroke(x + xOffset, y - linkGenesHeight - 16, 48, linkGenesHeight, 'black');
			xOffset += 48;
		}

		Draw.normX = normX;
		Draw.normY = normY;
		Draw.normWidth = normWidth;
		Draw.normHeight = normHeight;
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
	public static text(x: number, y: number, text: string, font: string, color = 'red', textAlign: 'center' | 'left' | 'right' = 'center') {
		const coordX = Draw.coordX(x, 0);
		const coordY = Draw.coordY(y, 0);

		Draw.context!.fillStyle = color;
		Draw.context!.font = font;
		Draw.context!.textAlign = textAlign;
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

	public static neuralNetwork(x: number, y: number, width: number, height: number, radius: number, neurons: INeuronDrawData[], links: ILinkDrawData[], phenotype: NeuralNetwork | undefined) {
		const sizeX = Draw.sizeX(width);
		const sizeY = Draw.sizeY(height);
		const coordX = Draw.coordX(x + width*2, sizeX + Draw.context!.canvas.width);
		const coordY = Draw.coordY(y, sizeY + Draw.context!.canvas.height);

		const normX = Draw.normX;
		const normY = Draw.normY;
		Draw.normX = Draw.normY = false;

		for (const link of links) {
			const from = neurons[link.inIndex];
			const to = neurons[link.outIndex];

			let linkValue = 0.5;

			if (!!phenotype) {
				for (const neuronData of phenotype.neurons) {
					if (from.id === neuronData.id) {				
						linkValue = neuronData.output;
						break;
					}
				}
			}

			const fromX = coordX + sizeX * -from.splitY;
			const fromY = coordY + sizeY * from.splitX;
			
			const toX = coordX + sizeX * -to.splitY;
			const toY = coordY + sizeY * to.splitX;

			if (to.type === "output") {
				const fill = linkValue < 0 ? Draw.outputNeuronAltFill : Draw.outputNeuronFill;
				Draw.context!.shadowBlur = Draw.linkShadowBlur * linkValue;
				Draw.context!.shadowColor = fill;
				Draw.line(fromX, fromY, toX, toY, fill, Draw.linkLineWidth * linkValue);
			} else if (from.type === "input") {
				const fill = linkValue < 0 ? Draw.inputNeuronAltFill : Draw.inputNeuronFill;
				Draw.context!.shadowBlur = Draw.linkShadowBlur * linkValue;
				Draw.context!.shadowColor = fill;
				Draw.line(fromX, fromY, toX, toY, fill, Draw.linkLineWidth * linkValue);
			} else if (from.type === "hidden") {
				const fill = linkValue < 0 ? Draw.hiddenNeuronAltFill : Draw.hiddenNeuronFill;
				Draw.context!.shadowBlur = Draw.linkShadowBlur * linkValue;
				Draw.context!.shadowColor = Draw.hiddenNeuronFill;
				Draw.line(fromX, fromY, toX, toY, fill, Draw.linkLineWidth * linkValue);
			}
		}

		for (const neuron of neurons) {
			const neuronX = coordX + sizeX * -neuron.splitY;
			const neuronY = coordY + sizeY * neuron.splitX;

			Draw.context!.lineWidth = Draw.neuronLineWidth;
			
			let neuronValue = 0.5;

			if (!!phenotype) {
				for (const neuronData of phenotype.neurons) {
					if (neuron.id === neuronData.id) {				
						neuronValue = neuronData.output;
						break;
					}
				}
			}

			if (neuron.type === 'input') {
				let fill = Draw.inputNeuronZeroFill;

				if (neuronValue < 0) {
					fill = Draw.inputNeuronNegativeFill;
				} else if (neuronValue > 0) {
					fill = Draw.inputNeuronPositiveFill;
				}

				Draw.context!.shadowBlur = Draw.neuronShadowBlur * Math.abs(neuronValue);
				Draw.context!.shadowColor = fill;
				Draw.arcFill(neuronX, neuronY, radius, fill);
				Draw.context!.strokeStyle = Draw.inputNeuronStroke;

				if (Draw.inputNeuronStroke !== 'null') {
					Draw.context!.strokeStyle = Draw.inputNeuronStroke;
					// Draw.context!.stroke();
				}
			} else if (neuron.type === 'hidden') {
				const fill = neuronValue < 0 ? Draw.hiddenNeuronAltFill : Draw.hiddenNeuronFill;

				Draw.context!.shadowBlur = Draw.neuronShadowBlur * Math.abs(neuronValue);
				Draw.context!.shadowColor = fill;
				Draw.arcFill(neuronX, neuronY, radius, fill);
				
				if (Draw.hiddenNeuronStroke !== 'null') {
					Draw.context!.strokeStyle = Draw.hiddenNeuronStroke;
					// Draw.context!.stroke();
				}
			} else if (neuron.type === 'output') {
				const fill = neuronValue < 0 ? Draw.outputNeuronNegativeFill : Draw.outputNeuronPositiveFill;
				
				Draw.context!.shadowBlur = Draw.neuronShadowBlur * Math.abs(neuronValue);
				Draw.context!.shadowColor = fill;
				Draw.arcFill(neuronX, neuronY, radius, fill);

				if (Draw.outputNeuronStroke !== 'null') {
					Draw.context!.strokeStyle = Draw.outputNeuronStroke;
					// Draw.context!.stroke();
				}
			}
		}

		Draw.normX = normX;
		Draw.normY = normY;

		Draw.context!.shadowBlur = 0;
		Draw.context!.shadowColor = "rgba(0, 0, 0, 0)";
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

	private constructor() {}
}