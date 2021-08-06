import { BoundedContext } from '.';

// eslint-disable-next-line @typescript-eslint/ban-types
type Me = unknown;

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

export interface Conformist {
  upstream: BoundedContext | Me;
  downstream: BoundedContext | Me;
}

export interface OpenHostService {
  downstream: BoundedContext[];
}
export function conformist(to: BoundedContext): Relationship {
  return <Conformist>{ upstream: to };
}

export function openHostService(downstream: BoundedContext[]): Relationship {
  return <OpenHostService>{ downstream: downstream };
}

export type Relationship = CustomerSupplier | UpstreamDownstream | Conformist | OpenHostService;
