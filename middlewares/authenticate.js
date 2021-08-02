const passport = require("passport");

const authenticate = (req, res, next) => {
    passport.authenticate("jwt", {session: false}, (error, user)=>{
        if(error || !user || !user.token) {
            res.status(401).json({
                status: "401 Unauthorized",
                'Content-Type': 'application/json',
                'message': "Not authorized"
            })
            return;
        }
        req.user = user;
        next()
    })(req, res, next);
}

module.exports = authenticate;