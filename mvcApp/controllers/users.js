require('./../../config/config');
const express=require('express');
const userRouter=express.Router();
const jwt=require('jsonwebtoken');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var {mongoose}=require('./../../db/mongoose');
var {User}=require('./../models/User');
var configAuth=require('./../../config/auth');
var responseGenerator=require('./../libs/responseGenerator');

module.exports.controller=function(app,passport){
    

    var options = {
        auth: {
            api_user: configAuth.sendgridAuth.SENDGRID_USER,
            api_key: configAuth.sendgridAuth.SENDGRID_SECRET
        }
    }

    var client = nodemailer.createTransport(sgTransport(options));

        // local-signup and send activation link to registered e-mail
        userRouter.post('/signup',function(req,res){
            var user=new User();
            user.local.name=req.body.name;
            user.local.username=req.body.username;
            user.local.email=req.body.email;
            user.local.password=user.generateHash(req.body.password);
            user.local.temporarytoken=user.generateToken();
            if(req.body.username==null||req.body.username==""||req.body.email==null||req.body.email==""||req.body.password==null||req.body.password==""){
                // res.render('signup.ejs', { message: 'Ensure Username, email and password is provided or not empty string.' });
                var myResponse=responseGenerator.generate(true,"Ensure Username, email and password is provided or not empty string.",400,null);
                res.send(myResponse);
            }else{
                user.save(function(err){
                    if(err){
                        var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                        res.send(myResponse);
                    }else{
                        var token=user.generateToken();

                        var email = {
                            from: 'Anuradha ,anuradha@test.com',
                            to: user.local.email,
                            subject: 'Ekart Activation Link',
                            text: 'Hello '+user.local.name+' thank you for registering at ekart.com. Please click on the below link to complete your activation:http://localhost:3000/users/activate/'+user.local.temporarytoken,
                            html: 'Hello<strong> '+user.local.name+'</strong>,<br><br> Thank you for registering at ekart.com. Please click on the below link to complete your activation:<br><br><a href="http://localhost:3000/users/activate/'+user.local.temporarytoken+'">http://localhost:3000/users/activate/</a>'
                            };
                            client.sendMail(email, function(err, info){
                                if (err ){
                                console.log(err);
                                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                                res.send(myResponse);
                                }
                                else {
                                console.log('Message sent: ' + info.message);
                                }
                            });
                            // res.render('signup.ejs', {user:user,message:'User Registered! Please check your email for actiation link.',token:token});
                            var myResponse=responseGenerator.generate(false,"User Registered! Please check your email for actiation link.",200,{user:user,token:token});
                            res.send(myResponse);
                    }
                });
            }
        });
    
    // renders view of sign up page
    userRouter.get('/signup', function(req, res){
		res.render('signup.ejs', { message: 'Sign up for New Account' });
    });

    //renders view of account page when the account is actiated
    userRouter.get('/activate/:token',function(req,res){
        res.render('account.ejs', { message: 'Account Activated' });
    });

    // activates the user account through temporary token sent to the registered e-mail
    userRouter.put('/activate/:token',function(req,res){
        User.findOne({'local.temporarytoken':req.params.token},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            var token=req.params.token;
            jwt.verify(token,process.env.JWT_SECRET,function(err,decoded){
                if(err){
                    var myResponse=responseGenerator.generate(true,"Activation link has expired.",404,null);
                    res.send(myResponse);
                }else if(!user){
                    var myResponse=responseGenerator.generate(true,"Activation link has expired.",404,null);
                    res.send(myResponse);
                }else{
                    user.local.temporarytoken=false;
                    user.local.active=true;
                    user.save(function(err){
                        if(err){
                            console.log(err);
                        }else{
                            var email = {
                                from: 'Anuradha ,anuradha@test.com',
                                to: user.local.email,
                                subject: 'Ekart Account Activated',
                                text: 'Hello '+user.local.name+' Your account has been successfully activated!',
                                html: 'Hello<strong> '+user.local.name+'</strong>,<br><br>Your account has been successfully activated!'
                                };
                            
                                client.sendMail(email, function(err, info){
                                    if (err ){
                                    }
                                    else {
                                    console.log('Message sent: ' + info.message);
                                    }
                                });
                            var myResponse=responseGenerator.generate(false,"Account activated.",200,{success:true});
                            res.send(myResponse);
                        }
                    })
                    
                }
            })
        })
    });

    // local-login
    userRouter.post('/login',function(req,res){
        User.findOne({'local.username':req.body.username},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            if(!user){
                // res.render('login.ejs', { success:false,message:"User doesn't exist" });
                var myResponse=responseGenerator.generate(true,"User doesn't exist",404,null);
                res.send(myResponse);
            }else if(user){
                var validPassword=user.validPassword(req.body.password);
                if(!validPassword){
                    // res.render('login.ejs', {success:false,message:"Wrong Password or Password didn't match"});
                    var myResponse=responseGenerator.generate(true,"Wrong Password or Password didn't match",404,null);
                    res.send(myResponse);                    
                }else if(!user.local.active){
                    // res.render('login.ejs', {sucess:false,message:'Account is not yet activated. Pleaase check your email for your activation link.',expired:true});
                    var myResponse=responseGenerator.generate(true,"Account is not yet activated. Pleaase check your email for your activation link.",404,{expired:true});
                    res.send(myResponse);
                }else{
                    var token=user.generateToken();
                    // res.render('login.ejs', {success:true,message:"Login Successful",user:user,token:token});
                    var myResponse=responseGenerator.generate(false,"Login Successful.",200,{user:user,token:token});
                    res.send(myResponse);
                }
            }
        })
    });

    //renders login page 
    userRouter.get('/login',function(req,res){
        res.render('login.ejs', { message: 'Login to our account' });
    });

    // if user request for activation link to be resend
    userRouter.post('/resend',function(req,res){
        User.findOne({'local.username':req.body.username},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            if(!user){
                var myResponse=responseGenerator.generate(true,"User doesn't exist",404,null);
                res.send(myResponse);
            }else if(user){
                var validPassword=user.validPassword(req.body.password);
                if(!validPassword){
                    var myResponse=responseGenerator.generate(true,"Wrong Password or Password didn't match",404,null);
                    res.send(myResponse);
                }else if(user.active){
                    var myResponse=responseGenerator.generate(true,"Wrong Password or Password didn't match",404,null);
                    res.send(myResponse);
                }else{
                    var myResponse=responseGenerator.generate(false,"User exists",200,user);
                    res.send(myResponse);
                }
            }
        })
    });

    // generate temporary token and resend activation link to registered e-mail
    userRouter.put('/resend',function(req,res){
        User.findOne({'local.username':req.body.username},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            user.local.temporarytoken=user.generateToken();
            user.save(function(err){
                if(err){
                    var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                    res.send(myResponse);
                }
                else{
                    var email = {
                        from: 'Anuradha ,anuradha@test.com',
                        to: user.local.email,
                        subject: 'Ekart Account Activation Link Request',
                        text: 'Hello '+user.local.name+', You recently requested a new account activation link. Please click on the follwing link to complete your activation:http://localhost:3000/users/activate/'+user.local.temporarytoken,
                        html: 'Hello<strong> '+user.local.name+'</strong>,<br><br> You recently requested a new account activation link. Please click on the below link to complete your activation:<br><br><a href="http://localhost:3000/users/activate/'+user.local.temporarytoken+'">http://localhost:3000/users/activate/</a>'
                        };
                    
                        client.sendMail(email, function(err, info){
                            if(err){
                                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                                res.send(myResponse);
                            }
                            else {
                            console.log('Message sent: ' + info.message);
                            }
                        });
                    var myResponse=responseGenerator.generate(false,'Activation link has been sent to '+ user.local.email+ '!',200,null);
                    res.send(myResponse);
                }
            })
        })
    });
    
    // check whether the username is already taken or not
    userRouter.post('/checkusername',function(req,res){
        User.findOne({'local.username':req.body.username},function(req,res){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            if(user){
                var myResponse=responseGenerator.generate(true,"Username is already taken",400,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Username is valid",200,null);
                res.send(myResponse);
            }
        })
    });

    //check whether the email is already exist or not
    userRouter.post('/checkemail',function(req,res){
        User.findOne({$or: [
            {'local.username':req.body.email},
            {'facebook.mailid':req.body.email},
            {'google.mailid':req.body.eamil}]},function(req,res){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            if(user){
                var myResponse=responseGenerator.generate(true,"Email is already taken",400,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Email is valid",200,null);
                res.send(myResponse);
            }
        })
    });
    
    // reset username by taking email as input and sent the username to registered email
    userRouter.get('/resetusername/:email',function(req,res){
        User.findOne({'local.email':req.params.email},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }else{
                if(!req.params.email){
                    var myResponse=responseGenerator.generate(true,"No E-mail was provided.",400,null);
                    res.send(myResponse);
                }else{
                    if(!user){
                        var myResponse=responseGenerator.generate(true,"E-mail was not found.",404,null);
                        res.send(myResponse);
                    }else if(!user.local.active){
                        var myResponse=responseGenerator.generate(true,"Account has not yet been activated.",404,null);
                        res.send(myResponse);
                    }else{
                        var email = {
                            from: 'Anuradha ,anuradha@test.com',
                            to: user.local.email,
                            subject: 'Ekart Username Request',
                            text: 'Hello '+user.local.name+', You recently requested a username.Please save it in your files: '+user.local.username,
                            html: 'Hello<strong> '+user.local.name+'</strong>,<br><br> You recently requested a username.Please save it in your files: '+user.local.username
                        };
                        
                        client.sendMail(email, function(err, info){
                            if (err ){
                            }
                            else {
                            console.log('Message sent: ' + info.message);
                            }
                        });
                        var myResponse=responseGenerator.generate(false,"Username has been sent to e-mail.",200,null);
                        res.send(myResponse);
                    } 
                }
            }
            
        })
    });

    // renders resetpassword form to get the username
    userRouter.get('/resetpassword',function(req,res){
        res.render('resetpassword.ejs', { message: 'Forgot Password' });
    });

    // check for username, if found generate reset token and sent to registered email to reset password
    userRouter.put('/resetpassword',function(req,res){
        User.findOne({'local.username':req.body.username},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            if(!user){
                var myResponse=responseGenerator.generate(true,"Username was not found.",404,null);
                res.send(myResponse);
                // res.render('resetpassword.ejs', {success:false,message:'Username was not found'});
            }else if(!user.local.active){
                var myResponse=responseGenerator.generate(true,"Account has not yet been activated.",404,null);
                res.send(myResponse);
                // res.render('resetpassword.ejs', {success:false,message:'Account has not yet been activated'});                
            }else{
                user.local.resettoken=user.generateToken();
                user.save(function(err){
                    if(err){
                        var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                        res.send(myResponse);
                    }else{
                        var email = {
                            from: 'Anuradha ,anuradha@test.com',
                            to: user.local.email,
                            subject: 'Ekart Pssaword Reset Request',
                            text: 'Hello '+user.local.name+', You recently requested a password reset link. Please click on the follwing link to reset your password:http://localhost:3000/users/resetpassword/'+user.local.resettoken,
                            html: 'Hello<strong> '+user.local.name+'</strong>,<br><br> You recently requested a new account activation link. Please click on the below link to complete your activation:<br><br><a href="http://localhost:3000/users/resetpassword/'+user.local.resettoken+'">http://localhost:3000/users/resetpassword/</a>'
                        };
                        
                        client.sendMail(email, function(err, info){
                            if (err ){
                            }
                            else {
                            console.log('Message sent: ' + info.message);
                            }
                        });
                        var myResponse=responseGenerator.generate(false,"Please check your e-mail for password reset link.",200,null);
                        res.send(myResponse);
                        // res.render('resetpassword.ejs', {success:true,message:'Please check your e-mail for password reset link.'});
                        
                    }
                })
            }
        });
    });

    // verify if the token is reset token is valid or not, if valid render the newpassword view to enter the password
    userRouter.get('/resetpassword/:token',function(req,res){
        User.findOne({'local.resettoken':req.params.token},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            var token=req.params.token;
            jwt.verify(token,process.env.JWT_SECRET,function(err,decoded){
                if(err){
                    var myResponse=responseGenerator.generate(true,"Password link has expired.",400,null);
                    res.send(myResponse);
                    // res.render('newpassword.ejs',{success:false,message:'Password link has expired.'});
                }else{
                    if(!user){
                        var myResponse=responseGenerator.generate(true,"Password link has expired.",400,null);
                        res.send(myResponse);
                        // res.render('newpassword.ejs',{success:false,message:'Password link has expired.'});                           
                    }else{
                        var myResponse=responseGenerator.generate(false,"Please enter the password.",200,user);
                        res.send(myResponse);
                        // res.render('newpassword.ejs',{success:true,user:user,message:'Please enter the password'});
                    }
                }
            });
        });
    });

    //once user provides the new password, it is saved in  database
    userRouter.put('/savepassword',function(req,res){
        User.findOne({'local.username':req.body.username},function(err,user){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }
            if(req.body.password!=null||req.body.password==''){
                user.local.password=req.body.password;
                user.local.resettoken=false;
                user.save(function(err){
                    if(err){
                        var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                        res.send(myResponse);
                    }else{
                        var email = {
                            from: 'Anuradha ,anuradha@test.com',
                            to: user.local.email,
                            subject: 'Ekart Pssaword Reset',
                            text: 'Hello '+user.local.name+', This e-mail is to notify you that your password was recently reset at ekart.com',
                            html: 'Hello<strong> '+user.local.name+'</strong>,<br><br> This e-mail is to notify you that your password was recently reset at ekart.com.'
                        };
                        
                        client.sendMail(email, function(err, info){
                            if (err ){
                            }
                            else {
                            console.log('Message sent: ' + info.message);
                            }
                        });
                        var myResponse=responseGenerator.generate(false,"Password has been reset!",200,null);
                        res.send(myResponse);
                    }
                });
            }else{
                var myResponse=responseGenerator.generate(true,"Password not provided!",400,null);
                res.send(myResponse);
            }
        })
    });

    // renders profile view if the user is authenticated
    userRouter.get('/me',isLoggedIn,function(req,res){
        var myResponse=responseGenerator.generate(false,"User:",200,req.user);
        res.send(myResponse);
        // res.render('profile.ejs', { user: req.user });
    });
    
    //login through facebook
    userRouter.get('/login/facebook',
        passport.authenticate('facebook',{scope: ['email']})
    );

    userRouter.get('/login/facebook/callback',
        passport.authenticate('facebook', { successRedirect: '/users/me',failureRedirect: '/users/login' })
    );

    //login through google
    userRouter.get('/login/google', passport.authenticate('google', {scope: ['profile', 'email']}));

	userRouter.get('/login/google/callback', 
	  passport.authenticate('google', { successRedirect: '/users/me',failureRedirect: '/users/login' })
    );

    //logout 
    userRouter.get('/logout', function(req, res){
        req.logout();
        var myResponse=responseGenerator.generate(false,"User Logout successful",200,req.user);
        res.send(myResponse);
		// res.redirect('/');
    });
    
    // middleware to check if user is authenticated or not
    function isLoggedIn(req, res, next) {
        if(req.isAuthenticated()){
            return next();
        }
 
    }

    app.use('/users',userRouter);
}

