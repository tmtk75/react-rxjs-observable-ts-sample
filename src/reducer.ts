import { handleActions, Action } from "redux-actions"
import { combineReducers } from "redux"

const profile = handleActions({
  "SIGN-UP.resolved": (state: any, action: Action<any>) => {
    return Object.assign({}, state, {user: action.payload});
  },
  "SIGN-IN.resolved": (state: any, action: Action<any>) => {
    const { user, groups } = action.payload;
    return Object.assign({}, state, {
      user,
      group: groups ? groups[0] : null,
      groups,
    });
  },
  "JOIN.resolved": (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

const mqtt = handleActions({
  "CONNECTION-ALIVE": (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

const message = handleActions({
  "MESSAGE-ARRIVED":  (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

const rejected = (state: any = {}, action: Action<any>) => {
  if (action.type.match(/\.rejected$/)) {
    console.error(action.type, action.payload);
  }
  return state;
}

export const reducer = combineReducers({
  kiicloud: combineReducers({
    profile,
    mqtt,
  }),
  message,
  rejected,
})

