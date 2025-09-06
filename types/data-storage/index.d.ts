// TypeScript Version: 3.0

import { Session } from '../index.d.js';

export {};

export type GenericValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null
  | undefined;

export class DataStorage<
  Key extends string = string,
  Value extends GenericValue = GenericValue,
> {
  constructor(session: Session, options: { namespace: string });

  get(key: Key): Value;

  set(key: Key, value: Value): void;
}

export class LocationDataStorage<
  Key extends string = string,
  Value extends GenericValue = GenericValue,
> {
  constructor(session: Session, options: { namespace: string });

  get(location: Location, key: Key): Value;

  set(location: Location, key: Key, value: Value): void;
}
