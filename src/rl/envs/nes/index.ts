import Draw from '../../../draw';
import Scalar from '../../scalar';
import EnvironmentModel from '../environmentModel';
import NESParams from './params';
import * as JsNES from "jsnes";
import EmuManager from "./emuManager";
import Point from '../birdGame/point';
import Helper from 'src/rl/agents/neat/utils/helper';

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;
const ENEMY_COUNT = 5;

export default class EnvNES extends EnvironmentModel {
    public nes: JsNES.NES;

    private params = new NESParams();
    private world = 1;
    private level = 1;
    private marioX: number = 0;
    private previousMarioX: number = 0;
    private numberOfFramesStuck: number = 0;
    private marioY: number = 0;
    private tiles: number[];
    private sprites: Point[];
    private maxTime: number = 300;
    private stageIndex = 0;
    private repeatCount = 0;

    // Maximum mario x for current genome
    private maxMarioX: number = 0;

    /**
     * Fitness accumulated from other levels
     *
     * @private
     * @memberof EnvNES
     */
    private baseFitness = 0;

    private readonly trainingStages = [  [1, 3] ];

    private jumpCounter = 0;
    private longJumpCounter = 0;

    // Emulator-related variables

    private emuManager?: EmuManager;
    private buf: ArrayBuffer | undefined = undefined;
    private buf8: Uint8ClampedArray | undefined = undefined;
    private buf32: Uint32Array | undefined = undefined;
    private imageData: ImageData | undefined = undefined;

    // Emulator-related flags
    private hasInitGraphics = false;
    private hasDownloadedROM = false;
    private isFreshROM = true;
    private shouldStartEvaluation = false;

    // Actions
    private actionJump = new Scalar("NES Controller", "Jump (A)", 0).wholeNumber().ranged(0, 1);
    private actionJumpLong = new Scalar("NES Controller", "Long Jump (A)", 0).wholeNumber().ranged(0, 1);
    private actionRight = new Scalar("NES Controller", "Go Right (RIGHT)", 0).wholeNumber().ranged(0, 1);
    private actionRun = new Scalar("NES Controller", "Run (B)", 0).wholeNumber().ranged(0, 1);
    private actionLeft = new Scalar("NES Controller", "Go Left (LEFT)", 0).wholeNumber().ranged(0, 1);

    public constructor() {
        super('nes');

        // Initializes our level data
        this.tiles = Array(this.visionBoxArea());
        this.sprites = Array(ENEMY_COUNT);

        for (let i = 0; i < ENEMY_COUNT; ++i) {
            this.sprites[i] = new Point(10000, 10000);
        }

        this.addParamsFromObject(this.params);

        // this.addObsFromObject(this.obs);
        // Instead of having an object that holds our obs, we simply add them directly

        for (let i = 0; i < this.tiles.length; ++i) {
            this.obsArray.push(new Scalar("Vision", "T" + i, 0).wholeNumber().ranged(-1, 1));
        }

        // As of now, only jump and long jump are enabled
        this.addAction(this.actionJump);
        this.addAction(this.actionJumpLong);
        this.addAction(this.actionRight);
        this.addAction(this.actionRun);
        this.addAction(this.actionLeft);

        this.nes = new JsNES.NES({
            onFrame: this.setBuffer,
            audioEmulation: false
        });

        const request = new XMLHttpRequest();
        request.open("GET", "/Super Mario Bros (E).nes");
        request.overrideMimeType('text/plain; charset=x-user-defined');
        
        request.onload = () => {
            this.nes.loadROM(request.response);
            this.emuManager = new EmuManager(this.nes, 0, 0);
            this.isFreshROM = true;
            this.hasDownloadedROM = true;

            this.resetEmu();
        };

        request.send(null);

        window.onkeydown = e => {               
            if (e.keyCode === 68) {
                this.nes.buttonDown(1, JsNES.Controller.BUTTON_RIGHT);
            }

            if (e.keyCode === 75) {
                this.actionJumpLong.value = 1;
            }

            if (e.keyCode === 74) {
                this.actionJump.value = 1;
            }
        };

        window.onkeyup = e => { 
            if (e.keyCode === 68) {
                this.nes.buttonUp(1, JsNES.Controller.BUTTON_RIGHT);
            }

            if (e.keyCode === 75) {
                this.actionJumpLong.value = 0;
            }

            if (e.keyCode === 74) {
                this.actionJump.value = 0;
            }
        };

        this.prepareForEpoch();
    }

    public resetEmu() {
        if (!this.hasDownloadedROM || !this.emuManager) {
            return;
        }

        if (!this.isFreshROM) {
            this.nes.reloadROM();
        }

        this.nes.frame();

        this.emuManager.memSet.skipStartScreen(this.world - 1, this.level - 1);

        this.maxTime = this.emuManager.memGet.time();

        this.isFreshROM = false;
        this.shouldStartEvaluation = true;
    }

    public prepareForEpoch() {
        Helper.shuffle(this.trainingStages);
	}

    public resetState() {
        this.prepareForNewIndividual();
    }

    public updateStage() {
        const selectedStage = this.trainingStages[this.stageIndex];
        
        this.world = selectedStage[0];
        this.level = selectedStage[1];
    }

    public prepareForNewIndividual() {
        this.updateStage();
        this.resetEmu();

        this.tiles = Array(this.visionBoxArea());
        this.sprites = Array(ENEMY_COUNT);

        for (let i = 0; i < ENEMY_COUNT; ++i) {
            this.sprites[i] = new Point(10000, 10000);
        }

        this.repeatCount = 0;
        this.numberOfFramesStuck = 0;
        this.jumpCounter = 0;
        this.longJumpCounter = 0;
        this.stageIndex = 0;
        this.baseFitness = 0;
        this.maxMarioX = 0;
    }

    public processAction(action: Scalar, button: number) {
        if (action.value > 0) {
            this.nes.buttonDown(1, button);
        } else {
            this.nes.buttonUp(1, button);
        }
    }

    public step(delta: number) {
        if (!this.emuManager) {
            return false;
        }

        if (this.shouldStartEvaluation) {           
            // Gets the previous mario x to determine if the agent is stuck
            this.previousMarioX = this.marioX;
            
            // Gets mario's position
            this.marioX = this.emuManager.memGet.xPosition();
            this.marioY = this.emuManager.memGet.yPixel() + 32;

            if (this.marioX <= this.maxMarioX) {
                this.numberOfFramesStuck += 1;
            } else {
                this.numberOfFramesStuck = 0;
            }

            if (this.marioX > this.maxMarioX) {
                this.maxMarioX = this.marioX;
            }

            // Stops the evaluation if mario is stuck
            if (this.numberOfFramesStuck >= this.params.maxFramesStuck.value) {
                return true;
            }

            // Process the actions from the agent

            // Jump action
            if (this.actionJump.value > 0 || this.jumpCounter > 0) {
                this.jumpCounter += 1;
                this.nes.buttonDown(1, JsNES.Controller.BUTTON_A);
            }

            if (this.jumpCounter >= this.params.normalJumpTicks.value) {
                this.jumpCounter = 0;
                this.nes.buttonUp(1, JsNES.Controller.BUTTON_A);
            }

            // Long jump action
            if (this.actionJumpLong.value > 0 || this.longJumpCounter > 0) {
                this.longJumpCounter += 1;
                this.nes.buttonDown(1, JsNES.Controller.BUTTON_A);
            }

            if (this.longJumpCounter >= this.params.longJumpTicks.value) {
                this.longJumpCounter = 0;
                this.nes.buttonUp(1, JsNES.Controller.BUTTON_A);
            }

            // Other actions
            this.processAction(this.actionRun, JsNES.Controller.BUTTON_B);
            this.processAction(this.actionRight, JsNES.Controller.BUTTON_RIGHT);
            this.processAction(this.actionLeft, JsNES.Controller.BUTTON_LEFT);

            this.emuManager.memSet.nes.frame();

            const flag = this.emuManager.step();
            
            // Finished evaluation, mario died
            if (flag === 1) {
                this.shouldStartEvaluation = false;
                return true;
            }

            // Finished evaluation, mario completed the level
            if (flag === 2) {
                let repeatCount = this.repeatCount;
                
                if (repeatCount + 1 > this.params.repeatStageCount.value) {
                    this.stageIndex += 1;
                    repeatCount = -1;
                }
                
                if (this.stageIndex > this.trainingStages.length - 1) {
                    this.hasReachedGoal = true;
                    return false;   
                }

                const baseFitness = this.fitness();
                const fileName = "completed_" + this.world + "-" + this.level + "_" + this.repeatCount + ".genome";

                // Forcely prepares for a new individual without actually changing the individual.
                // The preparation resets our state and sets the emulator's stage.
                this.prepareForNewIndividual();

                this.repeatCount = repeatCount + 1;

                // Saves the genome that successfully advanced a level
                this.baseFitness = baseFitness;
                this.requestSave(fileName);
            }

            return false;
        }

        return false;
    }

    public draw(context: CanvasRenderingContext2D) {
        Draw.context = context;
        Draw.clear();

        if (this.hasDownloadedROM) {
            if (this.hasInitGraphics && !this.params.disableGraphics.value) {
                this.imageData!.data.set(this.buf8!);

                Draw.context!.putImageData(this.imageData!, 4, 32);
                Draw.context!.setTransform(1, 0, 0, 1, 0, 0);
            } else {
                this.initNESGraphics();
            }
        }

        if (!!this.emuManager) {
            this.getInputs();
        }
    }

    public fitness() {
        if (!this.emuManager) {
            return 0.0001;
        }

        const avgSpeed = this.marioX / Math.max(1, this.maxTime - this.emuManager.memGet.time());
        const f = this.marioX * this.params.fitnessXWeight.value + avgSpeed * this.params.fitnessSpeedWeight.value + this.baseFitness;

        if (f === 0) {
            return 0.0001;
        }

        return f;
    }

    private getInputs() {
        this.getSprites();

        let i = 0;

        for (let dy = -this.params.visionBoxTop.value * 16; dy <= this.params.visionBoxBottom.value * 16; dy += 16) {
            for (let dx = -this.params.visionBoxLeft.value * 16; dx <= this.params.visionBoxRight.value * 16; dx += 16) {
                const tile = this.getTile(dx, dy);

                this.tiles[i] = (tile === 1 && this.marioY + dy < 0x1B0) ? 1 : 0;

                for (const sprite of this.sprites) {
                    const distx = Math.abs(sprite.x - (this.marioX + dx));
                    const disty = Math.abs(sprite.y - (this.marioY + dy));
                    
                    if (distx <= 8 && disty <= 8) {
                        this.tiles[i] = -1;
                    }
                }

                i += 1;
            }
        }

        const drawOffsetX = this.params.screenScale.value * SCREEN_WIDTH + 10;
        const drawOffsetY = 32;
        // Draws what mario sees

        Draw.context!.lineWidth = 3;

        const tileSize = 8 * this.params.screenScale.value;
        const rowWidth = this.visionBoxWidth();

        Draw.context!.lineWidth = 1;
        for (let y = 0; y < this.visionBoxHeight(); ++y) {
            for (let x = 0; x < rowWidth; ++x) {            
                if (x === this.params.visionBoxLeft.value && y === this.params.visionBoxTop.value) {
                    Draw.context!.strokeStyle = "blue";
                } else {
                    const tile = this.tiles[x + y * rowWidth];

                    if (tile === 0) {
                        continue;
                    } else if (tile === 1) {
                        Draw.context!.strokeStyle = "black";
                    } else {
                        Draw.context!.strokeStyle = "red";
                    }
                }

                Draw.context!.strokeRect(drawOffsetX + x * tileSize, drawOffsetY + y * tileSize, tileSize, tileSize);
            }
        }

        for (i = 0; i < this.tiles.length; ++i) {
            this.obsArray[i].value = this.tiles[i];
        }
    }

    private getSprites() {
        for (let slot = 0; slot < this.sprites.length; ++slot) {
            const enemy = this.nes.cpu.mem[0xF+slot];
            
            if (enemy !== 0) {
                const ex = this.nes.cpu.mem[0x6E + slot] * 0x100 + this.nes.cpu.mem[0x87 + slot];
                const ey = this.nes.cpu.mem[0xCF + slot] + 24;

                this.sprites[slot].x = ex;
                this.sprites[slot].y = ey;
            }
        }
    }

    private getTile(dx, dy) {
        const x = this.marioX + dx + 8;
        const y = this.marioY + dy - 16;
        const page = Math.floor(x/256)%2;
 
        const subx = Math.floor((x%256)/16);
        const suby = Math.floor((y - 32)/16);
        const addr = 0x500 + page*13*16 + suby*16 + subx;
               
        if (suby >= 13 || suby < 0) { return 0; }
               
        if (this.nes.cpu.mem[addr] !== 0) { return 1; }
        else { return 0; }
    }

    private visionBoxWidth(): number {
        return this.params.visionBoxLeft.value + this.params.visionBoxRight.value + 1;
    }

    private visionBoxHeight(): number {
        return this.params.visionBoxTop.value + this.params.visionBoxBottom.value + 1;
    }

    private visionBoxArea(): number {
        return this.visionBoxWidth() * this.visionBoxHeight();
    }

    private initNESGraphics() {
        if (this.params.disableGraphics.value) {
            return;
        }

        this.imageData = Draw.context!.getImageData(0, 0, SCREEN_WIDTH * this.params.screenScale.value, SCREEN_HEIGHT * this.params.screenScale.value);

        Draw.context!.fillStyle = "red";
        // set alpha to opaque
        Draw.context!.fillRect(0, 0, SCREEN_WIDTH * this.params.screenScale.value, SCREEN_HEIGHT * this.params.screenScale.value);

        // buffer to write on next animation frame
        this.buf = new ArrayBuffer(this.imageData!.data.length);
        // Get the canvas buffer in 8bit and 32bit
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.buf32 = new Uint32Array(this.buf);

        // Set alpha
        for (let i = 0; i < this.buf32.length; ++i) {
            this.buf32[i] = 0x0000ff00;
        }

        this.hasInitGraphics = true;
    }

    private setBuffer = (buffer) => {
        if (!this.buf32 || this.params.disableGraphics.value) {
            return;
        }

        let i = 0;
        let color = 0;

        for (let y = 0; y < SCREEN_HEIGHT; ++y) {
            for (let x = 0; x < SCREEN_WIDTH; ++x) {
                i = x + y * SCREEN_WIDTH;
                color = 0xff000000 | buffer[i];

                const i2 = (x + y * SCREEN_WIDTH * this.params.screenScale.value) * this.params.screenScale.value;

                // Converts pixel from NES BGR to canvas ABGR
                for (let j = 0; j < this.params.screenScale.value; ++j) {
                    for (let k = 0; k < this.params.screenScale.value; ++k) {
                        this.buf32[i2 + k * SCREEN_WIDTH * this.params.screenScale.value + j] = color;
                    }
                }
            }
        }
    }
}