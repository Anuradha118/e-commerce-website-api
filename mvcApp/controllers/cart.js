const express=require('express');
const cartRouter=express.Router();
const {ObjectID}=require('mongodb');
var Cart=require('./../models/Cart');
var {Product}=require('./../models/Product');
var responseGenerator=require('./../libs/responseGenerator');

module.exports.controller=function(app){

    var myResponse;

    // to add items to the cart
    cartRouter.get('/add/:id', function(req, res, next) {
        var productId = req.params.id;
        if(!ObjectID.isValid(productId)){
            myResponse=responseGenerator.generate(true,"Not a valid id",404,null);
            return res.send(myResponse);
        }
        var cart = new Cart(req.session.cart ? req.session.cart : {});
        Product.findOne({_id:productId},function(err,product){
            if(err){
                myResponse=responseGenerator.generate(true,"Some error occurred"+err,500,null);
                res.send(myResponse); 
            }else{
                cart.add(product,product._id);
                req.session.cart=cart;
                myResponse=responseGenerator.generate(false,"Product Added to Cart",200,cart);
                res.send(myResponse);
            }
        });
    });

    // to get all items present in cart
    cartRouter.get('/allItems', function(req, res, next) {
        if (!req.session.cart || req.session.cart==undefined) {
            myResponse=responseGenerator.generate(true,"No items in cart",404,null);
             return res.send(myResponse); 
        }
        var cart = new Cart(req.session.cart);
        products=cart.getItems();
        totalPrice=cart.totalPrice;
        if(products.length==0){
            myResponse=responseGenerator.generate(true,"No items in cart",404,null);
            res.send(myResponse);
        }else{
            myResponse=responseGenerator.generate(false,"Items in Cart",200,{products:cart.getItems(),totalPrice:cart.totalPrice});
            res.send(myResponse);
        }
    });

    // to remove an item from cart
    cartRouter.get('/remove/:id', function(req, res, next) {
        var productId = req.params.id;
        if(!ObjectID.isValid(productId)){
            myResponse=responseGenerator.generate(true,"Not a valid id",404,null);
            return res.send(myResponse);
        }
        var cart = new Cart(req.session.cart ? req.session.cart : {});
      
        cart.remove(productId);
        req.session.cart = cart;
        myResponse=responseGenerator.generate(false,"Item removed",200,cart);
        res.send(myResponse);
    });

    app.use('/cart',cartRouter);
};
