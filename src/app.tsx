import * as React from "react"
import { createAction } from "redux-actions"
import { FlatButton, TextField } from "material-ui"

export default class App extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      username: "tmtk75",
      password: "abc123",
      github_token: props.token,
    }
  }
  render() {
    const { dispatch, kiicloud: { user, group }, message: { value } } = this.props;
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
          onClick={() => dispatch(createAction("SIGN-UP")({
            username: this.state.username,
            password: this.state.password,
          }))}
          />
        <FlatButton
          label="sign in"
          onClick={() => dispatch(createAction("SIGN-IN")({
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
          onClick={() => dispatch(createAction("JOIN")({
            github_token: this.state.github_token,
          }))}
          />
        <FlatButton
          label="connect"
          onClick={() => dispatch(createAction("CONNECT")(group))}
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
}
