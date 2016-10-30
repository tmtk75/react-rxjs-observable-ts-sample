import { handleActions, Action } from "redux-actions"
import { combineReducers } from "redux"

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

export const reducer = combineReducers({
  kiicloud,
})

