import EnvironmentModel from '../../envs/environmentModel';
import AgentModel from '../agentModel';
import Individual from '../individual';

export default class RandomAgent extends AgentModel {
	private individuals: Individual[] = [];
	private shouldStop = false;

	public constructor(environment: EnvironmentModel) {
		super("randomAgent", environment);

		this.resetState();
	}

	public resetState() {
		this.individuals = [ new Individual() ];
	}

	public prepareForIndividual(individual: Individual) {
		// ...
	}

	public draw(context: CanvasRenderingContext2D) {
		// ...
	}

	public goalReached() {
		this.shouldStop = true;
	}

	public loop(delta: number) {
		if (this.shouldStop) {
			return;
		}

		if (this.env.hasReachedGoal) {
			this.goalReached();
			return;
		}

		super.lifecycle(delta, this.individuals);
	}

	public act() {
		for (const s of this.env.actions) {
			if (Number.isFinite(s.min) && Number.isFinite(s.max)) {
				if (!s.isWhole) {
					s.value = Math.random() * (s.max - s.min) + s.min;
				} else {
					s.value = Math.random() * (s.max - s.min + 1) + s.min;
				}
			} else {
				s.value = Math.random() * 2 - 1;
			}

			if (s.isWhole) {
				s.value = Math.round(s.value);
			}
		}
	}

	public epoch() {
		/*
		pool.individuals.sort((a: Individual, b: Individual) => {
			return b.fitness - a.fitness;
		});
		pool.individuals = pool.individuals.slice(0, Math.min(Math.ceil(pool.individuals.length * 0.2), pool.individuals.length - 1));
		*/
	}
}