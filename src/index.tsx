import * as React from "react"
import * as ReactDOM from "react-dom"
import { createStore, applyMiddleware, combineReducers } from "redux"
import { Provider, connect } from "react-redux"
import { createAction, handleActions, Action } from "redux-actions"
import { createEpicMiddleware, ActionsObservable } from 'redux-observable'
import * as Rx from "rxjs"
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/delay'

class App extends React.Component<any, any> {
  render() {
    const { dispatch, isPinging } = this.props;
    return (
      <div>
        isPinging: {isPinging.toString()}
        <button onClick={() => dispatch({type: "PING"})}>Ping</button>
        <button onClick={() => dispatch({type: "PING2"})}>Ping2</button>
        <button onClick={() => dispatch({type: "PING3"})}>Ping3</button>
      </div>
    )
  }
}

const pingPong = handleActions({
  "PING":  (state: any, action: Action<any>) => Object.assign({}, state, {isPinging: true}),
  "PING2": (state: any, action: Action<any>) => Object.assign({}, state, {isPinging: true}),
  "PING3": (state: any, action: Action<any>) => {
    console.log("ignored", action);
    return state;
  },
  "PONG":  (state: any, action: Action<any>) => Object.assign({}, state, {isPinging: false}),
}, {isPinging: false} /* initial state */)

const pingEpic = (a: ActionsObservable<any>) => a.ofType('PING', 'PING2')
      .delay(1000) 
      .mapTo({ type: 'PONG' })

const devtools = (window as any).devToolsExtension && (window as any).devToolsExtension()
const middlewares = applyMiddleware(
  createEpicMiddleware(pingEpic),
)
const store = createStore(pingPong, devtools, middlewares);
const MyApp = connect((a: any) => a)(App);

ReactDOM.render(
  <Provider store={store}>
    <MyApp />
  </Provider>
  , document.getElementById('main')
);

