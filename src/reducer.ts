import { handleActions, Action } from "redux-actions"
import { combineReducers } from "redux"
import { KiiUser, KiiGroup, KiiTopic, KiiMqttEndpoint } from "kii-sdk"
import * as Paho from "paho"

const assign = Object.assign;

const profile = handleActions({
  "SIGN-UP.resolved": (s: ProfileState, a: Action<KiiUser>) => {
    return assign({}, s, {user: a.payload});
  },
  "SIGN-IN.resolved": (s: ProfileState, a: Action<{user: KiiUser, groups: Array<KiiGroup>}>) => {
    const { user, groups } = a.payload;
    return assign({}, s, {
      user,
      group: groups ? groups[0] : null,
      groups,
    });
  },
  "SIGN-OUT": (s: ProfileState, a: Action<KiiUser>) => {
    return assign({}, s, {user: null});
  },
  "JOIN.resolved": (s: ProfileState, a: Action<{user: KiiUser, group: KiiGroup}>) => {
    return assign({}, s, a.payload);
  },
  "CONNECT.resolved": (s: ProfileState, a: Action<{topic: KiiTopic}>) => {
    return assign({}, s, a.payload);
  },
}, {} /* initial state */)

const mqtt = handleActions({
  "CONNECTION-ALIVE": (s: MQTTState, a: Action<{endpoint: KiiMqttEndpoint, client: Paho.MQTT.Client}>) => {
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

const rejected = (s: any = {}, a: Action<Error>) => {
  if (a.type.match(/\.rejected$/)) {
    console.error(a.type, a.payload);
  }
  return assign({}, s, {payload: a.payload});
}

export const reducer = combineReducers({
  kiicloud: combineReducers({
    profile,
    mqtt,
  }),
  message,
  error: combineReducers({
    rejected,
  }),
})

