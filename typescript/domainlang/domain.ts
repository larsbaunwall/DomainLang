import { BoundedContext, StructureElement } from ".";

export class Domain extends StructureElement {
  constructor(args: DomainArgs
  ) {
    super();

    this.contains = args.contains;
    this.description = args.description;
  }

  public get type() {
    return "Domain";
  }

  public readonly contains: BoundedContext[];
  public readonly description?: String;
}

export interface DomainArgs{
  description?: String,
  contains: BoundedContext[],
}