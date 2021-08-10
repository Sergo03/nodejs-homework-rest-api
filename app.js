const express = require('express')
const logger = require('morgan')
const cors = require('cors')
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const jimp=require('jimp')
require("dotenv").config();
const authenticate = require('./middlewares/authenticate')
const User = require('./model');

const contactsRouter = require('./routes/api/contacts');
const userRouter = require('./routes/api/user');
const moment = require('moment');

const app = express()

require('./configs/passport-config');

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short'

app.use(logger(formatsLogger))
app.use(cors())
app.use(express.json())

app.use('/api/contacts', contactsRouter)
app.use('/api/users', userRouter);

const uploadDir = `${__dirname}/public/avatars`;

app.use('/avatars', express.static(uploadDir))

const tempDir = path.join(process.cwd(), "tmp");


const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, tempDir);
    },
    filename: (req, file, cb)=>{
        cb(null, file.originalname);
    },
    limits: {
        fileSize: 100000
    }
})
const uploadMiddleware = multer({
    storage
});

app.patch('/api/users/avatars', authenticate, uploadMiddleware.single('avatar'), async (req, res, next) => {
  const { path: tempName, originalname } = req.file;
  const now = moment().format("YYYY-MM-DD_hh-mm-ss");
  const fileName = `${now}_${originalname}`;
  const avatarURL = `${req.headers.host}/avatars/${fileName}`
  const fullFileName = path.join(uploadDir, fileName);

  try {
    await fs.rename(tempName, fullFileName);
    
    jimp.read(fullFileName)
      .then(img => {
        return img.resize(250, 250)
          .writeAsync(fullFileName)
      })
      .catch(error => {
        console.log(error);
      });
     
    const updateInfo = await User.updateById(req.user._id, { avatarURL: avatarURL })
    
    res.status(200).json({
      Status: '200 OK',
      'Content-Type': 'application / json',
      'ResponseBody': {
        "avatarURL": updateInfo.avatarURL
      }
    });
  } catch (error) {
    await fs.unlink(tempName);
  }
});



app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message })
})

module.exports = app
