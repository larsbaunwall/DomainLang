export class StructureElement {
  public get type(): string {
    return this.constructor.name;
  }
}
