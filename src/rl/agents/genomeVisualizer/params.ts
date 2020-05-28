import StringParam from "src/rl/stringParam";

export default class GenomeVisualizerParams {
    public readonly fileInput = new StringParam("File", "Genomes", "__NULL__", "file"); 
}