import * as React from 'react';
import Draw from '../draw';
import AgentModel from '../rl/agents/agentModel';
import EnvironmentModel from '../rl/envs/environmentModel';
import { ICardInfo } from './infoCard';
import SwipeableTabs from './swipeableTabs';
import ParamsFamily from './paramsFamily';

interface IProps {
	modelName: string;
	info: ICardInfo;
	env?: EnvironmentModel;
	agent?: AgentModel;
}

const FRAMES_PER_SEC = 60.0;
const FRAME_TIME = 1 / FRAMES_PER_SEC;

/**
 * The Core component controls SwipeableTabs component which has a Canvas and a ScalarFamily tab.
 * The Canvas renders data from either an Environment or an Agent and the ScalarFamily tabs controls its parameters.
 * All of the main loop logic is done here.
 */
export default class Core extends React.Component<IProps, any> {
	private static styleCanvas = { width: '100%', height: '90vh' };

	public canvasContext?: CanvasRenderingContext2D;

	public timeScale = 1;

	private lastTime = 0;
	private unprocessedTime = 0;
	private frameCounter = 0;
	private frames = 0;
	private totalTime = 0;

	public constructor(props: IProps) {
		super(props);
		this.fetchInfo(props.modelName);

		this.start();
	}

	public componentWillMount() {
        window.addEventListener("resize", this.resize.bind(this));
	}
	
    public componentDidMount() {
        window.removeEventListener("resize", this.resize.bind(this));
    }

	public render() {
		// As a convention, if the agent is not specified this core component is for a environment
		if (!!this.props.env) {
			return (
				<SwipeableTabs
					tab1={
						<canvas id="env-canvas" style={Core.styleCanvas} ref={this.ref.bind(this)}/>
					}
					tab2={
						<ParamsFamily agent={undefined} env={this.props.env!} tint="secondary" scalars={this.props.env!.paramsArray}/>
					}
					tab1Name="Environment" tab2Name="Parameters"
					color="secondary"
				/>
			);
		} else {
			return (
				<SwipeableTabs
					tab1={
						<canvas id="agent-canvas" style={Core.styleCanvas} ref={this.ref.bind(this)}/>
					}
					tab2={
						<ParamsFamily agent={this.props.agent!} env={undefined} tint="primary" scalars={this.props.agent!.paramsArray} stringParams={this.props.agent!.stringParamsArray}/>
					}
					tab1Name="Agent" tab2Name="Parameters"
					color="primary"
				/>
			);
		}
	}

	private update(delta: number) {
		if (this.props.agent) {
			this.props.agent!.loop(delta);
		}
	}

	private draw(timeStamp: number) {
		if (this.canvasContext) {
			if (this.props.agent) {
				this.props.agent!.draw(this.canvasContext!);
			} else if (this.props.env) {			
				this.props.env!.draw(this.canvasContext!);

				// Draws performance meter
				Draw.context = this.canvasContext;
				Draw.normY = false;
				Draw.setTranslation(0, -12);

				Draw.normX = Draw.normY = true;
				Draw.text(-0.98, 0.98, this.totalTime.toFixed(2) + 'ms', '300 12px sans-serif', 'green', 'left');
				
				Draw.setTranslation(0, 0);
			}
		}
	}

	private start() {
		this.lastTime = performance.now() / 1000.0;
		setInterval(this.run.bind(this), 0);
	}

	// See https://gafferongames.com/post/fix_your_timestep/
	private run() {
		let needToRender = false;

		// Current time at the start of the frame.
		// timeStamp is divided by 1000 to convert ms to seconds.
		const currentTime = performance.now() / 1000.0;

		// Amount of passed time since last frame.
		const passedTime = currentTime - this.lastTime;
		this.lastTime = currentTime;

		this.unprocessedTime += passedTime;
		this.frameCounter += passedTime;

		if (this.frameCounter >= 1.5)
		{
			this.totalTime = (1000.0 * this.frameCounter)/this.frames;

			this.frames = 0;
			this.frameCounter = 0;
		}
	
		while (this.unprocessedTime > FRAME_TIME)
		{
			for (let i = 0; i < this.timeScale; ++i) {
				this.update(FRAME_TIME);
			}
			
			// Since any updates can put onscreen objects in a new place, the flag
			// must be set to rerender the scene.
			needToRender = true;
			this.unprocessedTime -= FRAME_TIME;
		}

		if (needToRender)
		{
			window.requestAnimationFrame(this.draw.bind(this));
			this.frames++;
		}
	}

	private fetchInfo(modelName: string) {
		this.props.info.modelName = modelName;
		this.props.info.description = 'Description';
		this.props.info.title = 'Title';
		this.props.info.imgSrc = 'Title';
	}

	private ref(canvas: HTMLCanvasElement) {
		if (canvas) {
			const ctx = canvas.getContext('2d');

			if (ctx) {
				this.canvasContext = ctx;
			}

			this.resize();
		}
	}

	private resize() {
		if (this.canvasContext) {
			this.canvasContext.canvas.width = this.canvasContext.canvas.offsetWidth;
			this.canvasContext.canvas.height = this.canvasContext.canvas.offsetHeight;
		}
	}
}