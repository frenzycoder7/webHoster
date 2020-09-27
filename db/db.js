const mongoose = require('mongoose');
const mongodb = require('mongodb');
mongoose.set('useCreateIndex',true)
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/bachelorscode', {useNewUrlParser: true, useUnifiedTopology:true, useFindAndModify: false});

module.exports = {
    mongoose
};