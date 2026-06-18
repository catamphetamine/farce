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
 * * The `location` argument is of type `LocationBase` when blocking a navigation that was initiated outside of the application code.
 *   For example, when the user clicks "Back" or "Forward" button in a web browser.
 */
export type NavigationBlocker = (
  location: LocationBase | null,
) => NavigationBlockerResult;

// I dunno why did they use an `interface` here.
export interface BeforeLocationChangeListener {
  (location: Location): void;
}

export type ShouldChangeScrollPositionOnLocationChange = (
  prevLocation: Location | undefined,
  newLocation: Location,
) => boolean;

export function addBasePath<L extends InputLocation>(
  location: L,
  basePath?: string,
): L;
export function removeBasePath<L extends InputLocation>(
  location: L,
  basePath?: string,
): L;

export function isRelativeUrl(url: string): boolean;

export function getLocationUrl(location: InputLocationObject): string;
export function parseLocationUrl(locationUrl: string): LocationBase;

export function parseInputLocation(location: InputLocation): LocationBase;

export interface NavigationStackOptions<ScrollableContainer, ScrollPositionAnchor> {
  basePath?: string;
  manageScrollPosition?: boolean;
  shouldChangePageScrollPositionOnLocationChange?: ShouldChangeScrollPositionOnLocationChange;
  scrollPositionSetter?: ScrollPositionSetterConstructor<ScrollableContainer, ScrollPositionAnchor>;
}

export class NavigationStack<
  ScrollableContainer = any,
  ScrollPositionAnchor = any,
> {
  constructor(
    environment: EnvironmentConstructor<ScrollableContainer, ScrollPositionAnchor>,
    options?: NavigationStackOptions<ScrollableContainer, ScrollPositionAnchor>,
  );

  addScrollableContainer(
    scrollableContainerKey: string,
    scrollableContainer: ScrollableContainer,
    options?: {
      shouldChangeScrollPositionOnLocationChange?: ShouldChangeScrollPositionOnLocationChange
    }
  ): () => void;

  addNavigationBlocker(blocker: NavigationBlocker): () => void;

  dataStorage: LocationDataStorage;

  subscribe(listener: (location: Location) => void): () => void;

  // entries(): Location[];

  // size(): number;

  current(): Location;

  init(initialLocation?: InputLocation): void;

  push(location: InputLocation): void;

  replace(location: InputLocation): void;

  shift(delta: number): void;

  locationRendered(location: Location): Promise<void>;

  stop(): void;
}

export default class WebNavigationStack
  extends NavigationStack<WebScrollableContainer, WebScrollPositionAnchor> {
  constructor(
    options?: NavigationStackOptions<WebScrollableContainer, WebScrollPositionAnchor>,
  );
}

export type SessionTerminationBlocker = () => boolean | undefined;

interface SessionExecutionStatusListenerParameters {
  running: boolean;
}

export type SessionExecutionStatusListener = (
  parameters: SessionExecutionStatusListenerParameters,
) => void;

export type ScrollListener = () => void;

export class ServerSideRedirectError extends Error {
  constructor(location: LocationBase);

  location: LocationBase;
}

export class NavigationOutOfBoundsError extends Error {
  constructor(index: number);

  index: number;
}

export class EnvironmentNavigation {
  // Subscribes to "asynchronous" changes of the current location.
  subscribeToAsyncrhonousLocationUpdates(
    listener: (location: LocationInternal) => void,
    parameters: {
      getNextLocationKey: () => string,
    },
  ): () => void;

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

export interface EnvironmentLifecycle {
  running: boolean;
  addTerminationBlocker(blocker: SessionTerminationBlocker): () => void;
  addExecutionStatusListener(
    listener: SessionExecutionStatusListener,
  ): () => void;
}

export interface EnvironmentLog {
  debug(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

type ScrollPosition = [number, number];

// Manages scroll position in an environment such as a web browser.
export interface EnvironmentScrollPosition<ScrollableContainer, ScrollPositionAnchor> {
  // Gets numeric scroll position of a page.
  getPageScrollPosition(): ScrollPosition;
  // Sets numeric scroll position of a page.
  setPageScrollPosition(scrollPosition: ScrollPosition): void;
  // Sets scroll position of a page to be at an "anchor".
  setPageScrollPositionAtAnchor(anchor: ScrollPositionAnchor): void;
  // Gets numeric scroll position of a scrollable element.
  getScrollableContainerScrollPosition(
    scrollableContainer: ScrollableContainer,
  ): ScrollPosition;
  // Sets numeric scroll position of a scrollable element.
  setScrollableContainerScrollPosition(
    scrollableContainer: ScrollableContainer,
    scrollPosition: ScrollPosition,
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

export interface EnvironmentConstructor<ScrollableContainer, ScrollPositionAnchor> {
  new (): Environment<ScrollableContainer, ScrollPositionAnchor>;
}

export interface Environment<ScrollableContainer, ScrollPositionAnchor> {
  dataStorage: EnvironmentDataStorage;
  log: EnvironmentLog;
  lifecycle: EnvironmentLifecycle;
  navigation: EnvironmentNavigation;
  scrollPosition: EnvironmentScrollPosition<ScrollableContainer, ScrollPositionAnchor>;
}

// This is just a copy-paste of the `Environment` interface above.
declare abstract class EnvironmentClass<ScrollableContainer, ScrollPositionAnchor>
  implements Environment<ScrollableContainer, ScrollPositionAnchor> {
  dataStorage: EnvironmentDataStorage;
  log: EnvironmentLog;
  lifecycle: EnvironmentLifecycle;
  navigation: EnvironmentNavigation;
  scrollPosition: EnvironmentScrollPosition<ScrollableContainer, ScrollPositionAnchor>;
}

interface Session<ScrollableContainer = any, ScrollPositionAnchor = any> {
  // `key` should be unique within `environment.dataStorage`.
  // For example, `BrowserEnvironment` uses `window.sessionStorage`
  // that is shared across different sessions within a given web browser tab,
  // hence the uniqueness requirement.
  key: string;

  // Private varibles. Not public API.
  environment: Environment<ScrollableContainer, ScrollPositionAnchor>;
  // history: LocationInternal[];
  lifecycle: EnvironmentLifecycle;

  subscribe(listener: (location: LocationInternal) => void): () => void;

  start(initialLocation?: LocationBase): void;

  stop(): void;

  navigate(operation: PushOrReplaceOperation, location: LocationBase): void;

  shift(delta: number): void;
}

type WebScrollableContainer = HTMLElement;
type WebScrollPositionAnchor = string;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export class WebBrowserEnvironment extends EnvironmentClass<WebScrollableContainer, WebScrollPositionAnchor> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export class ServerSideRenderEnvironment extends EnvironmentClass<string, string> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export class InMemoryEnvironment extends EnvironmentClass<string, string> {}

export interface ScrollPositionSetterConstructorParameters<ScrollableContainer, ScrollPositionAnchor> {
  // `scrollPositionApi` provides the "core" functions for setting scroll position according to the environment.
  // For example, in the context of a `WebBrowserEnvironment`, it provides the functions for setting scroll position in a web browser.
  // Developers of "custom" scrolling behaviors could use these "core" functions to implement the "custom" scrolling behavior on top of them.
  scrollPositionApi: EnvironmentScrollPosition<ScrollableContainer, ScrollPositionAnchor>;
}

export interface ScrollPositionSetterConstructor<ScrollableContainer, ScrollPositionAnchor> {
  new (parameters: ScrollPositionSetterConstructorParameters<ScrollableContainer, ScrollPositionAnchor>): ScrollPositionSetter<ScrollableContainer, ScrollPositionAnchor>;
}

// A developer could pass their own `ScrollPositionSetter` implementation
// to enable some kind of "smooth" scrolling or something like that.
export interface ScrollPositionSetter<ScrollableContainer, ScrollPositionAnchor> {
  // Sets scroll position of a page or a scrollable element.
  // Returns a `Promise` that resolves when it has finished setting the scroll position.
  set(
    // This is the scroll position to set.
    // * When setting page scroll position, it could be either an anchor or numeric coordinates.
    // * When setting scrollable element scroll position, it could only be numeric coordinates.
    scrollPositionOrAnchor: ScrollPositionAnchor | ScrollPosition,
    // This is the scrollable container whose scroll position should be set.
    // * When setting page scroll position, `scrollableContainer` is `undefined`.
    // * When setting scrollable element scroll position, `scrollableContainer` is the scrollable element.
    scrollableContainer: ScrollableContainer,
  ): Promise<void>;

  // Cancels any pending (or in-progress) setting of scroll position.
  stop(): void;
}

// https://stackoverflow.com/questions/39392853/is-there-a-type-for-class-in-typescript-and-does-any-include-it
export type Constructor<T = any> = new (...args: any[]) => T;

export type DataStorageValue =
  | string
  | number
  | boolean
  | Record<string, unknown>;

// This class is used internally in `LocationDataStorage` class.
declare class DataStorage<
  Key extends string = string,
  Value = DataStorageValue,
> {
  constructor(
    options: {
      dataStorage: EnvironmentDataStorage,
      log: EnvironmentLog,
      namespace: string,
    },
  );

  get(key: Key): Value | null;

  set(key: Key, value: Value | null): void;
}

declare class LocationDataStorage<
  Key extends string = string,
  Value = DataStorageValue,
> {
  constructor(
    options: {
      dataStorage: EnvironmentDataStorage,
      log: EnvironmentLog,
      namespace: string,
    },
  );

  get(location: Location, key: Key): Value | null;

  set(location: Location, key: Key, value: Value | null): void;
}

export class ScrollPositionRestoration<
  ScrollableContainer = any,
  ScrollPositionAnchor = any,
> {
  constructor(
    session: Session<ScrollableContainer, ScrollPositionAnchor>,

    options?: {
      // Using this option, a developer could provide their own implementation of setting
      // a scroll position. For example, it could use "smooth" (animated) scrolling, etc.
      // When specified, it applies to both page and any scrollable containers.
      scrollPositionSetter: ScrollPositionSetterConstructor<ScrollableContainer, ScrollPositionAnchor>,

      shouldChangePageScrollPositionOnLocationChange?: ShouldChangeScrollPositionOnLocationChange,

      // `options._getSavedPageScrollPositionOnLocationChange`
      // isn't used in real life and is not part of the public API.
      // It's only used in tests.
      _getSavedPageScrollPositionOnLocationChange?: (
        location: Location,
        prevLocation: Location | undefined,
      ) => ScrollPosition | undefined;
    },
  );

  addScrollableContainer(
    scrollableContainerKey: string,
    scrollableContainer: ScrollableContainer,

    options?: {
      shouldChangeScrollPositionOnLocationChange?: ShouldChangeScrollPositionOnLocationChange,

      // `_options._getSavedScrollPositionOnLocationChange`
      // isn't used in real life and is not part of the public API.
      // It's only used in tests.
      _getSavedScrollPositionOnLocationChange?: (
        location: Location,
        prevLocation: Location | undefined,
      ) => ScrollPosition | undefined;
    },
  ): () => void;

  locationRendered: (location: Location) => Promise<void>;

  stop(): void;

  // `_enableSavingScrollPosition()` and `_disableSavingScrollPosition()`
  // aren't used in real life and are not part of the public API.
  // They're only used in tests.
  _enableSavingScrollPosition(): void;

  // `_enableSavingScrollPosition()` and `_disableSavingScrollPosition()`
  // aren't used in real life and are not part of the public API.
  // They're only used in tests.
  _disableSavingScrollPosition(): void;
}
