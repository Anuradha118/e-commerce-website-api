var FacebookStrategy=require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var {User}=require('./../mvcApp/models/User');
var configAuth=require('./../config/auth');

module.exports=function(passport){

    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
          done(err, user);
        });
    });
    passport.use(new FacebookStrategy({
        clientID: configAuth.facebookAuth.FB_CLIENT_ID,
        clientSecret: configAuth.facebookAuth.FB_CLIENT_SECRET,
        callbackURL: configAuth.facebookAuth.FB_CALLBACK_URL,
        profileFields:['id','displayName','email']
      },
      function(accessToken, refreshToken, profile, done) {
        process.nextTick(function(){
            console.log(profile);
            User.findOne({'facebook.id':profile.id},function(err,user){
                if(err)
                   return done(err);
                if(user){
                    if(user==null){
                        return done(err);
                    }else{
                        return done(null, user);
                    }
                } 
                else{
                    var newUser=new User();
                    newUser.facebook.id=profile.id;
                    newUser.facebook.mailid=profile._json.email;
                    newUser.facebook.token=accessToken;
                    newUser.facebook.name=profile.displayName;

                    newUser.save(function(err){
                        if(err)
                            throw err;
                            // console.log(newUser);
                        return done(null,newUser);
                    })
                }           
            });
        });
      }
    ));

    passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.GOOGLE_CLIENT_ID,
	    clientSecret: configAuth.googleAuth.GOOGLE_CLIENT_SECRET,
	    callbackURL: configAuth.googleAuth.GOOGLE_CALLBACK_URL
	  },
	  function(accessToken, refreshToken, profile, done) {
	    	process.nextTick(function(){
	    		User.findOne({'google.id': profile.id}, function(err, user){
	    			if(err)
	    				return done(err);
	    			if(user)
	    				return done(null, user);
	    			else {
	    				var newUser = new User();
	    				newUser.google.id = profile.id;
	    				newUser.google.token = accessToken;
	    				newUser.google.name = profile.displayName;
	    				newUser.google.mailid = profile.emails[0].value;

	    				newUser.save(function(err){
	    					if(err)
	    						throw err;
	    					return done(null, newUser);
	    				})
	    				console.log(profile);
	    			}
	    		});
	    	});
	    }

	));
}