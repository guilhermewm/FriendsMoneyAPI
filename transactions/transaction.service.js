/**
 * 
 * This file contain all methods to access and modify objects in transactions database
 * @author Adrian Lemes
 */
//required libraries and files
var Transaction = require('./transaction.schema'),
    logger      = require('mm-node-logger')(module),
    User        = require('../users/user.schema'),
    userService = require('../users/user.service'),
    async       = require('async'),
    constant    = require('./transaction.constants.json');

//export all methods to be accessed externally

var service = {};
 service.createTransaction = createTransaction;
 service.getListTransactions = getListTransactions;
 service.getListTransactionsByUser = getListTransactionsByUser;
 service.getTransaction = getTransaction;
 service.deleteTransaction = deleteTransaction;
 service.updateTransaction = updateTransaction;
 service.getListTransactionsPendencies = getListTransactionsPendencies;

module.exports = service;


/**
 * Method to create new transaction
 * @param transaction object
 * @return a message with error or success
 */

function createTransaction(transaction, callback){
   var newTransaction = new Transaction(transaction)
    newTransaction.save(function(err, transaction){
        if (err){callback({status:500, error: err });}
        else{
             callback(constant.success.msg_reg_success)
        }
    })
}

function getListTransactionsPendencies (phone, callback){

     userService.getUser(phone, function(user){


            if(user){
             Transaction.find({$and:[{$or:[{"debtor.phone.value":user.phone.value}, {"creditor.phone.value": user.phone.value}]},{"creator.phone.value": { $ne: user.phone.value }},{status:"pending"}]},function(err, transactions){

                    //  console.log(transactions)
                    if (err) 
                    {
                        console.log(err);
                        logger.error(constant.error.msg_mongo_error+": "+err);
                        callback({status:500, error: err });
                    }else if (transactions[0] == null || transactions[0] == undefined)
                    {
                        logger.error(constant.error.msg_no_register);
                        callback({status:404, error: constant.error.msg_no_register});
                    }
                    else {
                        // console.log(transactions);
                        callback(transactions);    
                    }
                }).sort({createdAt : 1});
            }else {
                callback({status:404, error: "No users"});
            }
       
    })
}

/**
 * This method receive an user_id parameter (mongo id) and find all transactions with a debtor or a creditor that match with
 * the user_id parameter
 * @param user_id
 * @return error or a list with transactions
 */
function getListTransactionsByUser (phone, callback){

    userService.getUser(phone,function(user){
           if(user){
               

                 Transaction.find({$or: [{"debtor.phone": user.phone}, {"creditor.phone":user.phone}]},function(err, transactions){
                    if (err) 
                    {
                        logger.error(constant.error.msg_mongo_error+": "+err);
                        callback({status:500, error: err });
                    }else if (transactions[0] == null || transactions[0] == undefined)
                    {
                        logger.error(constant.error.msg_no_register);
                        callback({error: constant.error.msg_no_register});
                    }
                    else {
                        callback(transactions);
                    }
                }).sort({createdAt : -1})
            }else {
                callback({status:404, error: "No users"});
            }
       
    })
    
}

/**
 * This method find all transactions in database
 * 
 * @return error or a list with transactions
 */

function getListTransactions (callback){

    Transaction.find({},function(err, transaction){
        if (err) 
        {
            logger.error(constant.error.msg_mongo_error+": "+err);
            callback({status:500, error: err });
        }else if (transaction == null || transaction == undefined || transaction.length == 0)
        {
            callback( {status:404, error: constant.error.msg_empty_database});
        }
        else {
            callback(transaction);
        }

    })
}

/**
 * This method receive an id transaction parameter (mongo id) and find one transaction that match with this id
 * @param id
 * @return error or a transaction
 */
function getTransaction (id, callback){
    Transaction.findOne({_id:id}, function(err, transaction){
        if (err) 
        {
            logger.error(constant.error.msg_mongo_error+": "+err);
            callback({status: 500, error: err });
        }
        else if(transaction == null || transaction == undefined) {
            callback({status:404, error: constant.error.msg_no_register});
        }
        else 
        {
            callback(transaction);
        } 

    })
}

/**
 * This method receive an id transaction parameter (mongo id) and delete a transaction that match with this id
 * @param id
 * @return error or a success full message delete
 */
function deleteTransaction(id, callback){
      Transaction.findById(id, function(err, transaction){
          if (err)
          {
              logger.error(constant.error.msg_mongo_error+": "+err);
               callback({status: 500, error: err });
          }else if(transaction == null || transaction == undefined) {
              callback({status:404, error: constant.error.msg_no_register});
          }else 
          {
              transaction.remove(function(err, transaction){
                  if (err)
                  {
                    logger.error(constant.error.msg_mongo_error+": "+err);
                     callback({status: 500, error: err });
                  }
                  else 
                  {
                      callback(constant.success.msg_del_success);
                  }
                  
              })
          }
      })
}

/**
 * This method receive an id transaction parameter (mongo id) and find one transaction that match with this id
 * @param id
 * @return error or a transaction
 */
function updateTransaction (transaction, callback){
    Transaction.findOneAndUpdate({_id : transaction._id},{ $set: {value: transaction.value, 
        status:transaction.status, debtor:transaction.debtor, creditor:transaction.creditor}},
        function(err, transactionMongo){
            var newTransaction = new Transaction(transactionMongo);
             if (err){
                   logger.error(constant.error.msg_mongo_error+": "+err);
                    callback({status: 500, error: err });
                  }
             if(newTransaction.value == transaction.value  && newTransaction.status == transaction.status && newTransaction.creditor.equals(transaction.creditor) &&  newTransaction.debtor.equals(transaction.debtor))
             {
                 callback(constant.error.msg_reg_exists_update);
             }
             else if (newTransaction.value != transaction.value || newTransaction.status != transaction.status ||  !newTransaction.creditor.equals(transaction.creditor) ||  !newTransaction.debtor.equals(transaction.debtor))
             {
                //  console.log(newTransaction);

                 callback(constant.success.msg_update_success);
             }
             else {
                  callback( {status:404, error: constant.error.msg_no_register});
             }
        })
}