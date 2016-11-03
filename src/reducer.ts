import { handleActions, Action } from "redux-actions"
import { combineReducers } from "redux"

const assign = Object.assign;

const profile = handleActions({
  "SIGN-UP.resolved": (s: any, a: Action<any>) => {
    return assign({}, s, {user: a.payload});
  },
  "SIGN-IN.resolved": (s: any, a: Action<any>) => {
    const { user, groups } = a.payload;
    return assign({}, s, {
      user,
      group: groups ? groups[0] : null,
      groups,
    });
  },
  "JOIN.resolved": (s: any, a: Action<any>) => {
    return assign({}, s, a.payload);
  },
  "CONNECT.resolved": (s: any, a: Action<any>) => {
    return assign({}, s, a.payload);
  },
}, {} /* initial state */)

const mqtt = handleActions({
  "CONNECTION-ALIVE": (s: MQTTState, a: Action<any>) => {
    return assign({}, s, a.payload);
  },
  "CONNECTION-LOST": (s: MQTTState, a: Action<any>) => {
    return assign({}, s, {endpoint: null, client: null});
  },
  "CONNECT.start-retry": (s: MQTTState, a: Action<any>) => {
    return assign({}, s, {retryCount: 0});
  },
  "CONNECT.retry": (s: MQTTState, a: Action<any>) => {
    return assign({}, s, {retryCount: s.retryCount + 1});
  },
  "CONNECT.end-retry": (s: MQTTState, a: Action<any>) => {
    return assign({}, s, {retryCount: null});
  },
}, {} /* initial state */)

const message = handleActions({
  "MESSAGE-ARRIVED":  (s: any, a: Action<any>) => {
    return assign({}, s, a.payload);
  },
}, {} /* initial state */)

const rejected = (s: any = {}, a: Action<any>) => {
  if (a.type.match(/\.rejected$/)) {
    console.error(a.type, a.payload);
  }
  return s;
}

export const reducer = combineReducers({
  kiicloud: combineReducers({
    profile,
    mqtt,
  }),
  message,
  rejected,
})

