import { BoundedContext, StructureElement } from '.';

export class Domain extends StructureElement {
  constructor(args: DomainArgs) {
    super();

    this.contains = args.contains;
    this.description = args.description;
  }

  public readonly contains: BoundedContext[];
  public readonly description?: string;
}

export interface DomainArgs {
  description?: string;
  contains: BoundedContext[];
}
