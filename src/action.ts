import { createAction, createActions } from "redux-actions"
import * as Paho from "paho"

export const connect = createAction("CONNECT")

export const disconnect = createAction("DISCONNECT", (e: KiiCloudState) => {
  e.mqtt.client.disconnect();
})
