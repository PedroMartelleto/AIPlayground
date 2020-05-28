import LinkGene from './linkGene';

export default class AlleleGenesData {
    public matchingGenesA: LinkGene[] = [];
    public matchingGenesB: LinkGene[] = [];
    public disjointGenesA: LinkGene[] = [];
    public disjointGenesB: LinkGene[] = [];
    public excessGenesA: LinkGene[] = [];
    public excessGenesB: LinkGene[] = [];
}
