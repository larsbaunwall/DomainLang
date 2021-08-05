export abstract class StructureElement {
  public get name(): String {
    return this.constructor.name;
  }
  public abstract get type(): String;
}