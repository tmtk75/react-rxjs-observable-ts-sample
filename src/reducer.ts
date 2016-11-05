import { handleActions, Action } from "redux-actions"
import { combineReducers } from "redux"
import { KiiUser, KiiGroup, KiiTopic, KiiMqttEndpoint, KiiPushMessage } from "kii-sdk"
import * as Paho from "paho"

const assign = Object.assign;

const profile = handleActions({
  "SIGN-UP.resolved": (s: ProfileState, a: Action<KiiUser>) =>
    assign({}, s, {user: a.payload, group: null}),

  "SIGN-IN.resolved": (s: ProfileState, a: Action<{user: KiiUser, groups: Array<KiiGroup>}>) => {
    const { user, groups } = a.payload;
    return assign({}, s, {
      user,
      group: groups ? groups[0] : null,
      groups,
    });
  },

  "SIGN-OUT": (s: ProfileState, a: Action<{} /* NOTE: this should be as-is. If not, type error happens */>) =>
    assign({}, s, {user: null}),

  "JOIN.resolved": (s: ProfileState, a: Action<{user: KiiUser, group: KiiGroup}>) =>
    assign({}, s, a.payload),

  "CONNECT.resolved": (s: ProfileState, a: Action<{topic: KiiTopic}>) =>
    assign({}, s, a.payload),

  "LOAD-MEMBERS.resolved": (s: ProfileState, a: Action<Array<KiiUser>>) =>
    assign({}, s, {members: a.payload}),
}, {members: []} /* initial state */)

const mqtt = handleActions({
  "CONNECTION-ALIVE": (s: MQTTState, a: Action<{endpoint: KiiMqttEndpoint, client: Paho.MQTT.Client}>) =>
    assign({}, s, a.payload),

  "CONNECTION-LOST": (s: MQTTState, a: Action<{}>) =>
    assign({}, s, {endpoint: null, client: null}),

  "CONNECT.start-retry": (s: MQTTState, a: Action<{}>) =>
    assign({}, s, {retryCount: 0}),

  "CONNECT.retry": (s: MQTTState, a: Action<{}>) =>
    assign({}, s, {retryCount: s.retryCount + 1}),

  "CONNECT.end-retry": (s: MQTTState, a: Action<{}>) =>
    assign({}, s, {retryCount: null}),
}, {} /* initial state */)

const message = handleActions({
  "MESSAGE-ARRIVED":  (s: any, a: Action<KiiPushMessage>) =>
    assign({}, s, a.payload),
}, {} /* initial state */)

function asMap(a: Array<KiiUser>): {[userId: string]: KiiPushMessage} {
  const m = Object.create(null);
  a.forEach(u => {
    m[u.getUUID()] = u;
  });
  return m;
}

const members = handleActions({
  "LOAD-MEMBERS.resolved":  (s: MembersState, a: Action<Array<KiiUser>>) =>
    assign({}, s, asMap(a.payload)),
}, {} /* initial state */)

const error = (s: any = {}, a: Action<Error>) => {
  if (a.type.match(/\.rejected$/)) {
    console.error(a.type, a.payload);
    return assign({}, s, {rejected: a.payload});
  } else if (a.type.match(/\.resolved/)) {
    return assign({}, s, {rejected: null});
  }
  return s;
}

export const reducer = combineReducers({
  kiicloud: combineReducers({
    profile,
    mqtt,
  }),
  message,
  members,
  error,
})

