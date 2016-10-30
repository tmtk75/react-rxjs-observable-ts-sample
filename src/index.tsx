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

import { FlatButton, TextField } from "material-ui"
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { Kii, KiiUser, KiiGroup } from "kii-sdk"
import { remote } from 'electron'
const { kiicloud: { appID, appKey, apiEndpoint }, github: { token } } = remote.getGlobal('config');
Kii.initializeWithSite(appID, appKey, apiEndpoint);

class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      username: "tmtk75",
      password: "abc123",
      github_token: token,
    }
  }
  render() {
    const { dispatch } = this.props;
    return (
      <div>
        <TextField
          name="username"
          floatingLabelText="username"
          value={this.state.username}
          onChange={(e: React.FormEvent<TextField>) => this.setState({username: (e.target as any).value})}
          />
        <TextField
          type="password"
          name="password"
          floatingLabelText="password"
          value={this.state.password}
          onChange={(e: React.FormEvent<TextField>) => this.setState({password: (e.target as any).value})}
          />
        <FlatButton
          label="sign up"
          onClick={() => dispatch(createAction("SIGN-UP")({
            username: this.state.username,
            password: this.state.password,
          }))}
          />
        <FlatButton
          label="sign in"
          onClick={() => dispatch(createAction("SIGN-IN")({
            username: this.state.username,
            password: this.state.password,
          }))}
          />
        <TextField
          name="github_token"
          floatingLabelText="github_token"
          value={this.state.github_token}
          onChange={(e: React.FormEvent<TextField>) => this.setState({github_token: (e.target as any).value})}
          />
        <FlatButton
          label="join"
          onClick={() => dispatch(createAction("JOIN")({
            github_token: this.state.github_token,
          }))}
          />
      </div>
    )
  }
}

const pingPong = handleActions({
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
    .then(({login, groups: [g]}) => Promise.all([
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
const store = createStore(pingPong, devtools, middlewares);
const MyApp = connect((a: any) => a)(App);

ReactDOM.render(
  <MuiThemeProvider>
    <Provider store={store}>
      <MyApp />
    </Provider>
  </MuiThemeProvider>
  , document.getElementById('main')
);
