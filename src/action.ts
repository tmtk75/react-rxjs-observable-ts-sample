import { createAction, createActions } from "redux-actions"
import * as Paho from "paho"
import { KiiGroup } from "kii-sdk"

export const connect = createAction<KiiGroup>("CONNECT");

export const disconnect = createAction<KiiCloudState, void>("DISCONNECT", ({ mqtt: { client } }: KiiCloudState) => {
  if (!client) {
    //console.log("no client");
    return
  }
  client.disconnect();
  //console.log("disconnect");
});

export const loadMembers = createAction<KiiGroup>("LOAD-MEMBERS");

export const signUp = createAction<SignUpPayload>("SIGN-UP");

export const signIn = createAction<SignInPayload>("SIGN-IN");

export const signOut = createAction<void>("SIGN-OUT");

export const join = createAction<{github_token: string}>("JOIN");

export const sendMessage = createAction<SendMessagePayload>("SEND-MESSAGE");

export const loadLatestMessages = createAction<KiiGroup>("LOAD-LATEST-MESSAGES");
