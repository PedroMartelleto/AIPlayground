import Scalar from '../../scalar';

export default class CartPoleObs {
	public readonly cartPosition = new Scalar('Cart', 'Position', 0, 'x').ranged(0.001, 1000);
	public readonly cartVelocity = new Scalar('Cart', 'Velocity', 0, 'v').ranged(0.001, 1000);
	public readonly poleAngle = new Scalar('Pole', 'Angle', 0, 'θ').ranged(-60, 60);
	public readonly poleVelocity = new Scalar('Pole', 'Angular Velocity', 0, 'ω').ranged(-60/0.02, 60/0.02);
}