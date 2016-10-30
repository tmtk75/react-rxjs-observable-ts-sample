import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/delay'
import { combineEpics, ActionsObservable } from 'redux-observable'
import * as Paho from "paho"
import {
  Kii, KiiUser, KiiGroup, KiiTopic, KiiPushMessageBuilder,
} from "kii-sdk"

const signUpEpic = (a: ActionsObservable<any>) => a.ofType('SIGN-UP')
      .map(x => Rx.Observable.fromPromise(
        KiiUser.userWithUsername(x.payload.username, x.payload.password).register()))
      .flatMap(x => x)
      .map(payload => ({type: 'SIGN-UP.succeeded', payload}))

const signInEpic = (a: ActionsObservable<any>) => a.ofType('SIGN-IN')
      .map(x => Rx.Observable.fromPromise(
        KiiUser.authenticate(x.payload.username, x.payload.password)
      ))
      .flatMap(x => x)
      .map(payload => ({type: 'SIGN-IN.succeeded', payload}))

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

const joinEpic = (a: ActionsObservable<any>) => a.ofType('JOIN')
      .map(x => Rx.Observable.fromPromise(join(x.payload.github_token)))
      .flatMap(x => x)
      .map(payload => ({type: 'JOIN.succeeded', payload}))

function kiiPush(): Promise<{value: any} | {error: Error}> {
  const s = KiiUser.getCurrentUser().pushInstallation();
  return s.installMqtt(false)
    .then(({installationID}) => s.getMqttEndpoint(installationID))
    .then(payload => ({payload}))
    //.then(value => ({error: new Error("dummy 503")}))
    .catch(error => ({error}))
}

function kiiTopic(group: KiiGroup, name: string): Promise<{value: KiiTopic} | {error: Error}> {
  return group.listTopics()
    .then(([[topic], _]) => topic ? topic : group.topicWithName(name).save())
    .then(topic => KiiUser.getCurrentUser().pushSubscription().isSubscribed(topic))
    .then(([psub, topic, b]) => b ? topic : psub.subscribe(topic))
    .then(payload => {
      //TODO: Not so cool
      if (payload instanceof KiiTopic) {
        return {payload};
      }
      const [a, b] = payload;
      return {payload: b};
    })
    .catch(error => ({error}))
}

function kiiWS(conf: any, store: Redux.Store<any>): any {
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
   .then(payload => ({payload}))
   .catch(error => ({error}))
}

function kiiSend(topic: KiiTopic, m: Object = {id: 12345, m: "hello"}): Promise<any> {
  const data = {value: JSON.stringify(m)};
  const msg = new KiiPushMessageBuilder(data).build()
  return topic.sendMessage(msg)
    .then(payload => ({payload}))
    .catch(error => ({error}));
}

const connectEpic = (a: ActionsObservable<any>) => a.ofType('CONNECT')
      .map(x => Rx.Observable.fromPromise(kiiPush()))
      .flatMap(x => x)
      .map(payload => ({type: 'CONNECT.succeeded', payload}))

function inviteUser(invitee: string): Promise<KiiGroup> {
  return KiiUser.findUserByUsername(invitee)
    .then(user => [user, KiiGroup.groupWithID("kiicorp")])
    .then(([user, group]) => {
      (group as KiiGroup).addUser(user as KiiUser);
      (group as KiiGroup).save()
      return {user, group}
    })
    .then(payload => ({payload}))
    .catch(error => ({error}))
}

export const rootEpic = combineEpics(joinEpic, connectEpic, combineEpics(signUpEpic, signInEpic));
