import { InputLocation, Session } from '../index.d.js';

export interface CreateMiddlewaresOptions {
  basePath?: string;
}

export function createMiddlewares(
  session: Session,
  options?: CreateMiddlewaresOptions,
): Middleware[];

export const ActionTypes: {
  INIT: '@@navigation-stack/INIT';
  PUSH: '@@navigation-stack/PUSH';
  REPLACE: '@@navigation-stack/REPLACE';
  NAVIGATE: '@@navigation-stack/NAVIGATE';
  SHIFT: '@@navigation-stack/SHIFT';
  UPDATE: '@@navigation-stack/UPDATE';
  STOP: '@@navigation-stack/STOP';
};

export interface InitAction {
  type: (typeof ActionTypes)['INIT'];
  payload?: InputLocation;
}

export interface PushAction {
  type: (typeof ActionTypes)['PUSH'];
  payload: InputLocation;
}

export interface ReplaceAction {
  type: (typeof ActionTypes)['REPLACE'];
  payload: InputLocation;
}

export interface ShiftAction {
  type: (typeof ActionTypes)['SHIFT'];
  payload: number;
}

export interface DisposeAction {
  type: (typeof ActionTypes)['STOP'];
}

export type Action =
  | InitAction
  | PushAction
  | ReplaceAction
  | ShiftAction
  | DisposeAction;

export const Actions: {
  init(initialLocation?: InputLocation): InitAction;
  push(location: InputLocation): PushAction;
  replace(location: InputLocation): ReplaceAction;
  shift(delta: number): ShiftAction;
  stop(): DisposeAction;
};

export const locationReducer: Reducer<Location, Action>;

// The following types are copy-pasted from `redux`.

interface ReduxAction<T = any> {
  type: T;
}

interface AnyAction extends ReduxAction {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any;
}

interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T): T;
}

interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
  dispatch: D;
  getState(): S;
}

interface Middleware<S = any, D extends Dispatch = Dispatch> {
  (api: MiddlewareAPI<D, S>): (next: Dispatch) => (action: any) => any;
}

type Reducer<S = any, A extends Action = AnyAction> = (
  state: S | undefined,
  action: A,
) => S;
