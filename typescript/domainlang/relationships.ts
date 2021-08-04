import { BoundedContext } from ".";

interface me {}
export const me: me = {};

export interface CustomerSupplier {
  customer: BoundedContext | me;
  supplier: BoundedContext | me;
}

export interface UpstreamDownstream {
  upstream: BoundedContext | me;
  downstream: BoundedContext | me;
}

export type Relationship = CustomerSupplier | UpstreamDownstream;
