import {
  ensureToBelong,
  get,
  groups,
} from "./lib";

export function config(params, ctx, done) {
  const tk = { authorization: "token " + params.token }
  const ghUser = get(tk, "https://api.github.com/user")
  
  Promise.all([
    KiiUser.authenticateWithToken(ctx.getAccessToken()),
    ghUser.then(res => groups(tk, res.organizations_url)),
    ghUser.then(res => res.avatar_url),
  ]).then(v => {
    const user       = v[0];
    const groups     = v[1].map(g => g.toLowerCase());
    const avatar_url = v[2];
    return Promise.all([
      user.update(null, null, {groups, avatar_url}, null),
      ensureToBelong(ctx.getAppAdminContext(), groups, user),
    ]);
  })
  .then(v => done({
    login: v[0].getUsername(),
    groups: v[1].map(g => g.getID()),
  }))
  .catch(err => done(err.message ? {error: err.message} : err))
}
