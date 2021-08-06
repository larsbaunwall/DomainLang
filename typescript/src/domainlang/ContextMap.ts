import { BoundedContext, Domain, StructureElement } from '.';

export class ContextMap extends StructureElement {
  public readonly title?: string;
  public readonly description?: string;
  public readonly contains: (BoundedContext | Domain)[] = [];
}
