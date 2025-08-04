import createHistoryMiddleware from './createHistoryMiddleware';
import createNavigationListenerMiddleware from './createNavigationListenerMiddleware';
import ensureLocationMiddleware from './ensureLocationMiddleware';

export default function createReduxMiddlewares({
  protocol,
  middlewares = [],
}) {
  const navigationListenerMiddleware = createNavigationListenerMiddleware();

  return [
    ensureLocationMiddleware,
    navigationListenerMiddleware,
    ...middlewares,
    createHistoryMiddleware(protocol),
    ...[...middlewares].reverse(),
    navigationListenerMiddleware,
  ];
}
