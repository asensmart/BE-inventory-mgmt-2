const UserSchema = require('../models/UserSchema')
const decodeJWT = require('jwt-decode');

const AuthenticationMiddleware = (req, res, next) => {

    const token = req.header('userToken');

   if (token) {
       const now = parseInt(Date.now().valueOf() / 1000);

       try {
           let decryptedToken = decodeJWT(token);
           if(decryptedToken.exp >= now) {
               UserSchema.findOne({username : decryptedToken.username}).then(user => {
                   if(user !== null) {
                       req.user = user
                       next();
                   }else {
                       return res.json({key : 'error', message : 'User not found'});
                   }
               }).catch(()=>{
                   return res.json({key : 'error', message : 'Something went wrong'});
               })
           }else {
               return res.json({key : 'error', message : 'Token expired'});
           }
       } catch (e) {
           return res.json({key : 'error', message : 'Something went wrong'});
       }
   } else {
       return res.json({key : 'error', message : 'Token required'});
   }
}

module.exports = {AuthenticationMiddleware}