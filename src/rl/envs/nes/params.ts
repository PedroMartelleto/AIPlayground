import Scalar from "../../scalar";

export default class NESParams {
    public readonly screenScale = new Scalar("Screen", "Scale", 2).wholeNumber().ranged(1, 5);
    public readonly disableGraphics = new Scalar("Screen", "Disable Graphics", 0).wholeNumber().ranged(0, 1);

    public readonly fitnessXWeight = new Scalar("Fitness", "X Distance", 1).ranged(0.001, 100);
    public readonly fitnessSpeedWeight = new Scalar("Fitness", "Speed", 0.1).ranged(0.001, 100);

    public readonly maxFramesStuck = new Scalar("Stop Conditions", "Max frames stuck", 200).wholeNumber().ranged(2, 120);

    /**
     * Number of times to repeat the stage
     */
    public readonly repeatStageCount = new Scalar("Stop Conditions", "Stage repeat count", 4).wholeNumber().ranged(0, 20);

    public readonly visionBoxRight = new Scalar("Inputs", "Vision Distance", 7).wholeNumber().ranged(1, 7);
    public readonly visionBoxLeft = new Scalar("Inputs", "Vision Distance", 1).wholeNumber().ranged(1, 7);
    public readonly visionBoxTop = new Scalar("Inputs", "Vision Distance", 3).wholeNumber().ranged(1, 7);
    public readonly visionBoxBottom = new Scalar("Inputs", "Vision Distance", 4).wholeNumber().ranged(1, 7);
    
    public readonly normalJumpTicks = new Scalar("Inputs", "Normal Jump Ticks", 9).wholeNumber().ranged(2, 120);
    public readonly longJumpTicks = new Scalar("Inputs", "Long Jump Ticks", 24).wholeNumber().ranged(2, 120);
}