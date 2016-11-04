import { createAction, createActions } from "redux-actions"
import * as Paho from "paho"

export const connect = createAction("CONNECT")

export const disconnect = createAction("DISCONNECT", ({ mqtt: { client } }: KiiCloudState) => {
  if (!client) {
    //console.log("no client");
    return
  }
  client.disconnect();
  //console.log("disconnect");
})
