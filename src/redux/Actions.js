import ActionTypes from './ActionTypes';

export default {
  init: (initialLocation) => ({
    type: ActionTypes.INIT,
    payload: initialLocation,
  }),

  push: (location) => ({
    type: ActionTypes.PUSH,
    payload: location,
  }),

  replace: (location) => ({
    type: ActionTypes.REPLACE,
    payload: location,
  }),

  shift: (delta) => ({
    type: ActionTypes.SHIFT,
    payload: delta,
  }),

  stop: () => ({
    type: ActionTypes.STOP,
  }),
};
