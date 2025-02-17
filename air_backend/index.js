const express = require("express")
const app = express()
const cors = require("cors")
const mongoose = require("mongoose")
require("dotenv").config()
const User = require("./models/User")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const CookieParser = require('cookie-parser');
const multer = require('multer');

const imageDownloader = require('image-downloader');

const port = 4000

const bcryptSalt = bcrypt.genSaltSync(10);
// Eof9FpskirFAq7Gt
const jwtSecret = "sfsdfdsfsdfsdfds";

app.use(express.json())
app.use(CookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173'
}))

// console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL)

app.get('/test', (req, res) => {
    res.json("Test Ok")
});

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {

        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc);
    }
    catch (error) {
        console.log(error);
        res.status(422).json(error);
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (userDoc) {
        const isMatch = bcrypt.compareSync(password, userDoc.password);
        if (isMatch) {
            jwt.sign({
                email: userDoc.email,
                id: userDoc._id,
            }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);

            });
        }
        else {
            res.status(422).json({ error: "Invalid Credentials" });
        }
    }

})

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, _id });
        });
    } else {
        res.json(null);
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token').json({ message: "Logged Out" });
});


app.post('/upload-by-link', async(req, res) => {
    const { link } = req.body;


    const newName = "Photo" + Date.now() + '.jpg';

    await imageDownloader.image({
        url: link,
        dest: __dirname + '/uploads/' +newName
    });

    res.json(newName);

})


app.post('upload', (req, res) => {
    // const storage = multer.diskStorage({
    //     destination: (req, file, cb) => {
    //         cb(null, 'uploads');
    //     },
    //     filename: (req, file, cb) => {
    //         cb(null, file.originalname);
    //     }
    // });

    // const upload = multer({ storage: storage }).single('file');

    // upload(req, res, (err) => {
    //     if (err) {
    //         console.log(err);
    //         return res.status(500).json(err);
    //     }
    //     res.json(req.file);
    // })
})


app.listen(port, () => {
    console.log(`App listening on Port ${port}`)
    console.log(`MongoDB Started...🤩`)
})

