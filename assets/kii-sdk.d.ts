declare module "kii-sdk" {

  export class Kii {
    static initializeWithSite(app_id: string, app_key: string, endpoint_url: string): void;
    static serverCodeEntry(name: string): KiiServerCodeEntry;
  }

  export class KiiServerCodeEntry {
    execute(arg: Object): Promise<any>;
  }

  export class KiiGroup {
    static groupWithID(id: string): KiiGroup;
    static registerGroupWithID(id: string, name: string, opts: any): Promise<KiiGroup>;
    refresh(): Promise<KiiGroup>;
    getName(): string;
    listTopics(): Promise<any>;
    topicWithName(name: string): KiiTopic;
    save(): Promise<KiiGroup>;
    addUser(u: KiiUser): void;
    getMemberList(): Promise<any>;
  }

  export class KiiUser {
    static userWithUsername(username: string, password: string): KiiUser;
    static userWithURI(uri: string): KiiUser;
    static authenticateWithToken(token: string): Promise<KiiUser>;
    static getCurrentUser(): KiiUser;
    static findUserByUsername(username: string): Promise<KiiUser>;
    static authenticate(username: string, password: string): Promise<KiiUser>;
    register(): Promise<KiiUser>;
    refresh(): Promise<KiiUser>;
    get(name: string): any;
    getUUID(): string;
    getAccessToken(): string;
    getUsername(): string;
    pushInstallation(): KiiPushSubscription;
    pushSubscription(): KiiPushSubscription;
    memberOfGroups(): Promise<any>;
  }

  export class KiiTopic {
    save(): Promise<KiiTopic>;
    sendMessage(msg: KiiPushMessage): Promise<KiiTopic>;
    getName(): string;
  }

  export class KiiPushSubscription {
    installMqtt(dev: boolean): Promise<any>;
    getMqttEndpoint(instID: string): Promise<any>;
    isSubscribed(t: KiiTopic): Promise<any>;
  }

  export class KiiPushMessage {
    senderURI: string;
  }

  export class KiiPushMessageBuilder {
    constructor(a: any);
    build(): KiiPushMessage;
  }
}

