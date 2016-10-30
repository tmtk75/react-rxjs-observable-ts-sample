declare module "paho" {
  export module MQTT {
    type connArgs = {
      userName: string,
      password: string,
      onSuccess: () => void,
      onFailure: (err: Error) => void,
    };

    export class Client {
      constructor(host: string, port: number, topic: string);
      subscribe(topic: string): void;
      connect(args: connArgs): void;
      onConnectionLost: (a: any) => void;
      onMessageArrived: (a: any) => void;
    }
  }
}
