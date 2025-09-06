import ActionTypesInternal from './ActionTypesInternal';

export default function internalLocationReducer(state, action) {
  // eslint-disable-next-line no-underscore-dangle
  if (action.type === ActionTypesInternal.INTERNAL_LOCATION_UPDATE) {
    return action.payload;
  }
  return state;
}
