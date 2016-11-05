import * as Paho from "paho"
import { KiiUser, KiiGroup, KiiTopic, KiiMqttEndpoint } from "kii-sdk"
import { StoreCreator } from "redux"

declare global {

  type KiiCloudState = {
      readonly profile: ProfileState,
      readonly mqtt: MQTTState,
  }

  type ProfileState = {
    readonly user?: KiiUser,
    readonly group?: KiiGroup,
    readonly groups?: Array<KiiGroup>,
    readonly topic?: KiiTopic,
    readonly members?: Array<KiiUser>,
  }

  type MQTTState = {
     readonly endpoint: KiiMqttEndpoint,
     readonly client: Paho.MQTT.Client,
     readonly retryCount: number,
  }

  type SendMessagePayload = {
    topic: KiiTopic,
    status: {
      message: string,
    },
  }

  type ConnectPayload = KiiGroup;

  type SignUpPayload = {
    username: string,
    password: string,
  }

  type SignInPayload = SignUpPayload;

  type JoinPayload = {
    github_token: string,
  }

  interface Window {
    devToolsExtension(): StoreCreator;
  }

}

declare module "redux-actions" {
  type actionMap = {[key: string]: any}

  export function createActions(actions: actionMap, ...keys: string[]): any;
}
