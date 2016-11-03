import * as Paho from "paho"
import { KiiUser, KiiGroup, KiiPushSubscription, KiiTopic } from "kii-sdk"

declare global {

  type KiiCloudState = {
      profile: {
        user: KiiUser,
        group: KiiGroup,
        groups: Array<KiiGroup>,
        topic: KiiTopic,
      },
      mqtt: {
        pushSubscription: KiiPushSubscription,
        client: Paho.MQTT.Client,
        retryCount: number,
      },
  }

}

declare module "redux-actions" {

  type actionMap = {[key: string]: any}

  export function createActions(actions: actionMap, ...keys: string[]): any;

}
