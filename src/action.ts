import { createAction, createActions } from "redux-actions"
import * as Paho from "paho"
import { KiiGroup } from "kii-sdk"

export const connect = createAction<KiiGroup>("CONNECT")

export const disconnect = createAction<KiiCloudState, void>("DISCONNECT", ({ mqtt: { client } }: KiiCloudState) => {
  if (!client) {
    //console.log("no client");
    return
  }
  client.disconnect();
  //console.log("disconnect");
})

export const loadMembers = createAction<KiiGroup>("LOAD-MEMBERS")
