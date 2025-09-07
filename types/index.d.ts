// TypeScript Version: 3.0

export {};

export type Query = Record<string, string>;

// `InputLocationQuery` may specify query parameter values as any type of data.
// Those values will later be converted to strings.
export type InputLocationQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface LocationBase {
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
}

export interface Location extends LocationBase {
  /**
   * a unique key identifying the current history entry
   */
  key: string;

  /**
   * the current index of the history entry, starting at 0 for the initial
   * entry; this increments on `.push()` but not on `.replace()`
   */
  index: number;
}

type PushOrReplaceOperation = 'push' | 'replace';

export interface LocationInternal extends Location {
  /**
   * `navigation-stack` operation.
   */
  operation: PushOrReplaceOperation | 'shift' | 'init';
  /**
   * the difference between the index of the current location and the index of the previous location.
   */
  delta: number;
}

/**
 * Location descriptor object used in #push and #replace.
 */
export interface InputLocationObject {
  pathname: LocationBase['pathname'];
  search?: LocationBase['search'];
  query?: InputLocationQuery;
  hash?: LocationBase['hash'];
}

/**
 * Location input string: "/foo?bar=baz#qux"
 *
 * Equivalent location input object:
 * {
 *   pathname: '/foo',
 *   search: '?bar=baz',
 *   hash: '#qux'
 * }
 */
export type InputLocationString = string;

// Using an interface allows consumers to use object merging to add other
//  location descriptor types.
export interface InputLocationTypes {
  object: InputLocationObject;
  string: InputLocationString;
}

export type InputLocation = InputLocationTypes[keyof InputLocationTypes];

export type NavigationBlockerSyncResult = boolean | undefined;
export type NavigationBlockerResult =
  | NavigationBlockerSyncResult
  | Promise<NavigationBlockerSyncResult>;

/**
 * Navigation blocker function receives a `location` to which the application (or the user) is attempting to navigate.
 *
 * * The `location` argument is `null` when the web browser tab is about to be closed.
 * * The `location` argument is of type `LocationBase` when a `.push()` or `.replace()` navigation is blocked.
 * * The `location` argument is of type `Location` when blocking a navigation that was initiated outside of the application code.
 *   For example, when the user clicks "Back" or "Forward" button in a web browser.
 */
export type NavigationBlocker = (
  location: Location | LocationBase | null,
) => NavigationBlockerResult;

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

export function parseInputLocation(location: InputLocation): LocationBase;

export function addNavigationBlocker(
  session: Session,
  blocker: NavigationBlocker,
): () => void;

export interface NavigationStackOptions {
  basePath?: string;
  maintainScrollPosition?: boolean;
}

export class NavigationStack<ScrollableContainer = any, Anchor = any> {
  constructor(
    session: Session<ScrollableContainer, Anchor>,
    options?: NavigationStackOptions,
  );

  addScrollableContainer(
    scrollableContainerKey: string,
    scrollableContainer: ScrollableContainer,
  ): () => void;

  subscribe(listener: (location: Location) => void): () => void;

  current(): Location;

  init(initialLocation?: InputLocation): void;

  push(location: InputLocation): void;

  replace(location: InputLocation): void;

  shift(delta: number): void;

  locationRendered(): Promise<void>;

  stop(): void;
}

export type SessionTerminationBlocker = () => boolean | undefined;

interface SessionExecutionStatusListenerParameters {
  running: boolean;
}

export type SessionExecutionStatusListener = (
  parameters: SessionExecutionStatusListenerParameters,
) => void;

export type ScrollListener = () => void;

export class ServerSideNavigationError extends Error {
  constructor(location: LocationBase);

  location: LocationBase;
}

export class NavigationOutOfBoundsError extends Error {
  constructor(index: number);

  index: number;
}

export class Navigation {
  // Subscribes to "location change" events.
  subscribe(listener: (location: LocationInternal) => void): () => void;

  init(
    initialLocation: LocationBase,
    parameters: Pick<
      LocationInternal,
      'operation' | 'key' | 'index' | 'delta'
    >,
  ): LocationInternal | undefined;

  navigate(
    location: LocationBase,
    parameters: Pick<
      LocationInternal,
      'operation' | 'key' | 'index' | 'delta'
    >,
  ): LocationInternal | undefined;

  shift(
    parameters: Pick<LocationInternal, 'operation' | 'index' | 'delta'>,
  ): LocationInternal | undefined;

  getInitialLocation(): InputLocation | undefined;
}

export interface EnvironmentDataStorage {
  get(key: string): string | null;
  remove(key: string): void;
  set(key: string, value: string): void;
}

export interface SessionLifecycle {
  addTerminationBlocker(blocker: SessionTerminationBlocker): () => void;
  addExecutionStatusListener(
    listener: SessionExecutionStatusListener,
  ): () => void;
}

// Manages scroll position in an environment such as a web browser.
export interface EnvironmentScrollPosition<ScrollableContainer, Anchor> {
  // Gets numeric scroll position of a page.
  getPageScrollPosition(): [number, number];
  // Sets numeric scroll position of a page.
  setPageScrollPosition(scrollPosition: [number, number]): void;
  // Sets scroll position of a page to be at an "anchor".
  setPageScrollPositionAtAnchor(anchor: Anchor): void;
  // Gets numeric scroll position of a scrollable element.
  getScrollableContainerScrollPosition(
    scrollableContainer: ScrollableContainer,
  ): [number, number];
  // Sets numeric scroll position of a scrollable element.
  setScrollableContainerScrollPosition(
    scrollableContainer: ScrollableContainer,
    scrollPosition: [number, number],
  ): void;
  // Adds "on scroll" listeners.
  addPageScrollListener(listener: ScrollListener): () => void;
  addScrollableContainerScrollListener(listener: ScrollListener): () => void;
  // These methods could be used to disable environment's automatic scroll position restoration feature,
  // such as the one present in web browsers, so that the code could control it manually.
  enableAutomaticScrollRestoration(): void;
  disableAutomaticScrollRestoration(): void;
  // `init()` is called every time when a new page is rendered.
  init(): void;
}

export interface Environment<ScrollableContainer, Anchor> {
  dataStorage: EnvironmentDataStorage;
  scrollPosition: EnvironmentScrollPosition<ScrollableContainer, Anchor>;
}

export interface Session<ScrollableContainer = any, Anchor = any> {
  // `key` should be unique within `environment.dataStorage`.
  // For example, `BrowserEnvironment` uses `window.sessionStorage`
  // that is shared across different sessions within a given web browser tab,
  // hence the uniqueness requirement.
  key: string;

  // Private varibles. Not public API.
  environment: Environment<ScrollableContainer, Anchor>;

  lifecycle: SessionLifecycle;

  subscribe(listener: (location: LocationInternal) => void): () => void;

  start(initialLocation?: LocationBase): void;

  stop(): void;

  navigate(operation: PushOrReplaceOperation, location: LocationBase): void;

  shift(delta: number): void;
}

// This is just a copy-paste of the `session` interface above.
declare abstract class SessionBaseClass<
  ScrollableContainer = any,
  Anchor = any,
> implements Session<ScrollableContainer, Anchor>
{
  constructor(parameters: { navigation: Navigation });

  // `key` should be unique within `environment.dataStorage`.
  // For example, `BrowserEnvironment` uses `window.sessionStorage`
  // that is shared across different sessions within a given web browser tab,
  // hence the uniqueness requirement.
  key: string;

  // Private varibles. Not public API.
  environment: Environment<ScrollableContainer, Anchor>;

  lifecycle: SessionLifecycle;

  subscribe(listener: (location: LocationInternal) => void): () => void;

  start(initialLocation?: LocationBase): void;

  stop(): void;

  navigate(operation: PushOrReplaceOperation, location: LocationBase): void;

  shift(delta: number): void;
}

export class WebBrowserSession extends SessionBaseClass<HTMLElement, string> {
  constructor();
}

export class ServerSideRenderSession extends SessionBaseClass<string, string> {
  constructor();
}

export class InMemorySession extends SessionBaseClass<string, string> {
  constructor();
}
