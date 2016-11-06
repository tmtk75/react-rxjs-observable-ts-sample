import * as Paho from "paho"
import { KiiUser, KiiGroup, KiiTopic, KiiMqttEndpoint, KiiPushMessage } from "kii-sdk"
import { StoreCreator } from "redux"
import { Map } from "immutable"

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

  type MessagesState = {
    readonly last: KiiPushMessage,
    readonly pushMessages: Map<UserID, StatusText>,
  };

  type MembersState = {
    users: Map<UserID, KiiUser>;
  }

  type SendMessagePayload = {
    group: KiiGroup;
    topic: KiiTopic,
    status: StatusMessage;
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

  type UserID = string;

  type StatusText = string;

  type StatusMessages = Array<StatusMessage>

  type StatusMessage = {
    sender: UserID,
    message: StatusText,
  }

  interface Window {
    devToolsExtension(): StoreCreator;
  }

}

declare module "redux-actions" {
  type actionMap = {[key: string]: any}

  export function createActions(actions: actionMap, ...keys: string[]): any;
}
