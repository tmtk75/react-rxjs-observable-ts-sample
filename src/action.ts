import { createAction } from "redux-actions"
import * as Paho from "paho"

export const disconnect = createAction("DISCONNECT", (e: KiiCloudState) => {
  console.log(e);
  e.mqtt.client.disconnect();
})

