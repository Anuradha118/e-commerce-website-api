require('./../../config/config');
const express=require('express');
const productRouter=express.Router();
const {ObjectID}=require('mongodb');
var {mongoose}=require('./../../db/mongoose');
var {Product}=require('./../models/Product');
var responseGenerator=require('./../libs/responseGenerator');

module.exports.controller=function(app){
    
    // to get all the products
    productRouter.get('/all',function(req,res){
        Product.find(function(err,docs){
            if(err){
                var myResponse=responseGenerator.generate(true,"some error occurred"+err,500,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"List all products",200,docs);
                res.send(myResponse);
            }
        });
    });

    // to create a new product
    productRouter.post('/create',function(req,res){
        var newProduct=new Product({
            name:req.body.name,
            parentCategory:req.body.parentCategory,
            category:req.body.category,
            description:req.body.description,
            specifications:req.body.specifications,
            imagepath:req.body.imagepath,
            price:req.body.price
        });
        newProduct.save(function(err,doc){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product is saved",200,doc);
                res.send(myResponse);
            }
        });
    });

    // search product by id
    productRouter.get('/product/:id',function(req,res){
        var id=req.params.id;
        if(!ObjectID.isValid(id)){
            var myResponse=responseGenerator.generate(true,"Not a valid id",404,null);
            return res.send(myResponse);
        }
        Product.findOne({_id:id},function(err,prod){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);  
            }else if(!prod){
                var myResponse=responseGenerator.generate(true,"No Product found",404,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product found",200,prod);
                res.send(myResponse);
            }
        });
    });

    //search product by name
    productRouter.get('/:name',function(req,res){
        var pname=req.params.name;
        Product.find({name: new RegExp('.*' + pname + '.*', "i") } ,function(err,prod){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);  
            }else if(!prod){
                var myResponse=responseGenerator.generate(true,"No Product found",404,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product found",200,prod);
                res.send(myResponse);
            }
        })
    });

    //search products by any text or phrase
    productRouter.get('/search/:text',function(req,res){
        var search_text=req.params.text;
        Product.find({$text: {$search: search_text}} ,function(err,prod){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);  
            }else if(!prod){
                var myResponse=responseGenerator.generate(true,"No Product found",404,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product found",200,prod);
                res.send(myResponse);
            }
        })
    });

    //search product by category
    productRouter.get('/category/:name',function(req,res){
        var ctg_name=req.params.name;
        Product.find({$or: [
            {'parentCategory':ctg_name},
            {'category':ctg_name}]},function(err,prod){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);  
            }else if(!prod){
                var myResponse=responseGenerator.generate(true,"No Product(s) found for the category:"+ctg_name,404,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product(s) found",200,prod);
                res.send(myResponse);  
            }
        })
    });

    // edit a product by id
    productRouter.put('/update/:id',function(req,res){
        var id=req.params.id;
        var body=req.body;
        if(!ObjectID.isValid(id)){
            var myResponse=responseGenerator.generate(true,"Not a valid id",404,null);
            return res.send(myResponse);
        }
        Product.findOneAndUpdate({_id:id},{$set:body},{new:true},function(err,prod){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);  
            }else if(!prod){
                var myResponse=responseGenerator.generate(true,"No Product(s) found",404,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product(s) Updated",200,prod);
                res.send(myResponse);  
            }
        })
    });

    // delete a product by id
    productRouter.delete('/delete/:id',function(req,res){
        var id=req.params.id;
        if(!ObjectID.isValid(id)){
            var myResponse=responseGenerator.generate(true,"Not a valid id",404,null);
            return res.send(myResponse);
        }
        Product.findOneAndRemove({_id:id},function(err,prod){
            if(err){
                var myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse);  
            }else if(!prod){
                var myResponse=responseGenerator.generate(true,"No Product(s) found",404,null);
                res.send(myResponse);
            }else{
                var myResponse=responseGenerator.generate(false,"Product(s) Removed",200,prod);
                res.send(myResponse);  
            } 
        });
    });

    app.use('/products',productRouter);
}