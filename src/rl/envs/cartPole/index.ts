import Draw from '../../../draw';
import DrawLog from '../../../draw/log';
import Scalar from '../../scalar';
import EnvironmentModel from '../environmentModel';
import CartPoleObs from './obs';
import CartPoleParams from './params';

export default class EnvCartPole extends EnvironmentModel {
	private angularAcc = 0;
	private cartAcc = 0;
	private numberOfSteps = 0;

	private params = new CartPoleParams();
	private obs = new CartPoleObs();	

	// Actions
	private actionMoveDirection = new Scalar('Cart', 'Move Direction', 0).wholeNumber().ranged(0, 1);

	public constructor() {
		super('poleBalancing');

		this.addParamsFromObject(this.params);
		this.addObsFromObject(this.obs);

		this.addAction(this.actionMoveDirection);

		this.resetState();
	}

	public resetState() {
		this.prepareForNewIndividual();
	}

	public prepareForEpoch() {
		// We don't really need to do anything here, but to avoid warnings...
		this.numberOfSteps = 0;
	}

	public prepareForNewIndividual() {
		this.numberOfSteps = 0;

		this.cartAcc = 0;
		this.angularAcc = 0;
		this.obs.poleAngle.value = 0;
		this.obs.poleVelocity.value = 0;
		this.obs.cartPosition.value = 0;
		this.obs.cartVelocity.value = 0;
	}

	// See https://pdfs.semanticscholar.org/3dd6/7d8565480ddb5f3c0b4ea6be7058e77b4172.pdf
	public step(delta: number) {
		const moveDir = this.actionMoveDirection.value === 1 ? 1 : -1;

		const Mp = this.params.poleMass.value;
		const Mc = this.params.cartMass.value;
		const F = moveDir * this.params.cartForceLength.value;
		const l = this.params.poleLength.value;
		const t2 = this.obs.poleVelocity.value * this.obs.poleVelocity.value;
		const gravity = this.params.gravity.value;

		const sin = Math.sin(this.obs.poleAngle.value);
		const cos = Math.cos(this.obs.poleAngle.value);
		
		this.angularAcc = (gravity * sin + cos * ((-F - Mp*l*t2*sin)/(Mc + Mp))) /
						  (l * (4/3 - (Mp*cos*cos/(Mc+Mp))));
		this.cartAcc = (F + Mp*l*(t2*sin - this.angularAcc*cos))/(Mc + Mp);

		this.obs.cartPosition.value += this.obs.cartVelocity.value * delta;
		this.obs.cartVelocity.value += this.cartAcc * delta;

		this.obs.poleAngle.value += this.obs.poleVelocity.value * delta;
		this.obs.poleVelocity.value += this.angularAcc * delta;

		++this.numberOfSteps;

		if (this.numberOfSteps > 10000) {
			this.hasReachedGoal = true;
		}

		// Returns true if the environment should finalize
		// Here, this happens when the cart position is greater than the track length
		// or the pole angle is greater than a pre-established limit angle.
		return Math.abs(this.obs.cartPosition.value) >= this.params.trackLength.value ||
			   Math.abs(this.obs.poleAngle.value) >= (Math.PI/180) * this.params.poleMaxAngle.value;
	}

	public draw(context: CanvasRenderingContext2D) {
		Draw.context = context;
		Draw.clear();

		DrawLog.render(context);

		// Track length equals to 1 in normalized screen coordinates
		// Thus, to convert a width at our environment to a normalized screen width, we simply divide it by track length

		const cartX = this.obs.cartPosition.value/this.params.trackLength.value;

		Draw.setLineCap('butt');

		// Sets translation to origin
		Draw.setTranslation(0, 0);
		
		// Track
		Draw.normX = Draw.normWidth = true;
		Draw.normHeight = Draw.normY = false;

		Draw.rectFill(0, -this.params.cartHeight.value/2 - this.params.wheelRadius.value, 1, 5, '#222222');

		// Cart and pole drawing
		// Offsets everything by the cart position
		Draw.normX = true;
		Draw.setTranslation(cartX, 0);

		// Cart
		Draw.normWidth = false;
		Draw.rectFill(0, 0, this.params.cartWidth.value, this.params.cartHeight.value, '#CEAA61');

		// Wheels
		Draw.normX = Draw.normY = false;
		Draw.arcFill((this.params.wheelRadius.value * 2 - this.params.cartWidth.value)/2 + 1, -this.params.cartHeight.value/2, this.params.wheelRadius.value, '#333333');
		Draw.arcFill((-this.params.wheelRadius.value * 2 + this.params.cartWidth.value)/2 - 1, -this.params.cartHeight.value/2, this.params.wheelRadius.value, '#333333');
	
		// Force vector
		Draw.normX = Draw.normY = false;
		Draw.normWidth = Draw.normHeight = false;

		const forceDir = (this.actionMoveDirection.value === 1 ? -1 : 1);
		const F = this.params.cartForceLength.value*500;

		Draw.setLineDash(); // Disables line dashing
		Draw.arrow(forceDir * (this.params.cartWidth.value/2 + F), 0, forceDir * this.params.cartWidth.value/2, 0, '#A0A0A0', 3, 8);
		Draw.text(forceDir * (this.params.cartWidth.value + F)/2, 8, 'F', '500 italic 19px Times New Roman', '#222222');

		// Normal
		Draw.setLineDash(4, 8);
		Draw.line(0, this.params.cartHeight.value/2, 0, this.params.cartHeight.value/2 + 12*4*1.5, '#A0A0A0', 3);

		// Pole
		Draw.setLineDash(); // Disables line dashing
		Draw.setLineCap('round');
		
		Draw.normWidth = Draw.normHeight = true;
		const poleLength = this.params.poleLength.value / this.params.trackLength.value;
		const poleX = Math.cos(this.obs.poleAngle.value + Math.PI/2) * poleLength;
		const poleY = Math.sin(this.obs.poleAngle.value + Math.PI/2) * poleLength;

		Draw.normX = true;
		Draw.setTranslation(cartX, this.params.cartHeight.value/2);
		Draw.normX = Draw.normY = true;
		Draw.line(0, 0, poleX, poleY, '#222222', 3);
		Draw.setTranslation(cartX, 0);

		// Angle
		Draw.normWidth = Draw.normHeight = false;
		Draw.setLineCap('square');
		Draw.normX = Draw.normY = false;
		const angleRadius = 48;

		if (this.obs.poleAngle.value > 0) {
			Draw.arcStroke(0, this.params.cartHeight.value/2, angleRadius, '#A0A0A0', 3, Math.PI*1.5 - this.obs.poleAngle.value, Math.PI*1.5);
		} else {
			Draw.arcStroke(0, this.params.cartHeight.value/2, angleRadius, '#A0A0A0', 3, Math.PI*1.5, Math.PI*1.5 - this.obs.poleAngle.value);
		}
	}

	public fitness() {
		return this.numberOfSteps;
	}
}