// const { ObjectID } = require("bson");
const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: false
    },
    birthDate: {
        type: Date,
        required: true
    },
    userType: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },

});

// export model user with UserSchema
module.exports = mongoose.model("user", UserSchema);