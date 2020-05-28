import * as JsNES from "jsnes";
import RAMGetter from "./ramGetter";
import RAMSetter from "./ramSetter";

export default class EmuManager {
    public world: number;
    public stage: number;
    
    public nes: JsNES.NES;

    public memGet: RAMGetter;
    public memSet: RAMSetter;

    constructor(nes: JsNES.NES, world: number, stage: number) {
        this.nes = nes;
        this.world = world;
        this.stage = stage;
        this.memGet = new RAMGetter(nes);
        this.memSet = new RAMSetter(this.nes, this.memGet);
    }

    /**
     * Handles any RAM hacking after a step occurs.
     */
    public step() : number {
        if (this.memGet.hasReachedFlag()) {
            return 2;
        }

        const isDone = this.isDone();

        // if mario is dying, then cut to the chase and kill him
        if (this.memGet.isDying()) {
            this.memSet.killMario();
        }
        
        this.memSet.skipEndOfWorld();

        // skip area change (i.e. enter pipe, flag get, etc.)
        this.memSet.skipChangeArea();
        
        // skips occupied states like the black screen between lives that shows
        // how many lives the player has left
        this.memSet.skipOccupiedStates();
        
        return isDone ? 1 : 0;
    }

    public isDone() {
        return this.memGet.isDying() || this.memGet.isDead();
    }
}
 