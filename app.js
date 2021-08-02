const express = require('express')
const logger = require('morgan')
const cors = require('cors')
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const jimp=require('jimp')
require("dotenv").config();




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

app.patch('/api/users/avatars', uploadMiddleware.single("avatar"), async(req, res, next)=> {
  const { path: tempName, originalname } = req.file;
  const resizeAvatar = jimp.read(tempName)
    .then(img => {
      img.resize(250, 250)
    })
    .catch(error => {
      console.log(error);
    });
  const now = moment().format("YYYY-MM-DD_hh-mm-ss");

  const fileName = `${now}_${originalname}`;
  try {
    const fullFileName = path.join(uploadDir, fileName);
    await fs.rename(tempName, fullFileName)
    const result = {
      _id: req.body.name,
      image:fileName
    }
    res.status(200).json({
      
    })
  } catch (error) {
    
  }
 

})



app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message })
})

module.exports = app
