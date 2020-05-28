import Scalar from '../../scalar';

export default class BirdGameObs {
	public readonly deltaX = new Scalar('Bird', 'Delta X', 0, 'Δx').ranged(-1, 1);
	public readonly deltaY = new Scalar('Bird', 'Delta Y', 0, 'Δy').ranged(-1, 1);
}
