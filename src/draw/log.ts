import Draw from './index';

interface ILog {
	text: string;
	type: 'print' | 'warn' | 'error';
	displayTime: number;
	startTime?: number;
}

/**
 * Handles log drawing at a canvas.
 */
export default class DrawLog {
	public static printToConsole = true;

	/**
	 * Adds a print log to the log list.
	 * It will be rendered when render() is called.
	 * @param text 
	 * @param displayTime in seconds.
	 */
	public static print(text: string, displayTime = 2.5) {
		DrawLog.latestLogs.push({ text, displayTime, type: 'print' });
		
		if (DrawLog.printToConsole) {
			console.log(text);
		}
	}
	
	/**
	 * Adds a warning log to the log list.
	 * It will be rendered when render() is called.
	 * @param text 
	 */
	public static warn(text: string, displayTime = 2.5) {
		DrawLog.latestLogs.push({ text, displayTime, type: 'warn' });

		if (DrawLog.printToConsole) {
			console.warn(text);
		}
	}

	/**
	 * Adds an error log to the log list.
	 * It will be rendered when render() is called.
	 * @param text 
	 */
	public static error(text: string, displayTime = 2.5) {
		DrawLog.latestLogs.push({ text, displayTime, type: 'error' });
		
		if (DrawLog.printToConsole) {
			console.error(text);
		}
	}

	public static render(context: CanvasRenderingContext2D) {
		for (const log of DrawLog.latestLogs) {
			if (!log.startTime) {
				log.startTime = performance.now();
				DrawLog.logs.push(log);
			}
		}

		Draw.context = context;
		Draw.normX = true;

		let y = -32;
		
		for (let i = DrawLog.logs.length - 1; i >= 0; --i) {
			if (performance.now() - DrawLog.logs[i].startTime! >= DrawLog.logs[i].displayTime * 1000) {
				DrawLog.logs.splice(i, 1);
				continue;
			}
			
			let color = 'black';

			if (DrawLog.logs[i].type === 'warn') {
				color = '#b2880a';
			} else if (DrawLog.logs[i].type === 'error') {
				color = 'red';
				}

			Draw.normY = false;
			Draw.setTranslation(0, y);

			Draw.normY = true;
			Draw.text(-0.98, 0.98, DrawLog.logs[i].text, '400 13px sans-serif', color);

			y -= 16;
		}

		Draw.setTranslation(0, 0);
	}

	private static latestLogs: ILog[] = [];
	private static logs: ILog[] = [];
}