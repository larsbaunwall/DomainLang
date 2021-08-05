import { BoundedContext } from ".";

type Me = {}

/**
 * Represents the current structure element
 */
export const me: Me = {};

export interface CustomerSupplier {
  customer: BoundedContext | Me;
  supplier: BoundedContext | Me;
}

export interface UpstreamDownstream {
  upstream: BoundedContext | Me;
  downstream: BoundedContext | Me;
}

export type Relationship = CustomerSupplier | UpstreamDownstream;
