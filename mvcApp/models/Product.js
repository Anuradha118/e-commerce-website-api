const mongoose=require('mongoose');

var ProductSchema= new mongoose.Schema({
    name:{
        type:String,
        required: true,
        minlength:1,
        trim:true
    },
    parentCategory:{
        type:String,
        minlength:1
    },
    category:{
        type:String,
        minlength:1
    },
    description:{
        type:String,
        minlength:1
    },
    specifications:{
        type:Object
    },
    imagepath:{
        type:String,
        minlength:true
    },
    price:{
        type:Number,
        required:true
    }
});

var Product=mongoose.model('Product',ProductSchema);

module.exports={Product};