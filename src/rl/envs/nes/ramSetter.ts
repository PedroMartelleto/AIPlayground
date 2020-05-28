import * as JsNES from "jsnes";
import RAMGetter from "./ramGetter";

export default class RAMSetter {
    public memGet: RAMGetter;
    public nes: JsNES.NES;

    constructor(nes: JsNES.NES, memGet: RAMGetter) {
        this.nes = nes;
        this.memGet = memGet;
    }

    public resetButtons() {
        const BUTTON_COUNT = 8;

        for (let i = 0; i < BUTTON_COUNT; ++i) { 
            this.nes.buttonUp(1, i);
        }
    }

    public frameAdvance(button?: number) {
        this.resetButtons();

        if (button !== undefined) {        
            this.nes.buttonDown(1, button);
        }
        
        this.nes.frame();
        
        if (button !== undefined) {
            this.nes.buttonUp(1, button);
        }
    }
    
    /**
     * Write the stage data to RAM to overwrite loading the next stage.
     */
    public writeStage(world, level) {
        this.nes.cpu.mem[0x075f] = world;
        this.nes.cpu.mem[0x075c] = level;
        this.nes.cpu.mem[0x0760] = level;
    }

    /**
     * Force the pre-level timer to 0 to skip frames during a death.
     */
    public runoutPrelevelTimer() {
        this.nes.cpu.mem[0x07A0] = 0;
    }

    public skipChangeArea() {
        // Skips change area animations by running down timers.
        const changeAreaTimer = this.nes.cpu.mem[0x06DE];

        if (changeAreaTimer > 1 && changeAreaTimer < 255) {
            this.nes.cpu.mem[0x06DE] = 1;
        }
    }

    public skipOccupiedStates() {
        // Skip occupied states by running out a timer and skipping frames.
        while (this.memGet.isBusy() || this.memGet.isWorldOver()) {
            this.runoutPrelevelTimer();
            this.frameAdvance();
        }
    }

    /**
     * Press and release start to skip the start screen.
     */
    public skipStartScreen(world, stage) {        
        // Press start until the game starts
        do {
            this.writeStage(world, stage);

            this.frameAdvance(JsNES.Controller.BUTTON_START);
            this.nes.frame();

            this.writeStage(world, stage);

            this.runoutPrelevelTimer();

            this.writeStage(world, stage);
        } while (this.memGet.time() === 0 || this.memGet.time() === 401);

        // set the last time to now
        let lastTime = this.memGet.time();
        
        // after the start screen idle to skip some extra frames
        while (this.memGet.time() >= lastTime) {
            this.writeStage(world, stage);

            lastTime = this.memGet.time();
            this.frameAdvance(JsNES.Controller.BUTTON_START);
            this.nes.frame();

            this.writeStage(world, stage);
        }
    }

    /**
     * Skips the cutscene that plays at the end of a world.
     */
    public skipEndOfWorld() {
        if (this.memGet.isWorldOver()) {
            // Gets the current game time to reference
            const previousTime = this.memGet.time();
            
            // Loops until the time is different
            while (this.memGet.time() === previousTime) {
                // frame advance with NOP
                this.frameAdvance();
            }
        }
    }

    /**
     * Skip a death animation by forcing Mario to death.
     */
    public killMario() {
        // force Mario's state to dead
        this.nes.cpu.mem[0x000e] = 0x06;
        // step forward one frame
        this.frameAdvance();
    }
}