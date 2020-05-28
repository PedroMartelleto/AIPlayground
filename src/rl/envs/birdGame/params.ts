import Scalar from '../../scalar';

export default class BirdGameParams {
	public readonly gameScale = new Scalar('Graphics', 'Scale', 2).ranged(1, 5);

	public readonly gravity = new Scalar('Physics', 'Gravity', 10).ranged(0.01, 100);
	public readonly birdHorizontalSpeed = new Scalar('Physics', 'Bird Horizontal Speed', 50).ranged(0.01, 100);
	public readonly birdFlappingSpeed = new Scalar('Physics', 'Bird Flapping Speed', 155).ranged(0.01, 1000);

	public readonly manualInputMode = new Scalar('Game', 'Manual Input Mode', 0).wholeNumber().ranged(0, 1);
}