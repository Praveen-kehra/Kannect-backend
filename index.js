
const express = require("express");
require('dotenv').config();
const app = express();
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const PORT = process.env.PORT || 8800;
const multer = require("multer");
const path = require("path");
//***************** */ ROUTERS: start---------------------------------------
const userRoute = require('./routes/users');
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');

//**************** */ ROUTERS: end-----------------------------------------

mongoose.connect(process.env.MONGO_URL);

app.use("/images", express.static(path.join(__dirname, "public/images")));


//***************** */ MIDDLESWARES: start----------------------------
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

//******************* *MULTER: START ----------------------------

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "public/images"));
    },
    filename: (req, file, cb) => {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // cb(null, file.fieldname + '-' + uniqueSuffix);
        // console.log(file.fieldname);
        cb(null, req.body.name);
    },
});

const upload = multer({storage: storage});

app.post('/api/upload', upload.single("file"), (req, res) => {
    try{  
        return res.status(200).json("File Uploaded Successfully.")
    } catch(error){
        console.log(error);
    }
})


//******************* *MULTER: END ----------------------------


//router middlewares--------------------
app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);

//******************* *MIDDLESWARES: end----------------------------

app.get('/', (req, res)=>{
    res.send("Home Page: App is running !!!");
});  

app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
})
