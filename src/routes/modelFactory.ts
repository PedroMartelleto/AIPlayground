import { ICardInfo } from '../components/infoCard';
import AgentModel from '../rl/agents/agentModel';
import NEATAgent from '../rl/agents/neat';
import RandomAgent from '../rl/agents/randomAgent';
import EnvCartPole from '../rl/envs/cartPole';
import EnvBirdGame from '../rl/envs/birdGame';
import EnvNES from '../rl/envs/nes';
import EnvironmentModel from '../rl/envs/environmentModel';
import NeatSVG from './../svg/neat.svg';
import PoleBalancingSVG from './../svg/pole-balancing.svg';
import BirdGamePNG from './../png/birdGame.png';
import DiceSVG from './../svg/dice.svg';
import NESPNG from './../png/NES.png';
import GenomeVisualizerAgent from 'src/rl/agents/genomeVisualizer';

export function fetchEnvsInfo(cards: ICardInfo[]) {
	cards.push({ title: 'Pole Balancing', description: 'Click to select', imgSrc: PoleBalancingSVG, modelName: 'cartPole' });
	cards.push({ title: 'Bird Game', description: 'Click to select', imgSrc: BirdGamePNG, modelName: 'birdGame' });
	cards.push({ title: 'NES', description: 'Click to select', imgSrc: NESPNG, modelName: 'nes' });
}

export function createEnv(name: string) : EnvironmentModel | undefined {
	if (name === 'cartPole') {
		return new EnvCartPole();
	}

	if (name === 'birdGame') {
		return new EnvBirdGame();
	}

	if (name === 'nes') {
		return new EnvNES();
	}

	return undefined;
}

export function fetchAgentsInfo(cards: ICardInfo[]) {
	cards.push({ title: 'NeuroEvolution of Augmenting Topologies', description: 'Click to select', imgSrc: NeatSVG, modelName: 'neat' });
	cards.push({ title: 'Genome Visualizer Agent', description: 'Click to select', imgSrc: NeatSVG, modelName: 'genomeVisualizer' });
	cards.push({ title: 'Random Agent', description: 'Click to select', imgSrc: DiceSVG, modelName: 'randomAgent' });
}

export function createAgent(name: string, env: EnvironmentModel) : AgentModel | undefined {
	if (name === 'randomAgent') {
		return new RandomAgent(env);
	} else if (name === 'neat') {
		return new NEATAgent(env);
	} else if (name === 'genomeVisualizer') {
		return new GenomeVisualizerAgent(env);
	}

	return undefined;
}