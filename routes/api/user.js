const express = require('express');
const router = express.Router();
const User = require('../../model');
const jwt = require("jsonwebtoken");
const gravatar = require('gravatar')
const { v4 } = require('uuid');
require("dotenv").config();
const { schemaSignupValidate,schemaVerifyValidate } = require('../../utils/validate/schemas/Schema');
const authenticate = require('../../middlewares/authenticate');
const { findOneAndUpdate } = require('../../model/contact');
const sendMail = require('../../utils/sendMail');


router.post('/signup', async (req, res, next) => {
    const {email,password}=req.body
    
    try {
        const { error } = schemaSignupValidate.validate({email,password});
        
        if (error) {
            return res.status(400).json({
                Status: '400 Bad Request',
                'Content-Type': 'application / json',
                ResponseBody: 'Ошибка от Joi или другой библиотеки валидации'
            });
        }
        const result = await User.getOne({ email });
        if (result) {
            res.status(409).json({
                Status: '409 conflict',
                'Content-Type': 'application / json',
                'ResponseBody': {
                    "message": "Email in use"
                }
            });
        }
        const verifyToken = v4()
        
        const newUser = await User.add({ email, password, verifyToken });
        
        const mail = {
            to: email,
            subject: 'Подтвердите свой email',
            text:`http://localhost:3000/api/users/verify/${verifyToken} ссылка для подтверждения email`
        }
        
        const avatarURL = gravatar.url(newUser.email,{protocol:'http'})
        
        const updateInfo = await User.updateById(newUser._id, { avatarURL })
        await sendMail(mail);
        res.status(201).json({
            Status: '201 Created',
            'Content-Type': 'application / json',
            'ResponseBody': {
                "user": {
                    "email": newUser.email,
                    "subscription": newUser.subscription
                }
            }
        });
        
    } catch (error) {
        next(error)
    }
})

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const { error } = schemaSignupValidate.validate({email,password});
        
        if (error) {
            return res.status(400).json({
                Status: '400 Bad Request',
                'Content-Type': 'application / json',
                'ResponseBody': 'Ошибка от Joi или другой библиотеки валидации'
            });
        }
        const user = await User.getOne({ email })
        
        if  (!user || !user.comparePassword(password) ) {
            return res.status(401).json({
                Status: '401 Unauthorized',
                'ResponseBody': {
                    "message": "Email or password is wrong"
                }
            });
        }
        if (!user.verify) {
            return res.status(401).json({
                Status: '401 Unauthorized',
                'ResponseBody': {
                    "message": "User is not verification"
                }
            })
        }
         
        const { SECRET_KEY } = process.env;
        const payload = {
            id: user._id
        };
        const token = jwt.sign(payload, SECRET_KEY);
        const result = await User.updateById(user._id, { token })
        
        return res.status(200).json({
            Status: '200 OK',
            'Content-Type': 'application/json',
            'ResponseBody': {
                "token": token,
                "user": {
                    "email": result.email,
                    "subscription": result.subscription
                }
            }
        });
        
    } catch (error) {
        next(error)
    }
})

router.post('/logout', authenticate, async (req, res, next) => {
    try {
        const result= await User.updateById(req.user._id, { token: null });
        if (!result) {
            return res.status(401).json({
                Status: '401 Unauthorized',
                'Content-Type': 'application/json',
                'ResponseBody': {
                    "message": "Not authorized"
                }
            });
        }
        return res.status(204).json({
            Status: '204 No Content',
            code: 204,
            'message': 'Logout success'
        })

    } catch (error) {
        next(error)
    }
});

router.post('/current', authenticate, async (req, res, next) => {
    try {
        res.status(200).json({
            Status: '200 OK',
            'Content-Type': 'application / json',
            'ResponseBody': {
                "email": req.user.email,
                "subscription": req.user.subscription
            }
        });
        
    } catch (error) {
        next(error)
    }
})
router.get('/verify/:verifyToken', async (req, res, next) => {
   
    const { verifyToken } = req.params;
    
    try {
        const user = await User.getOne({ verifyToken })
        if (!user) {
            return res.status(404).json({
                Status: '404 Not found',
                'ResponseBody': {
                    'message': 'User not found'
                }
            })
        }

        const result = await User.updateById(user._id,{verifyToken:null, verify:true})
        return res.status(200).json({
            Status: '200 OK',
            'ResponseBody': {
                'message': 'Verification successful'
            }
        });
        
    } catch(error) {
        next(error)
    }
})

router.post('/verify', async (req, res, next) => {
    const { email } = req.body;
     
    try {
        const { error } = schemaVerifyValidate.validate({email});
        if (error) {
            return res.status(400).json({
                Status: '400 Bad Request',
                'Content-Type': 'application / json',
                'ResponseBody': 'Ошибка от Joi или другой библиотеки валидации'
            });
        }
       
        const user = await User.getOne({ email });
        const mail = {
            to: email,
            subject: 'Подтвердите свой email',
            text:`http://localhost:3000/api/users/verify/${user.verifyToken} ссылка для подтверждения email`
        }
        if (!user.verify) {
            await sendMail(mail);
            return res.status(200).json({
                Status: '200 Ok',
                'Content-Type': 'application/json',
                'ResponseBody': {
                    "message": "Verification email sent"
                }
            });
        }
          
        return res.status(400).json({
            Status: '400 Bad Request',
            'Content-Type': 'application/json',
            'ResponseBody': {
                message: "Verification has already been passed"
            }
        });
         
        
        
    } catch (error) {
        next(error)
    }
})


module.exports = router