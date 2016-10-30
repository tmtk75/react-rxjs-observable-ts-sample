import * as React from "react"
import * as ReactDOM from "react-dom"
import { createStore, applyMiddleware, combineReducers } from "redux"
import { Provider, connect } from "react-redux"
import { createAction, handleActions, Action } from "redux-actions"
import { createEpicMiddleware, ActionsObservable } from 'redux-observable'
import * as Rx from "rxjs"
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/delay'

import { FlatButton, TextField } from "material-ui"
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import { Kii, KiiUser } from "kii-sdk"
Kii.initializeWithSite("2cdc6549", "3dbc623c48196a1d61ef039996a40519", "https://api-development-jp.internal.kii.com/api");

class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      username: "tmtk75",
      password: "abc123",
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
      </div>
    )
  }
}

const pingPong = handleActions({
  "SIGN-UP.succeeded":  (state: any, action: Action<any>) => {
    console.log(action);
    return Object.assign({}, state, {user: action.payload});
  },
}, {} /* initial state */)

const signUpEpic = (a: ActionsObservable<any>) => a.ofType('SIGN-UP')
      .map(x => Rx.Observable.fromPromise(
        KiiUser.userWithUsername(x.payload.username, x.payload.password).register()))
      .flatMap(x => x)
      //.do(x => console.log("x:", x))
      .map(payload => ({type: 'SIGN-UP.succeeded', payload}))

const rootEpic = signUpEpic;

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
