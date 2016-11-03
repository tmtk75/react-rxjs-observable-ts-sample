import * as React from "react"
import { Dispatch } from "redux"
import { createAction } from "redux-actions"
import { FlatButton, TextField } from "material-ui"
import {
  connect,
  disconnect,
} from "./action"

type AppProps = {
  dispatch: Dispatch<any>,
  kiicloud: KiiCloudState,
  message: any,
}

type AppState = {
  username: string,
  password: string,
  github_token: string,
  status: string,
}

export default class App extends React.Component<AppProps, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      username: "tmtk75",
      password: "abc123",
      github_token: props.github_token,
      status: "",
    }
  }
  render() {
    const { dispatch, kiicloud: { profile: { user, group }, mqtt: { client } }, message: { value } } = this.props;
    return (
      <div>
        <TextField
          name="username"
          floatingLabelText="username"
          value={this.state.username}
          onChange={(e: React.FormEvent<TextField>) => this.setState({username: (e.target as any).value})}
          />
        <TextField
          type="password"
          name="password"
          floatingLabelText="password"
          value={this.state.password}
          onChange={(e: React.FormEvent<TextField>) => this.setState({password: (e.target as any).value})}
          />
        <FlatButton
          label="sign up"
          disabled={!!user}
          onClick={_ => dispatch(createAction("SIGN-UP")({
            username: this.state.username,
            password: this.state.password,
          }))}
          />
        <FlatButton
          label="sign in"
          disabled={!!user}
          onClick={_ => dispatch(createAction("SIGN-IN")({
            username: this.state.username,
            password: this.state.password,
          }))}
          />
        <TextField
          name="github_token"
          floatingLabelText="github_token"
          value={this.state.github_token}
          onChange={(e: React.FormEvent<TextField>) => this.setState({github_token: (e.target as any).value})}
          />
        <FlatButton
          label="join"
          disabled={!user}
          onClick={_ => dispatch(createAction("JOIN")({
            github_token: this.state.github_token,
          }))}
          />
        <TextField
          name="status"
          floatingLabelText="status"
          value={this.state.status}
          onChange={(e: React.FormEvent<TextField>) => this.setState({status: (e.target as any).value})}
          onKeyDown={e => e.keyCode === 13 ? this.sendMessage(e) : null}
          />
        <FlatButton
          label="send"
          disabled={!(client && user) || !this.state.status}
          onClick={this.sendMessage.bind(this)}
          />
        <FlatButton
          label="connect"
          disabled={!!client || !user}
          onClick={_ => dispatch(connect({sender: user, group}))}
          />
        <FlatButton
          disabled={!(!!client || !user)}
          label="disconnect"
          onClick={_ => dispatch(disconnect(this.props.kiicloud))}
          />
        <hr />
        <div>
          <div>user: {user ? user.getUsername() : null}</div>
          <div>group: {group ? group.getName() : null}</div>
          <div>received-message: {value ? value.toString() : null}</div>
        </div>
      </div>
    )
  }

  sendMessage(e: React.FormEvent<any>) {
    const { dispatch, kiicloud: { profile: { topic } } } = this.props;
    dispatch(createAction("SEND-MESSAGE")({topic, status: {message: this.state.status}}))
    this.setState({status: ""});
  }
}
