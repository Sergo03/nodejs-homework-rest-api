const express = require('express');
const router = express.Router();
const User = require('../../model');
const jwt = require("jsonwebtoken");
const gravatar = require('gravatar')
require("dotenv").config();
const { schemaSignupValidate } = require('../../utils/validate/schemas/Schema');
const authenticate = require('../../middlewares/authenticate');

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
       
        const newUser = await User.add({ email, password });

        const avatarURL = gravatar.url(newUser.email,{protocol:'http'})
        
        const updateInfo = await User.updateById(newUser._id, { avatarURL })
        res.status(201).json({
            Status: '201 Created',
            'Content-Type': 'application / json',
            'ResponseBody': {
                "user": {
                    "email": newUser.email,
                    "subscription": newUser.subscriprtion
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
        if (!user || !user.comparePassword(password)) {
            return res.status(401).json({
                Status: '401 Unauthorized',
                'ResponseBody': {
                    "message": "Email or password is wrong"
                }
            });
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


module.exports = router