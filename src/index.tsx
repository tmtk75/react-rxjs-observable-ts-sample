import * as React from "react"
import * as ReactDOM from "react-dom"
import { createStore, applyMiddleware, combineReducers } from "redux"
import { Provider, connect } from "react-redux"
import { createAction, handleActions, Action } from "redux-actions"
import { createEpicMiddleware, combineEpics, ActionsObservable } from 'redux-observable'
import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/delay'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { Kii, KiiUser, KiiGroup } from "kii-sdk"
import { remote } from 'electron'
const { kiicloud: { appID, appKey, apiEndpoint }, github: { token } } = remote.getGlobal('config');
Kii.initializeWithSite(appID, appKey, apiEndpoint);

import App from "./app"

const kiicloud = handleActions({
  "SIGN-UP.succeeded":  (state: any, action: Action<any>) => {
    return Object.assign({}, state, {user: action.payload});
  },
  "SIGN-IN.succeeded":  (state: any, action: Action<any>) => {
    return Object.assign({}, state, {user: action.payload});
  },
  "JOIN.succeeded":  (state: any, action: Action<any>) => {
    return Object.assign({}, state, action.payload);
  },
}, {} /* initial state */)

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

const rootEpic = combineEpics(joinEpic, combineEpics(signUpEpic, signInEpic));

//
const devtools = (window as any).devToolsExtension && (window as any).devToolsExtension()
const middlewares = applyMiddleware(
  createEpicMiddleware(rootEpic),
)
const reducer = combineReducers({
  kiicloud,
})
const store = createStore(reducer, devtools, middlewares);
const MyApp = connect((a: any) => a)(App);

ReactDOM.render(
  <MuiThemeProvider>
    <Provider store={store}>
      <MyApp {...{token}} />
    </Provider>
  </MuiThemeProvider>
  , document.getElementById('main')
);
