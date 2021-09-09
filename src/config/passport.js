const passport = require("passport");
const passportJwt = require("passport-jwt");

const { Strategy, ExtractJwt } = passportJwt;

//TODO: Tornar uma constante global
const secret = "Segredo!";

module.exports = (app) => {
  const params = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret,
  };

  const strategy = new Strategy(params, (payload, done) => {
    // try {
    //   const user = await app.services.user.findOne({ id: payload.id });
    //   if (!!user) {
    //     done(null, { ...payload });
    //   } else {
    //     done(null, false);
    //   }
    // } catch (error) {
    //   done(error, false);
    // }

    app.services.user
      .findOne({ id: payload.id })
      .then((user) => {
        if (user) done(null, { ...payload });
        else done(null, false);
      })
      .catch((err) => done(err, false));
  });

  passport.use(strategy);

  return {
    authenticate: () => passport.authenticate("jwt", { session: false }),
  };
};
