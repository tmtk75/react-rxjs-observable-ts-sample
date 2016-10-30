import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/delay'
import { combineEpics, ActionsObservable } from 'redux-observable'
import { Kii, KiiUser, KiiGroup } from "kii-sdk"

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

export const rootEpic = combineEpics(joinEpic, combineEpics(signUpEpic, signInEpic));

