import Draw from '../../../draw';
import DrawLog from '../../../draw/log';
import Scalar from '../../scalar';
import EnvironmentModel from '../environmentModel';
import BirdGameObs from './obs';
import BirdGameParams from './params';
import Pipe from './pipe';
import Polygon from './polygon';

// Image imports

import pipeUpImageSrc from "./assets/pipe-up.png";
import pipeDownImageSrc from "./assets/pipe-down.png";
import backgroundImageSrc from "./assets/background.png";
import bird1ImageSrc from "./assets/bird1.png";
import bird2ImageSrc from "./assets/bird2.png";
import bird3ImageSrc from "./assets/bird3.png";
import floorImageSrc from "./assets/floor.png";

export default class EnvBirdGame extends EnvironmentModel {
	private params = new BirdGameParams();
	private obs = new BirdGameObs();

	/**
	 * Used to calculate score
	 *
	 * @private
	 * @type {number}
	 * @memberof EnvBirdGame
	 */
	private score: number = 0;

	/**
	 * Images
	 *
	 * @private
	 * @memberof EnvBirdGame
	 */
	private pipeDown = new Image();
	private pipeUp = new Image();
	private bird1 = new Image();
	private bird2 = new Image();
	private bird3 = new Image();
	private floor = new Image();
	private background = new Image();

	private birdAnimation = [ this.bird1, this.bird2, this.bird3 ];
	
	private tickCounter = 0;

	private birdVerticalSpeed = 0;
	private birdLastJumpTime = 0;
	private birdAngle = 0;
	private actualBirdAngle = 0;
	private birdVHeight = 0;

	private floorX = 0;
	private birdY = 0;

	private isCollidingWithPipe = false;

	private pipe1 = new Pipe();
	private pipe2 = new Pipe();

	private scoreHitbox = { shape: Polygon.fromRectangle(0, 0, 1, 1, 0), hasBeenTriggered: true };

	private shouldJumpManual = false;

	/**
	 * Actions (outputs)
	 *
	 * @private
	 * @memberof EnvBirdGame
	 */
	private actionShouldJump = new Scalar('Bird', 'Should Jump', 0).wholeNumber().ranged(0, 1);

	public constructor() {
		super('birdGame');

		this.addParamsFromObject(this.params);
		this.addObsFromObject(this.obs);

		this.addAction(this.actionShouldJump);

		this.pipeDown.src = pipeDownImageSrc;
		this.pipeUp.src = pipeUpImageSrc;
		this.bird1.src = bird1ImageSrc;
		this.bird2.src = bird2ImageSrc;
		this.bird3.src = bird3ImageSrc;
		this.floor.src = floorImageSrc;
		this.background.src = backgroundImageSrc;

		window.onkeydown = e => {
			this.shouldJumpManual = true;
		};

		window.onkeyup = e => {
			this.shouldJumpManual = false;
		};

		this.resetState();
	}

	public resetState() {
		this.prepareForNewIndividual();
	}

	public prepareForEpoch() {
		this.tickCounter = 0;
	}

	public prepareForNewIndividual() {
		this.obs.deltaX.value = 0.5;
		this.obs.deltaY.value = 0.25;
		this.scoreHitbox = { shape: Polygon.fromRectangle(0, 0, 1, 1, 0), hasBeenTriggered: true };
		this.birdVerticalSpeed = 0;
		this.birdY = 0;
		this.score = 0;
		this.tickCounter = 0;
		this.birdAngle = 0;
		this.isCollidingWithPipe = false;
		this.actualBirdAngle = 0;
		this.floorX = 0;

		this.randomizePipe(this.pipe1);
		this.randomizePipe(this.pipe2);

		const pipeDistance = this.background.naturalWidth * 0.583;

		this.pipe1.x = 0;
		this.pipe2.x = pipeDistance;

		this.pipe1.x += pipeDistance * 0.6 + (this.background.naturalWidth - 20) / 2;
		this.pipe2.x += pipeDistance * 0.6 + (this.background.naturalWidth - 20) / 2;
	}

	// See https://pdfs.semanticscholar.org/3dd6/7d8565480ddb5f3c0b4ea6be7058e77b4172.pdf
	public step(delta: number) {
		this.birdVerticalSpeed -= this.params.gravity.value * delta;

		this.birdAngle = -this.birdVerticalSpeed;
		this.birdAngle = Math.min(Math.PI/4, this.birdAngle);
		this.birdAngle = Math.max(-Math.PI/4, this.birdAngle);

		this.actualBirdAngle = this.birdAngle + Math.sin(this.tickCounter)/7;

		this.birdY += this.birdVerticalSpeed;

		const shouldJump = (this.actionShouldJump.value === 1 && !this.params.manualInputMode.value) || (this.params.manualInputMode.value && this.shouldJumpManual);
		// shouldJump = this.obs.deltaY.value < 0;// tanh(-this.obs.deltaY.value + tanh(0.003 * this.obs.deltaX.value)) >= 0 ? true : false;

		if (shouldJump && performance.now() - this.birdLastJumpTime >= 50) {
			this.birdVerticalSpeed = this.params.birdFlappingSpeed.value * delta;
			this.birdLastJumpTime = performance.now();
		}

		this.tickCounter += delta * 10;

		this.calculateObs();

		this.pipe1.x -= this.params.birdHorizontalSpeed.value * delta;
		this.pipe2.x -= this.params.birdHorizontalSpeed.value * delta;
		this.scoreHitbox.shape.points[0].x -= this.params.birdHorizontalSpeed.value * delta;
		this.scoreHitbox.shape.points[1].x -= this.params.birdHorizontalSpeed.value * delta;
		this.scoreHitbox.shape.points[2].x -= this.params.birdHorizontalSpeed.value * delta;
		this.scoreHitbox.shape.points[3].x -= this.params.birdHorizontalSpeed.value * delta;

		const maxFloorX = this.floor.naturalWidth - this.background.naturalWidth;

		this.floorX -= this.params.birdHorizontalSpeed.value * delta;

		if (this.floorX < 0) {
			this.floorX = maxFloorX;
		}

		const birdDistToGround = this.birdVHeight * this.background.naturalHeight;

		// Returns true if the environment should finalize
		return birdDistToGround < 4 || birdDistToGround > 240 || this.isCollidingWithPipe;
	}

	public draw(context: CanvasRenderingContext2D) {
		Draw.context = context;
		Draw.context.imageSmoothingEnabled = false;
		Draw.clear();

		DrawLog.render(context);

		// Track
		Draw.normX = Draw.normWidth = Draw.normHeight = Draw.normY = false;

		const scale = this.params.gameScale.value;
		const backgroundWidth = this.background.naturalWidth * scale;
		const backgroundHeight = this.background.naturalHeight * scale;

		Draw.setTranslation(0, 0);

		// Background
		Draw.imageScaled(this.background, 0, 0, scale);

		this.drawPipe(this.pipe1);
		this.drawPipe(this.pipe2);

		// Ground
		Draw.imageScaled(this.floor, this.floorX*scale - (this.floor.naturalWidth - this.background.naturalWidth)*scale/2, -(backgroundHeight)/2, scale);

		Draw.setTranslation(0, 0);

		// Bird
		Draw.imageScaledRotated(this.birdAnimation[Math.round(this.tickCounter) % 3], -20 * scale, this.birdY * scale, scale, this.actualBirdAngle);

		// Clips everything to the background
		Draw.rectClear(backgroundWidth, 0, backgroundWidth, backgroundHeight*2);
		Draw.rectClear(-backgroundWidth, 0, backgroundWidth, backgroundHeight*2);
		Draw.rectClear(0, backgroundHeight, backgroundWidth*2, backgroundHeight);
		Draw.rectClear(0, -backgroundHeight, backgroundWidth*2, backgroundHeight);

		Draw.text(-2, (this.background.naturalHeight*scale - 100)/2 + 1, this.score + "", "22px 'Press Start 2P', cursive", "black", "center");
		Draw.text(0, (this.background.naturalHeight*scale - 100)/2, this.score + "", "20px 'Press Start 2P', cursive", "white", "center");

		this.calculateObs();
	}

	public fitness() {
		return this.score + this.tickCounter / 100;
	}

	private calculateObs() {
		if (!Draw.context) {
			return;
		}

		const birdX = this.background.naturalWidth/2 - 20;
		const birdY = this.background.naturalHeight/2 - this.birdY;

		const birdPolygon = Polygon.fromRectangle(birdX - 4, birdY - 4, this.bird1.naturalWidth - 6, this.bird1.naturalHeight - 4, this.actualBirdAngle);

		// Score increaser
		if (birdPolygon.isIntersecting(this.scoreHitbox.shape)) {
			if (!this.scoreHitbox.hasBeenTriggered) {
				this.score += 1;
				this.scoreHitbox.hasBeenTriggered = true;
			}
		}

		if (this.pipe1.x > birdX && this.scoreHitbox.hasBeenTriggered) {
			this.scoreHitbox.shape = Polygon.fromRectangle(this.pipe1.x + (this.pipeDown.naturalWidth - 4) / 2, this.pipe1.y + this.pipeDown.naturalHeight, 4, this.pipe1.opening, 0);
			this.scoreHitbox.hasBeenTriggered = false;
		}

		if (this.pipe2.x > birdX && (this.pipe2.x < this.pipe1.x || this.pipe1.x < birdX) && this.scoreHitbox.hasBeenTriggered) {
			this.scoreHitbox.shape = Polygon.fromRectangle(this.pipe2.x + (this.pipeDown.naturalWidth - 4) / 2, this.pipe2.y + this.pipeDown.naturalHeight, 4, this.pipe2.opening, 0);
			this.scoreHitbox.hasBeenTriggered = false;
		}

		if (this.pipe1.x + this.pipeDown.naturalWidth > birdX) {
			this.obs.deltaX.value = (this.pipe1.x - birdX + this.pipeDown.naturalWidth/2) / this.background.naturalWidth;
			this.obs.deltaY.value = (this.pipe1.y + this.pipeDown.naturalHeight + this.pipe1.opening / 2 - birdY) / this.background.naturalHeight;
		}

		if (this.pipe2.x + this.pipeDown.naturalWidth > birdX && (this.pipe2.x < this.pipe1.x || this.pipe1.x + this.pipeDown.naturalWidth < birdX)) {
			this.obs.deltaX.value = (this.pipe2.x - birdX + this.pipeDown.naturalWidth/2) / this.background.naturalWidth;
			this.obs.deltaY.value = (this.pipe2.y + this.pipeDown.naturalHeight + this.pipe2.opening / 2 - birdY) / this.background.naturalHeight;
		}

		this.isCollidingWithPipe = this.checkCollisionWithPipe(birdPolygon, this.pipe1) || this.checkCollisionWithPipe(birdPolygon, this.pipe2);
		
		this.birdVHeight = 0.5 + (this.birdY - this.floor.naturalHeight/2)/this.background.naturalHeight;
	}

	private checkCollisionWithPipe(birdPolygon: Polygon, pipe: Pipe): boolean {
		const pipeDownPolygon = Polygon.fromRectangle(pipe.x, pipe.y, this.pipeDown.naturalWidth, this.pipeDown.naturalHeight, 0);
		const pipeUpPolygon = Polygon.fromRectangle(pipe.x, pipe.y + this.pipeDown.naturalHeight + pipe.opening, this.pipeUp.naturalWidth, this.pipeUp.naturalHeight, 0);

		return birdPolygon.isIntersecting(pipeDownPolygon) || birdPolygon.isIntersecting(pipeUpPolygon);
	}

	private randomizePipe(pipe: Pipe) {
		pipe.x = this.background.naturalWidth;
		pipe.y = -Math.random() * (this.pipeDown.naturalHeight - 20);
		pipe.opening = Math.random() * 30 + 54;
	}

	private drawPipe(pipe: Pipe) {
		if (pipe.x < -this.pipeDown.naturalWidth) {
			this.randomizePipe(pipe);
		}

		// Pipes
		const scale = this.params.gameScale.value;
		const pipeHeight = this.pipeDown.naturalHeight;
		
		const backgroundOffsetX = (Draw.width() - this.background.naturalWidth*scale) / 2;
		const backgroundOffsetY = (Draw.height() - this.background.naturalHeight*scale) / 2;
		Draw.context!.drawImage(this.pipeDown, pipe.x*scale + backgroundOffsetX, pipe.y * scale + backgroundOffsetY, this.pipeDown.naturalWidth * scale, this.pipeDown.naturalHeight * scale);
		Draw.context!.drawImage(this.pipeUp, pipe.x*scale + backgroundOffsetX, (pipe.y + pipe.opening + pipeHeight) * scale + backgroundOffsetY, this.pipeDown.naturalWidth * scale, this.pipeDown.naturalHeight * scale);
	}
}