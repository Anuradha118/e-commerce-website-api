require('./config/config');
const express=require('express');
const bodyParser=require('body-parser');
const fs=require('fs');
const session = require('express-session');
const passport = require('passport');
// const flash = require('connect-flash');
const mongoStore=require('connect-mongo')(session);
var app=express();
var {mongoose}=mongoose=require('./db/mongoose');
var responseGenerator=require('./mvcApp/libs/responseGenerator');
require('./middleware/passport')(passport);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'anystringoftext',
    saveUninitialized: true,
    resave: true,
    store:new mongoStore({mongooseConnection:mongoose.connection}),
    cookie:{maxAge:180*60*1000}
}));
app.use(passport.initialize());
app.use(passport.session()); 
app.use(function(req,res,next){
    // saved the values in locals to use the same in view page
    res.locals.session=req.session;
    next();
});
const port=process.env.PORT;

// include views
app.set('views', __dirname + '/mvcApp/views'); 
app.set('view engine', 'ejs');

//include models
fs.readdirSync('./mvcApp/models').forEach((file)=>{
    if(file.indexOf('.js'))
        require('./mvcApp/models/'+file);
});

//include controllers
fs.readdirSync('./mvcApp/controllers').forEach((file)=>{
    if(file.indexOf('.js')){
        if(file=='users.js'){
            var userRoute=require('./mvcApp/controllers/'+file);
            userRoute.controller(app,passport);
        }else{
            var route=require('./mvcApp/controllers/'+file);
            route.controller(app);
        }
    }
});


app.get("/", function(req, res) {
    // res.render('index.ejs');
    var myResponse=responseGenerator.generate(false,"Welcome to Ekart",200,null);
    res.send(myResponse);
});



app.listen(port,()=>{
    console.log(`Started up at port ${port}`);
})