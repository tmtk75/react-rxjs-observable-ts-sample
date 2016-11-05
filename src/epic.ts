import { Action } from "redux-actions"
import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import { combineEpics, ActionsObservable } from 'redux-observable'
import * as Paho from "paho"
import {
  Kii, KiiUser, KiiGroup, KiiTopic, KiiPushMessageBuilder, KiiPushMessage, KiiMqttEndpoint,
} from "kii-sdk"
import { connect, disconnect } from "./action"

namespace Epic {

  type ToPromise<P, S, R> = <P, S, R>(a: Action<P>, s: Redux.Store<S>) => Promise<R>

  export const fromPromise = <P, S, R>(type: string, genPromise: ToPromise<P, S, R>) =>
    (a: ActionsObservable<P>, store: Redux.Store<S>) => a.ofType(type)
      .mergeMap(action => Rx.Observable.fromPromise(genPromise(action, store)
        .catch(err => ({
          type: `${type}.rejected`,
          payload: err,
          error: true,
        }))))
      .map((e: Action<P> & P) => (e.error ? e: {type: `${type}.resolved`, payload: e}))

}

const signUpEpic = Epic.fromPromise(
  "SIGN-UP",
  ({ payload: { username, password } }: Action<SignUpPayload>) =>
    KiiUser.userWithUsername(username, password).register()
)

const signInEpic = Epic.fromPromise(
  "SIGN-IN",
  ({ payload: { username, password } }: Action<SignInPayload>) =>
    KiiUser.authenticate(username, password)
      .then(u => u.memberOfGroups())
      .then(([user, groups]) => ({user, groups}))
)

const signOutEpic = (a: ActionsObservable<{}>, store: Redux.Store<{kiicloud: KiiCloudState}>) =>
  a.ofType("SIGN-OUT").map(_ => disconnect(store.getState().kiicloud))

function join(token: string): Promise<{user: KiiUser, group: KiiGroup}> {
  return Kii.serverCodeEntry("join").execute({token})
    .then(([a, b, r]) => r.getReturnedValue().returnedValue)
    .then(v => {
      if (v.error)
        throw new Error(v.error)
      return v
    })
    .then(({ login, groups: [g] }) => Promise.all([
      KiiUser.findUserByUsername(login),
      KiiGroup.groupWithID(g).refresh(),
    ]))
    .then(([user, group]) => ({user, group}))
}

const joinEpic = Epic.fromPromise(
  'JOIN',
  ({ payload }: Action<JoinPayload>) => join(payload.github_token)
)

function getMQTTEndpoint(sender: KiiUser): Promise<KiiMqttEndpoint> {
  const s = sender.pushInstallation();
  return s.installMqtt(false)
    .then(({installationID}) => s.getMqttEndpoint(installationID))
}

function getTopic(group: KiiGroup, name: string): Promise<KiiTopic> {
  return group.listTopics()
    .then(([[topic], _]) => topic ? topic : group.topicWithName(name).save())
    .then(topic => KiiUser.getCurrentUser().pushSubscription().isSubscribed(topic))
    .then(([psub, topic, b]) => b ? Promise.resolve([psub, topic]) : psub.subscribe(topic))
    .then(([sub, topic]) => topic)
}

function connectWS(ep: KiiMqttEndpoint, store: Redux.Store<{kiicloud: KiiCloudState}>): Promise<Paho.MQTT.Client> {
  const { kiicloud: { mqtt } }  = store.getState()
  if (mqtt.client) {
    console.warn("skip connecting because MQTT client is found in store.", mqtt.client)
    return Promise.resolve(mqtt.client)
  }

  const client = new Paho.MQTT.Client(ep.host, ep.portWS, ep.mqttTopic);
  client.onConnectionLost = res => store.dispatch({type: "CONNECTION-LOST", payload: res});
  client.onMessageArrived = msg => store.dispatch({type: "MESSAGE-ARRIVED", payload: JSON.parse(msg.payloadString)});
  return new Promise((resolve, reject) => {
    client.connect({
      userName: ep.username,
      password: ep.password,
      onSuccess: () => {
        client.subscribe(ep.mqttTopic);
        resolve(client);
        store.dispatch({type: "CONNECTION-ALIVE", payload: {
          endpoint: ep,
          client,
        }});
      },
      onFailure: (err: Error) => reject(err),
    });
  })
}

function sendMessage(topic: KiiTopic, m: Object = {id: 12345, m: "hello"}): Promise<{}> {
  const data = {value: JSON.stringify(m)};
  const msg = new KiiPushMessageBuilder(data).build()
  return topic.sendMessage(msg)
}

const sendStatusEpic = Epic.fromPromise(
  "SEND-MESSAGE",
  ({ payload: { topic, status } }: Action<SendMessagePayload>) => sendMessage(topic, status)
)

//const messageArrivedEpic = epicFromPromise("MESSAGE-ARRIVED", (a: Action<KiiPushMessage>) =>
//  KiiUser.userWithURI(a.payload.senderURI).refresh()
//    .then(u => u.getUsername())
//)

const connectEpic = Epic.fromPromise(
  "CONNECT",
  ({ payload }: Action<ConnectPayload>, store: Redux.Store<{kiicloud: KiiCloudState}>) =>
    getMQTTEndpoint(KiiUser.getCurrentUser())
      .then(endpoint => getTopic(payload, "status")
        .then(topic => connectWS(endpoint, store)
          .then(_ => ({topic}))))
)

const connectionLostEpic = (a: ActionsObservable<{}>, store: Redux.Store<{kiicloud: KiiCloudState}>) =>
  Rx.Observable.of(
    a.ofType("CONNECTION-LOST")
      .filter(_ => !!store.getState().kiicloud.profile.user)
      .mapTo({type: "CONNECT.start-retry"}),

    a.ofType("CONNECT.start-retry")
      .do(_ => console.group("CONNECT.retry"))
      .mapTo({type: "CONNECT.retry"}),

    a.ofType("CONNECT.rejected").mapTo({type: "CONNECT.retry"}),

    a.ofType("CONNECT.retry")
      .map(_ => 1000 * (2 ** (store.getState().kiicloud.mqtt.retryCount - 1)))
      .do(t => console.log(`retry connecting ${t}ms later.`))
      .delayWhen(t => Rx.Observable.of(true).delay(t as number))
      .map(x => connect(store.getState().kiicloud.profile.group)),

    a.ofType("CONNECT.resolved")
      .filter(_ => store.getState().kiicloud.mqtt.retryCount > 0)
      .do(_ => {
        console.log(`retry connecting succeeded. retry-count: ${store.getState().kiicloud.mqtt.retryCount}`);
        console.groupEnd();
      })
      .mapTo({type: "CONNECT.end-retry"}),
  ).mergeAll()

//function inviteUser(invitee: string): Promise<KiiGroup> {
//  return KiiUser.findUserByUsername(invitee)
//    .then(user => [user, KiiGroup.groupWithID("kiicorp")])
//    .then(([user, group]) => {
//      (group as KiiGroup).addUser(user as KiiUser);
//      (group as KiiGroup).save()
//      return {user, group}
//    })
//}

const loadMembersEpic = Epic.fromPromise(
  "LOAD-MEMBERS",
  ({payload}: Action<KiiGroup>) =>
    payload.getMemberList()
      .then(([group, members]) => Promise.all(members.map(e => e.refresh())))
)

export const rootEpic = combineEpics(
  joinEpic,
  connectEpic,
  sendStatusEpic,
  //messageArrivedEpic,
  combineEpics(
    signUpEpic,
    signInEpic,
    signOutEpic,
  ),
  connectionLostEpic,
  loadMembersEpic,
);
