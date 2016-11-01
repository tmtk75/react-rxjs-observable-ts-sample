import * as Paho from "paho"
import { KiiPushSubscription } from "kii-sdk"

declare global {

  type KiiCloudState = {
      profile: {
      },
      mqtt: {
        pushSubscription: KiiPushSubscription,
        client: Paho.MQTT.Client,
      },
  }

}
