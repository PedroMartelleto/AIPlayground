import * as JsNES from "jsnes";

// a set of state values indicating that Mario is "busy"
const BUSY_STATES = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x07];

// RAM addresses for enemy types on the screen
const ENEMY_TYPE_ADDRESSES = [0x0016, 0x0017, 0x0018, 0x0019, 0x001A];

const STAGE_OVER_ENEMIES = [0x2D, 0x31];

export default class RAMGetter {
    public nes: JsNES.NES;

    public constructor(nes: JsNES.NES) {
        this.nes = nes;
    }

    public time() {
        return this.nes.cpu.mem[0x07f8] * 100 + this.nes.cpu.mem[0x07f9] * 10 + this.nes.cpu.mem[0x07FA];
    }

    /**
     * Returns the number of remaining lives.
     */
    public lifes() {
        return this.nes.cpu.mem[0x075A];
    }

    /**
     * Return the current horizontal position.
     */
    public xPosition() {
        // add the current page 0x6d to the current x
        return this.nes.cpu.mem[0x6d] * 0x100 + this.nes.cpu.mem[0x86];
    }

    /**
     * Return the number of pixels from the left of the screen.
     */
    public leftXPosition() {
        // subtract the left x position 0x071c from the current x 0x86
        return (this.nes.cpu.mem[0x86] - this.nes.cpu.mem[0x071c]) % 256;
    }

    /**
     * Return the current vertical position.
     */
    public yPixel() {
        return this.nes.cpu.mem[0x03b8];
    }

    /**
     * Returns the current y viewport.
     * Note:
     *    1 = in visible viewport
     *    0 = above viewport
     *    > 1 below viewport (i.e. dead, falling down a hole)
     *    up to 5 indicates falling into a hole
     */
    public yViewport() {
        return this.nes.cpu.mem[0x00b5];
    }

    /**
     * Returns the current vertical position.
     */
    public yPosition() {
        // check if Mario is above the viewport (the score board area)
        if (this.yViewport() < 1) {
            // y position overflows so we start from 255 and add the offset
            return 255 + (255 - this.yPixel());
        }

        // Inverts the y pixel into the distance from the bottom of the screen
        return 255 - this.yPixel();
    }

    public playerState() {
        /**
         * Returns the current player state.
         * Note:
         *    0x00 : Leftmost of screen
         *    0x01 : Climbing vine
         *    0x02 : Entering reversed-L pipe
         *    0x03 : Going down a pipe
         *    0x04 : Auto-walk
         *    0x05 : Auto-walk
         *    0x06 : Dead
         *    0x07 : Entering area
         *    0x08 : Normal
         *    0x09 : Cannot move
         *    0x0B : Dying
         *    0x0C : Palette cycling, can't move
         */
        return this.nes.cpu.mem[0x000e];
    }

    /**
     * Return True if Mario is in dying animation, False otherwise.
     */
    public isDying() {
        return this.playerState() === 0x0b || this.yViewport() > 1;
    }

    /**
     * Return True if Mario is dead, False otherwise.
     */
    public isDead() {
        return this.playerState() === 0x06;
    }

    /**
     * Returns True if the game has ended, False otherwise.
     */
    public isGameOver() {
        // the life counter will get set to 255 (0xff) when there are no lives
        // left. It goes 2, 1, 0 for the 3 lives of the game
        return this.lifes() === 0xff;
    }

    /**
     * Returns boolean whether Mario is busy with in-game garbage.
     */
    public isBusy() {
        return BUSY_STATES.includes(this.playerState());
    }

    /**
     * Returns a boolean determining if the world is over.
     */
    public isWorldOver() {
        // 0x0770 contains GamePlay mode:
        // 0 => Demo
        // 1 => Standard
        // 2 => End of world
        return this.nes.cpu.mem[0x0770] === 2;
    }

    /**
     * Return a boolean determining if the level is over.
     */
    public isStageOver() {
        // iterate over the memory addresses that hold enemy types
        for (const address of ENEMY_TYPE_ADDRESSES) {
            // check if the byte is either Bowser (0x2D) or a flag (0x31)
            // this is to prevent returning true when Mario is using a vine
            // which will set the byte at 0x001D to 3
            if (STAGE_OVER_ENEMIES.includes(this.nes.cpu.mem[address])) {
                // player float state set to 3 when sliding down flag pole
                return this.nes.cpu.mem[0x001D] === 3;
            }
        }

        return false;
    }

    /**
     * Returns a boolean determining if the agent has reached the flag.
     */
    public hasReachedFlag() {
        return this.isWorldOver() || this.isStageOver();
    }
}