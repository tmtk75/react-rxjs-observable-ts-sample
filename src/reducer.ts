import { handleActions, Action } from "redux-actions"
import { combineReducers } from "redux"

const kiicloud = handleActions({
  "SIGN-UP.resolved": (state: any, action: Action<any>) => {
    return Object.assign({}, state, {user: action.payload});
  },
  "SIGN-IN.resolved": (state: any, action: Action<any>) => {
    const { user, groups } = action.payload;
    return Object.assign({}, state, {
      user,
      group: groups ? groups[0] : null,
    });
  },
  "JOIN.resolved": (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

const mqttConection = handleActions({
  "CONNECTION-ALIVE": (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

const message = handleActions({
  "MESSAGE-ARRIVED":  (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

export const reducer = combineReducers({
  kiicloud,
  message,
  mqttConection,
})

