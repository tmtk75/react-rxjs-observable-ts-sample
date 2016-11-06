import * as React from "react"
import { Dispatch } from "redux"
import { Action } from "redux-actions"
import { FlatButton, TextField } from "material-ui"
import {
  connect,
  disconnect,
  loadMembers,
  signUp,
  signIn,
  signOut,
  join,
  sendMessage,
  loadLatestMessages,
} from "./action"
import { KiiUser, KiiPushMessage } from "kii-sdk"

type AppProps = {
  dispatch: Dispatch<Action<any>>,
  kiicloud: KiiCloudState,
  messages: MessagesState,
  members: MembersState,
  github_token: string,
  error: {
    rejected: Error,
  },
}

type LoginState = {
  username?: string,
  password?: string,
}

class Login extends React.Component<AppProps, LoginState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      username: "tmtk75",
      password: "abc123",
    }
  }
  render() {
    const { dispatch, kiicloud: { profile: { user } } } = this.props;
    const { username, password } = this.state;
    return (
      <div>
        <TextField
          name="username"
          floatingLabelText="username"
          style={{width: '48%'}}
          value={this.state.username}
          onChange={(e: React.FormEvent<TextField>) => this.setState({username: (e.target as any).value})}
          />
        <TextField
          type="password"
          name="password"
          floatingLabelText="password"
          style={{width: '48%'}}
          value={this.state.password}
          onChange={(e: React.FormEvent<TextField>) => this.setState({password: (e.target as any).value})}
          />
        <FlatButton
          label="sign up"
          disabled={!!user}
          onClick={_ => dispatch(signUp({username, password}))}
          />
        <FlatButton
          label="sign in"
          disabled={!!user}
          onClick={_ => dispatch(signIn({username, password}))}
          />
        <FlatButton
          label="sign out"
          disabled={!user}
          onClick={_ => dispatch(signOut())}
          />
      </div>
    )
  }
}

class Connect extends React.Component<AppProps, {github_token: string}> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      github_token: props.github_token,
    }
  }
  render() {
    const { dispatch, kiicloud: { profile: { user, group }, mqtt: { client } } } = this.props;
    return (
      <div>
        <TextField
          name="github_token"
          floatingLabelText="github_token"
          fullWidth={true}
          value={this.state.github_token}
          onChange={(e: React.FormEvent<TextField>) => this.setState({github_token: (e.target as any).value})}
          />
        <FlatButton
          label="join"
          disabled={!user || !this.state.github_token}
          onClick={_ => dispatch(join({github_token: this.state.github_token}))}
          />
        <FlatButton
          label="connect"
          disabled={!!client || !user || !group}
          onClick={_ => dispatch(connect(group))}
          />
        <FlatButton
          disabled={!client}
          label="disconnect"
          onClick={_ => dispatch(disconnect(this.props.kiicloud))}
          />
      </div>
    )
  }
}

class Message extends React.Component<AppProps, {status: string}> {
  constructor(props: AppProps) {
    super(props)
    this.state = {
      status: "",
    }
  }
  render() {
    const { dispatch, kiicloud: { profile: { user, group }, mqtt: { client } } } = this.props;
    return (
      <div>
        <TextField
          name="status"
          floatingLabelText="status"
          errorText={!!this.state.status && !client ? "not connected" : null}
          value={this.state.status}
          onChange={(e: React.FormEvent<TextField>) => this.setState({status: (e.target as any).value})}
          onKeyDown={e => e.keyCode === 13 ? this.handleSendMessage(e) : null}
          />
        <FlatButton
          label="send"
          disabled={!(client && user) || !this.state.status}
          onClick={this.handleSendMessage.bind(this)}
          />
      </div>
    )
  }
  handleSendMessage(e: React.FormEvent<TextField & FlatButton> | React.KeyboardEvent<{}>) {
    const { dispatch, kiicloud: { profile: { user, topic, group } } } = this.props;
    if (!topic) {
      return;
    }
    dispatch(sendMessage({group, topic, status: {message: this.state.status}}));
    this.setState({status: ""});
  }
}

class Member extends React.Component<AppProps, {}> {
  constructor(props: AppProps) {
    super(props)
  }
  render() {
    const { dispatch, kiicloud: { profile: { group, members } }, messages: { pushMessages } } = this.props;
    return (
      <div>
        <FlatButton
          label="load members"
          disabled={!group}
          onClick={_ => dispatch(loadMembers(group))}
          />
        {group ? ` for ${group.getName()}` : null}
        <ul>{
          members.map(e =>
            <li key={e.getUUID()}>
              {e.getUsername()}: {pushMessages.get(e.getUUID())}
            </li>
          )
        }</ul>
      </div>
    )
  }
}

class Debug extends React.Component<AppProps, {}> {
  constructor(props: AppProps) {
    super(props);
  }
  render() {
    const {
      dispatch,
      kiicloud: { profile: { user, group } },
      messages: {
        last,
        last: { value },
        pushMessages,
      },
      members,
      error: { rejected }
    } = this.props;

    return (
      <div>
        <div>user: {user ? user.getUsername() : null}</div>
        <div>group: {group ? group.getName() : null}</div>
        <div>last-message: {value ? value.toString() : null}</div>
        <div>error: {rejected ? rejected.message : null}</div>
        <FlatButton
          label="load latest messages"
          disabled={!group}
          onClick={_ => dispatch(loadLatestMessages(group))}
          />
      </div>
    )
  }
}

export default class App extends React.Component<AppProps, {}> {
  render() {
    return (
      <div>
        <Login {...this.props}/>
        <Connect {...this.props}/>
        <Message {...this.props}/>
        <Member {...this.props}/>
        <hr />
        <Debug {...this.props}/>
      </div>
    )
  }
}
