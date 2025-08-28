// TypeScript Version: 3.0

export {};

export type Query = Record<string, string>;

// `InputLocationQuery` may specify query parameter values as any type of data.
// Those values will later be converted to strings.
export type InputLocationQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface Location<TState = any> {
  /**
   * See the README on the `action` property of `location`.
   */
  action: 'PUSH' | 'REPLACE' | 'SHIFT' | 'INIT';
  /**
   * the path name; as on window.location e.g. '/foo'
   */
  pathname: string;
  /**
   * map version of search string
   */
  query: Query;
  /**
   * the search string; as on window.location e.g. '?bar=baz'
   */
  search: string;
  /**
   * the location hash; as on window.location e.g. '#qux'
   */
  hash: string;
  /**
   * a unique key identifying the current history entry
   */
  key: string;
  /**
   * the current index of the history entry, starting at 0 for the initial
   * entry; this increments on FarceActions.push but not on
   * FarceActions.replace
   */
  index: number;
  /**
   * the difference between the current index and the index of the previous location
   */
  delta: number;
  /**
   * any additional location state that the application might explicitly define and store
   */
  state: TState;
}

/**
 * Location descriptor object used in #push and #replace.
 */
export interface InputLocationObject {
  pathname: Location['pathname'];
  search?: Location['search'];
  query?: InputLocationQuery;
  hash?: Location['hash'];
  state?: Location['state'];
}

export interface LocationBase {
  pathname: Location['pathname'];
  search: Location['search'];
  query: Query;
  hash: Location['hash'];
  state?: Location['state'];
}

export interface NavigationLocation extends LocationBase {
  action: 'PUSH' | 'REPLACE';
}

/**
 * Location descriptor string:
 *  store.dispatch(FarceActions.push('/foo?bar=baz#qux'));
 *
 * Equivalent location descriptor object:
 *    store.dispatch(FarceActions.push({
 *     pathname: '/foo',
 *     search: '?bar=baz',
 *     hash: '#qux',
 *   }));
 *
 * https://github.com/4Catalyzer/farce#locations-and-location-descriptors
 */
export type InputLocationString = string;

// Using an interface allows consumers to use object merging to add other
//  location descriptor types.
export interface InputLocationTypes {
  object: InputLocationObject;
  string: InputLocationString;
}

export type InputLocation = InputLocationTypes[keyof InputLocationTypes];

export interface CreateMiddlewaresOptions {
  basePath?: string;
}

export type NavigationBlockerSyncResult = boolean | undefined;
export type NavigationBlockerResult =
  | NavigationBlockerSyncResult
  | Promise<NavigationBlockerSyncResult>;

/**
 * Navigation blocker function receives a `location` to which the application (or the user) is attempting to navigate.
 *
 * * The `location` argument is `null` when the web browser tab is about to be closed.
 * * The `location` argument is of type `NavigationLocation` when a `.push()` or `.replace()` action is blocked.
 * * The `location` argument is of type `Location` when blocking a navigation that was initiated outside of the application code.
 *   For example, when the user clicks "Back" or "Forward" button in a web browser.
 */
export interface NavigationBlocker {
  (location: Location | NavigationLocation | null): NavigationBlockerResult;
}

// I dunno why did they use an `interface` here.
export interface BeforeLocationChangeListener {
  (location: Location): void;
}

export function addBasePath<L extends InputLocation>(
  location: L,
  basePath?: string,
): L;
export function removeBasePath<L extends InputLocation>(
  location: L,
  basePath?: string,
): L;

export function getLocationUrl(location: InputLocationObject): string;
export function parseLocationUrl(locationUrl: string): LocationBase;

export function createMiddlewares(
  session: SessionBase,
  options?: CreateMiddlewaresOptions,
): Middleware[];

export function addNavigationBlocker(
  session: SessionBase,
  blocker: NavigationBlocker,
): () => void;

export function addBeforeLocationChangeListener(
  session: SessionBase,
  listener: BeforeLocationChangeListener,
): () => void;

export const ActionTypes: {
  INIT: '@@navigation-stack/INIT';
  PUSH: '@@navigation-stack/PUSH';
  REPLACE: '@@navigation-stack/REPLACE';
  NAVIGATE: '@@navigation-stack/NAVIGATE';
  SHIFT: '@@navigation-stack/SHIFT';
  UPDATE: '@@navigation-stack/UPDATE';
  DISPOSE: '@@navigation-stack/DISPOSE';
};

export interface InitAction {
  type: (typeof ActionTypes)['INIT'];
}

export interface PushAction {
  type: (typeof ActionTypes)['PUSH'];
  payload: InputLocation;
}

export interface ReplaceAction {
  type: (typeof ActionTypes)['REPLACE'];
  payload: InputLocation;
}

export interface RewindAction {
  type: (typeof ActionTypes)['SHIFT'];
  payload: number;
}

export interface DisposeAction {
  type: (typeof ActionTypes)['DISPOSE'];
}

export type Action =
  | InitAction
  | PushAction
  | ReplaceAction
  | RewindAction
  | DisposeAction;

export const Actions: {
  init(): InitAction;
  push(location: InputLocation): PushAction;
  replace(location: InputLocation): ReplaceAction;
  shift(delta: number): RewindAction;
  dispose(): DisposeAction;
};

type BeforeDestroyListener = () => boolean | undefined;

interface SessionNavigation {
  init(): void;

  // Subscribes to changes in location,
  // excluding ones that happened as a result of calling `.navigate()`.
  subscribe(listener: (location: Location) => void): () => void;

  navigate(location: NavigationLocation): Location;

  shift(delta: number): void;
}

interface SessionDataStorage {
  get(key: string): string | null;
  remove(key: string): void;
  set(key: string, value: string): void;
}

export interface Session {
  navigation: SessionNavigation;
  dataStorage: SessionDataStorage;
  addBeforeDestroyListener(listener: BeforeDestroyListener): void;

  // These're internal variables that're manually set under the hood.
  // _beforeLocationChangeListenersList?: Array<BeforeLocationChangeListener>;
  // _navigationBlockersList?: Array<NavigationBlocker>;
  // _removeBeforeDestroyListener?: () => void;
  // _navigationBlockersEvaluationStatus?: { cancelled?: boolean };
}

// This is just a copy-paste of the `session` interface above.
declare abstract class SessionBase implements Session {
  navigation: SessionNavigation;

  dataStorage: SessionDataStorage;

  addBeforeDestroyListener(listener: BeforeDestroyListener): void;

  // These're internal variables that're manually set under the hood.
  // _beforeLocationChangeListenersList?: Array<BeforeLocationChangeListener>;
  // _navigationBlockersList?: Array<NavigationBlocker>;
  // _removeBeforeDestroyListener?: () => void;
  // _navigationBlockersEvaluationStatus?: { cancelled?: boolean };
}

export class BrowserSession extends SessionBase {}

export interface MemorySessionOptions {
  save?: (data: string) => void;
  load?: () => string | undefined | null;
}

export class ServerSession extends SessionBase {
  constructor(initialLocation: InputLocation);
}

export class MemorySession extends SessionBase {
  constructor(initialLocation: InputLocation, options?: MemorySessionOptions);
}

export const locationReducer: Reducer<Location, Action>;

export class LocationDataStorage {
  constructor(session: Session, options: { namespace: string });

  get(location: Location, key: string): any;

  set(location: Location, key: string, value: any): void;
}

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
