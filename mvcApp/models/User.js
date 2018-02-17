const mongoose=require('mongoose');
const validator=require('validator');
const jwt=require('jsonwebtoken');
const _=require('lodash');
const bcrypt=require('bcryptjs');

var UserSchema= new mongoose.Schema({
    local:{
        name:{
            type:String,
            minlength:1
        },
        username:{
            type:String,
            unique:true,
            minlength:1
        },
        email:{
            type:String,
            trim:true,
            minlength:1,
            validate:{
                validator:validator.isEmail,
                message:'{VALUE} is not a valid email'
            }
        },
        password:{
            type:String,
            minlength:6
        },
        active:{
            type:Boolean,
            required:true,
            default:false
        },
        temporarytoken:{
            type:String,
            required:true
        },
        resettoken:{
            type:String
        }
    },
    facebook:{
        id:{
            type:String
        },
        mailid:{
            type:String,
            trim:true,
            minlength:1,
            validate:{
                validator:validator.isEmail,
                message:'{VALUE} is not a valid email'
            }
        },
        name:{
            type:String
        },
        token:{
            type:String
        }
    },
    google: {
		id:{
            type:String
        },
        mailid:{
            type:String,
            trim:true,
            minlength:1,
            validate:{
                validator:validator.isEmail,
                message:'{VALUE} is not a valid email'
            }
        },
        name:{
            type:String
        },
        token:{
            type:String
        }
	}
},
{ 
    usePushEach: true 
});

UserSchema.methods.generateHash=function(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(10));
}

UserSchema.methods.generateToken=function(){
    var user=this;
    var access='auth';
    var token=jwt.sign({username:user.local.username,email:user.local.email,access},process.env.JWT_SECRET,{expiresIn:'1h'});
    return token;
}
UserSchema.methods.validPassword=function(password){
    if (!this.local.password)
      return false;
    return bcrypt.compareSync(password,this.local.password);
}

var User=mongoose.model('User',UserSchema);

module.exports={User};