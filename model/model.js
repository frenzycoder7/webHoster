const mongoose = require('mongoose');
const validator = require('validator');

const lodash = require('lodash');
const bcrypt = require('bcryptjs');
const {ObjectID} = require('mongodb');


var domainSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    domain: {
        type: String,
        required: true,
        unique: true
    },
    website: {
        type: String,
        required: true
    }
});
var UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        minlength: 6,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: (value)=>{
                return validator.isEmail(value)
            },
            message: '{VALUE} is not valid'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    status: {
        type: Boolean,
        default: false
    },
    createdAt:{
        type: Date,
        default: new Date().getDate()
    }
});
var portfolioSchema = new mongoose.Schema({
    name:{
        type: String
    },
    logo: {
        type: String,
    },
    paid: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        default: 0
    },
    filename:{
        type: String,
    },
    createdAt: {
        type: Date,
        default: new Date().getDate()
    }
});

var userInformation = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    number: {
        type: Number,
    },
    dob: {
        type: Date,
    },
    status: {
        type: String,
    },
    work: {
        type: String,
    },
    img: {
        type: String,
    },
    about: {
        type: String
    },
    insta:{
        type: String
    },
    facebook:{
        type:String,
    },
    linkdin:{
        type:String
    },
    createdAt: {
        type: Date,
        default: new Date().getDate()
    }

});
UserSchema.statics.findBycrediantials = function(username, password){
    var User = this;
    return User.findOne({username: username}).then((user)=>{
        if(!user){
            //console.log(user);
            //console.log('hello');
            return Promise.reject();
        }
        else
        {
            //console.log("2nd"+user);
            return new Promise((resolve, reject) => {
                bcrypt.compare(password, user.password, (err, res) => {
                    if(res){
                       // console.log('Login Success');
                        resolve(user);
                    }
                    else{
                        //console.log('Hello world');
                        reject();
                    }
                });
            });
    
        }
        

    });
};
UserSchema.pre('save', function (next) {
    var user = this;
    if(user.isModified('password')){
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            });
        });
    }
    else
    {
        next();
    }
});
var User = mongoose.model('User', UserSchema);

var Domains = mongoose.model('Domains', domainSchema);
var Portfolio = mongoose.model('Portfolio', portfolioSchema);
var Userinfo = mongoose.model('Userinfo', userInformation);
module.exports = {
    User,
    Domains,
    Portfolio,
    Userinfo
};