import * as Paho from "paho"
import { KiiUser, KiiGroup, KiiTopic, KiiMqttEndpoint} from "kii-sdk"

declare global {

  type KiiCloudState = {
      profile: {
        user: KiiUser,
        group: KiiGroup,
        groups: Array<KiiGroup>,
        topic: KiiTopic,
      },
      mqtt: MQTTState,
  }

  type MQTTState = {
     endpoint: KiiMqttEndpoint,
     client: Paho.MQTT.Client,
     retryCount: number,
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

}

declare module "redux-actions" {

  type actionMap = {[key: string]: any}

  export function createActions(actions: actionMap, ...keys: string[]): any;

}
