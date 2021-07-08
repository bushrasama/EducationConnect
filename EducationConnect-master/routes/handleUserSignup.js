const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const hbs = require('hbs');
const router = express.Router();
const auth = require("../middleware/authenticationJWT");
const User = require("../model/User");
// const msge = require("../model/Message");

/**
 * @method - POST
 * @param - /signup
 * @description - User SignUp
 */
//localhost:4000/newuser/signup
router.post(
    "/signup", [
        check("username", "Please Enter a Valid Username")
        .not()
        .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    async(req, res) => {
        const errors = validationResult(req);
        req.session.errors = [];
        if (!errors.isEmpty()) {
            req.session.errors = errors.array();
            res.redirect("signup");
        } else {
            const {
                username,
                password,
                birthDate,
                gender,
                userType,
                email
            } = req.body;


            try {
                let existingUserByEmail = await User.findOne({
                    email
                });

                let existingUserByName = await User.findOne({
                    username
                });

                if (existingUserByEmail || existingUserByName) {
                    req.session.errors.push({ "value": "Duplicate", "msg": "User with the same username or email Already exists.." });
                    res.redirect("signup");
                } else {
                    user = new User({
                        username,
                        email,
                        password,
                        gender,
                        birthDate,
                        userType
                    });

                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);

                    await user.save();

                    const payload = {
                        user: {
                            id: user._id
                        }
                    };

                    jwt.sign(
                        payload,
                        "randomString", {
                            expiresIn: 10000
                        },
                        (err, token) => {
                            if (err) throw err;
                            req.session.success = "You have been signed up successfully. Please login to continue..";
                            res.redirect("signin");
                        }
                    );
                }

            } catch (err) {
                console.log(err.message);
                req.session.errors.push({ "value": "Database", "msg": "Error in Saving user data" });
                res.redirect("signup");
            }
        }
    }
);

router.post(
    "/signin", [
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ],
    async(req, res) => {

        const errors = validationResult(req);
        let errorlist = [];
        if (!errors.isEmpty()) {
            errorlist = errors.array();
            res.render("signin", { errors: errorlist });
        } else {
            const { email, password } = req.body;
            try {
                let user = await User.findOne({
                    email
                });
                let isMatch;
                if (user)
                    isMatch = await bcrypt.compare(password, user.password);

                if (!user || !isMatch) {
                    errorlist.push({ "value": "mismatch", "msg": "User does not exist or incorrect password" });
                    res.render("signin", { errors: errorlist });
                } else {
                    const payload = {
                        user: {
                            id: user._id
                        }
                    };

                    jwt.sign(
                        payload,
                        "randomString", {
                            expiresIn: 3600
                        },
                        async(err, token) => {
                            if (err) throw err;

                            req.session.token_id = token;
                            res.redirect('/newuser');
                        }
                    );
                }

            } catch (e) {
                console.error(e);
                errorlist.push({ "value": "server", "msg": "Server Error" });
                res.render("signin", { errors: errorlist });
            }
        }
    });

router.get("/", auth, async(req, res) => {
    try {
        // request.user is getting fetched from Middleware after token authentication
        const userObj = await User.findById(req.user.id);
        //res.json(user);

        req.session.loggedIn = true;
        req.session.user = userObj;
        req.session.userUpdated = false;

        res.render("home", { user: req.session.user });
    }
    //req.session.errors = null;
    catch (e) {
        res.send({ message: "Error in Fetching user" });
    }
});

/* router.all() methoda to catch all routes for checking whether 
   the user is logged in or not at first except for "/signin" and "/signup" */

router.all("*", (req, res, next) => {
    if (req.url === "/signin" || req.url === "/signup") {
        next();
    } else {
        if (!req.session.user)
            res.redirect("signin");
        next();
    }
});




/**
 * @method - GET
 * @description - Get LoggedIn User
 * @param - /newuser/self
 */


router.get("/signin", (req, res) => {
    res.render("signin", { authError: req.session.autherror, successMsg: req.session.success });
    req.session.autherror = null;
    req.session.success = null;
});

router.get("/signup", (req, res) => {
    res.render("signup", { errors: req.session.errors });
    req.session.errors = null;
});

router.get("/logout", (req, res) => {
    // req.session.token_id = null;
    // req.session.loggedIn = null;
    // req.session.user = null;
    // req.session.userUpdated = null;

    req.session.destroy();

    res.redirect("/");
});

router.route("/delete")
    .delete(async(req, res) => {

        let udelete = await User.findByIdAndRemove({ _id: req.session.user._id });

        if (udelete) {
            res.json({
                success: true,
                message: 'Your account has been deleted successfully'
            });

        } else {
            res.json({
                success: false,
                message: 'Server encountered error while deleting your account. Pleasy try after some time'
            });
        }
    });

module.exports = router;