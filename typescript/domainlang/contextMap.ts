import { BoundedContext, Domain, StructureElement } from ".";

export class ContextMap extends StructureElement {
  public get type() {
    return "ContextMap";
  }
  public readonly title?: String;
  public readonly description?: String;
  public readonly contains: (BoundedContext | Domain)[];
}
