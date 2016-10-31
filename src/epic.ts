import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import { combineEpics, ActionsObservable } from 'redux-observable'
import * as Paho from "paho"
import {
  Kii, KiiUser, KiiGroup, KiiTopic, KiiPushMessageBuilder,
} from "kii-sdk"

const epicFromPromise = (type: string, genPromise: (x: any) => Promise<any>) =>
  (a: ActionsObservable<any>) => a.ofType(type)
    .mergeMap(x => Rx.Observable.fromPromise(genPromise(x)
      .catch(err => ({
        type: `${type}.rejected`,
        payload: err,
        error: true,
      }))))
    .map((payload: any) => (payload.error ? payload : {type: `${type}.succeeded`, payload}))

const signUpEpic = epicFromPromise("SIGN-UP", (x) => KiiUser.userWithUsername(x.payload.username, x.payload.password).register())

const signInEpic = epicFromPromise("SIGN-IN", (x) => KiiUser.authenticate(x.payload.username, x.payload.password))

function join(token: string): Promise<{user: KiiUser, group: KiiGroup} | Error> {
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

const joinEpic = (a: ActionsObservable<any>) => a.ofType('JOIN')
      .mergeMap(x => Rx.Observable.fromPromise(join(x.payload.github_token)))
      .map(payload => ({type: 'JOIN.succeeded', payload}))

function kiiPush(): Promise<any | Error> {
  const s = KiiUser.getCurrentUser().pushInstallation();
  return s.installMqtt(false)
    .then(({installationID}) => s.getMqttEndpoint(installationID))
}

function kiiTopic(group: KiiGroup, name: string): Promise<KiiTopic | Error> {
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

function kiiWS(conf: any, store: Redux.Store<any>): Promise<Paho.MQTT.Client | Error> {
  const client = new Paho.MQTT.Client(conf.host, conf.portWS, conf.mqttTopic);
  client.onConnectionLost = (res) => store.dispatch({type: "CONNECTION-LOST", payload: res});
  client.onMessageArrived = (msg) => store.dispatch({type: "MESSAGE-ARRIVED", payload: JSON.parse(msg.payloadString)});
  return new Promise((resolve, reject) => {
    client.connect({
      userName: conf.username,
      password: conf.password,
      onSuccess: () => {
        client.subscribe(conf.mqttTopic);
        resolve(client);
        store.dispatch({type: "CONNECTION-ALIVE"});
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

const connectEpic = (a: ActionsObservable<any>, store: any) => a.ofType('CONNECT')
      .mergeMap(action => Rx.Observable.fromPromise(
        kiiPush().then(conf =>
          kiiTopic(action.payload, "status")
            .then(topic => kiiWS(conf, store)
              .then(_ => kiiSend(topic as KiiTopic)))
        )
      ))
      .map(payload => ({type: 'CONNECT.succeeded', payload}))

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
  combineEpics(
    signUpEpic,
    signInEpic,
  ),
);
