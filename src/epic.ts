import { Action } from "redux-actions"
import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import { combineEpics, ActionsObservable } from 'redux-observable'
import * as Paho from "paho"
import {
  Kii, KiiUser, KiiGroup, KiiTopic, KiiPushMessageBuilder, KiiPushMessage, KiiMqttEndpoint,
} from "kii-sdk"

type ToPromise = (x: Action<any>, s: Redux.Store<any>) => Promise<any>

const epicFromPromise = (type: string, genPromise: ToPromise) =>
  (a: ActionsObservable<any>, store: Redux.Store<any>) => a.ofType(type)
    .mergeMap(action => Rx.Observable.fromPromise(genPromise(action, store)
      .catch(err => ({
        type: `${type}.rejected`,
        payload: err,
        error: true,
      }))))
    .map((payload: any) => (payload.error ? payload : {type: `${type}.resolved`, payload}))

const signUpEpic = epicFromPromise("SIGN-UP", (x: Action<SignUpPayload>) =>
  KiiUser.userWithUsername(x.payload.username, x.payload.password).register())

const signInEpic = epicFromPromise("SIGN-IN", (x: Action<SignInPayload>) =>
  KiiUser.authenticate(x.payload.username, x.payload.password)
    .then(u => u.memberOfGroups())
    .then(([user, groups]) => ({user, groups}))
)

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

const joinEpic = epicFromPromise('JOIN', (x: Action<JoinPayload>) => join(x.payload.github_token))

function kiiPush(sender: KiiUser): Promise<KiiMqttEndpoint> {
  const s = sender.pushInstallation();
  return s.installMqtt(false)
    .then(({installationID}) => s.getMqttEndpoint(installationID))
}

function kiiTopic(group: KiiGroup, name: string): Promise<KiiTopic> {
  return group.listTopics()
    .then(([[topic], _]) => topic ? topic : group.topicWithName(name).save())
    .then(topic => KiiUser.getCurrentUser().pushSubscription().isSubscribed(topic))
    .then(([psub, topic, b]) => b ? topic : psub.subscribe(topic))
    .then(payload => {
      //TODO: Not so cool
      if (payload instanceof KiiTopic) {
        return payload;
      }
      const [a, b] = payload;
      return b;
    })
}

function kiiWS(ep: KiiMqttEndpoint, store: Redux.Store<any>): Promise<Paho.MQTT.Client> {
  const client = new Paho.MQTT.Client(ep.host, ep.portWS, ep.mqttTopic);
  client.onConnectionLost = (res) => store.dispatch({type: "CONNECTION-LOST", payload: res});
  client.onMessageArrived = (msg) => store.dispatch({type: "MESSAGE-ARRIVED", payload: JSON.parse(msg.payloadString)});
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

function kiiSend(topic: KiiTopic, m: Object = {id: 12345, m: "hello"}): Promise<any> {
  const data = {value: JSON.stringify(m)};
  const msg = new KiiPushMessageBuilder(data).build()
  return topic.sendMessage(msg)
}

const sendStatusEpic = epicFromPromise("SEND-MESSAGE", (a: Action<SendMessagePayload>) =>
  kiiSend(a.payload.topic, a.payload.status)
)

//const messageArrivedEpic = epicFromPromise("MESSAGE-ARRIVED", (a: Action<KiiPushMessage>) =>
//  KiiUser.userWithURI(a.payload.senderURI).refresh()
//    .then(u => u.getUsername())
//)

const connectEpic = epicFromPromise("CONNECT", (action: Action<ConnectPayload>, store: Redux.Store<any>) =>
        kiiPush(KiiUser.getCurrentUser()).then(conf =>
          kiiTopic(action.payload, "status")
            .then(topic => kiiWS(conf, store)
              .then(_ => ({topic}))
            )))

const connectionLostEpic = (a: ActionsObservable<any>) =>
        a.ofType("CONNECTION-LOST")
         .mapTo({type: "RECONNECTING.start-retry"})

const startReconnectingEpic = (a: ActionsObservable<any>) =>
        a.ofType("RECONNECTING.start-retry")
         .do(_ => console.group("start-retry"))
         .mapTo({type: "RECONNECTING.retry"})

import { connect } from "./action"

const retryConnectingEpic = (a: ActionsObservable<any>, store: Redux.Store<{kiicloud: KiiCloudState}>) =>
        a.ofType("RECONNECTING.retry")
         .map(_ => 1000 * (2 ** (store.getState().kiicloud.mqtt.retryCount - 1)))
         .do(t => console.log(`retry connecting ${t}ms later.`))
         .delayWhen(t => Rx.Observable.of(true).delay(t as number))
         .map(x => connect(store.getState().kiicloud.profile.group))

const connectRejectedEpic = (a: ActionsObservable<any>) =>
        a.ofType("CONNECT.rejected")
         .mapTo({type: "RECONNECTING.retry"})

const connectResolvedEpic = (a: ActionsObservable<any>, store: Redux.Store<{kiicloud: KiiCloudState}>) =>
        a.ofType("CONNECT.resolved")
         .filter(_ => store.getState().kiicloud.mqtt.retryCount > 0)
         .do(_ => {
           console.log(`retry connecting succeeded. retry-count: ${store.getState().kiicloud.mqtt.retryCount}`);
           console.groupEnd();
         })
         .mapTo({type: "RECONNECTING.end-retry"})

function inviteUser(invitee: string): Promise<KiiGroup> {
  return KiiUser.findUserByUsername(invitee)
    .then(user => [user, KiiGroup.groupWithID("kiicorp")])
    .then(([user, group]) => {
      (group as KiiGroup).addUser(user as KiiUser);
      (group as KiiGroup).save()
      return {user, group}
    })
}

export const rootEpic = combineEpics(
  joinEpic,
  connectEpic,
  sendStatusEpic,
  //messageArrivedEpic,
  combineEpics(
    signUpEpic,
    signInEpic,
  ),
  combineEpics(
    connectionLostEpic,
    startReconnectingEpic,
    connectRejectedEpic,
    retryConnectingEpic,
    connectResolvedEpic,
  ),
);
