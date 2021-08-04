import { Relationship } from ".";

export interface BoundedContext {
  description?: String;
  owner?: String;
  relationships?: Relationship[];
}
