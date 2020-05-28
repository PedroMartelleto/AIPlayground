import Scalar from '../../scalar';

export default class CartPoleParams {
	public readonly trackLength = new Scalar('Universal', 'Track Length', 2.4).ranged(0.001, 50);
	public readonly gravity = new Scalar('Universal', 'Gravity', 9.68).ranged(0.001, 100);

	public readonly cartMass = new Scalar('Cart', 'Mass', 1).ranged(0.001, 100);
	public readonly cartForceLength = new Scalar('Cart', 'Force Length', 0.15).ranged(0.001, 100);

	public readonly poleLength = new Scalar('Pole', 'Length', 1.2).ranged(0.001, 100);
	public readonly poleMaxAngle = new Scalar('Pole', 'Max Angle Degrees', 45).ranged(0.001, 60);
	public readonly poleMass = new Scalar('Pole', 'Pole Mass', 0.1).ranged(0.001, 100);

	public readonly cartWidth = new Scalar('Draw', 'Cart Width', 28*3).ranged(0.001, 512);
	public readonly cartHeight = new Scalar('Draw', 'Cart Height', 17*3).ranged(0.001, 512);
	public readonly wheelRadius = new Scalar('Draw', 'Wheel Radius', 10).ranged(0.001, 128);
}