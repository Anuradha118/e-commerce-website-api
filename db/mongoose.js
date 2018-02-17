require('./../config/config');

var mongoose=require('mongoose');


mongoose.Promise=global.Promise;
// mongoose.connect('mongodb://localhost:27017/EkartApp');
mongoose.connect(process.env.MONGODB_URI);

module.exports={mongoose};