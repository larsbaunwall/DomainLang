import { Relationship, StructureElement } from ".";

export class BoundedContext extends StructureElement {
  public get type(): String {
    return "BoundedContext"
  }
  
  public readonly description?: String;
  public readonly owner?: String;
  public readonly relationships?: Relationship[];
}
