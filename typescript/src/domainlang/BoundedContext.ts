import { StructureElement } from '.';

export class BoundedContext extends StructureElement {
  constructor(args: { description?: string; owner?: string; relationships?: BoundedContext[] }) {
    super();

    this.description = args.description;
    this.owner = args.owner;
    this.relationships = args.relationships;
  }
  public readonly description?: string;
  public readonly owner?: string;
  public readonly relationships?: BoundedContext[];
}
