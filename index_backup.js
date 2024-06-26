// require('dotenv').config({ path: 'E:\\Project\\WorkSpace_web\\.env' });

const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');
const { Session } = require('inspector');
const mysql = require('mysql2');
const md5 = require('md5')
var createError = require('http-errors');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

const app = express();
app.use(express.urlencoded({extended: false}))

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app config
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'views')));

app.use(cookieSession({
    name: 'Session',
    keys: ['key1', 'key2'],
    maxAge: 3600 * 1000 // 1hr
})) 

/* const pool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 3309,
}); */ 

//Declaring Custom Middlewere
const ifNotLoggedIn = (req, res, next) =>{
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}

const ifLoggedIn = (req, res, next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}

// root page
app.get('/', ifNotLoggedIn, (req, res, next) =>{
    dbConnection.execute("SELECT ssid FROM users WHERE id = ?", [req.session.userID])
    .then(([rows]) =>{
        res.render('home', {
            name: rows[0].name
        })
    })
})

//memb
app.post('/member', ifLoggedIn, [
    body('user_ssid', 'Invalid SSID Address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT * FROM user WHERE ssid = ?', [value])
        .then(([rows]) => {
            console.log(rows)
            if(rows.length > 0){
                console.log("Address : false");
                return Promise.reject('This email allredy in use!');
                
            }
            isAddress = true;
            console.log("Address : true");
            return true;
        })

    }),
    body('user_pass', 'The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],//End of post data validation
    (req, res, next) => {
        const validation_result = validationResult(req);
        const {user_ssid, user_pass} = req.body;

        if(validation_result.isEmpty()){
            bcrypt.hash(user_pass, 12).then((hash_pass) =>{
                dbConnection.execute("INSERT INTO user (ssid, passwords) VALUES(?, ?)", [user_ssid, hash_pass])
                .then(result => {
                    res.send(`Yors Save SSID and Password successfully`)
                }).catch(err => {
                    if(err) throw err;
                })
            }).catch(err => {
                if(err) throw err;
            })
        } else{
            let allErrors = validation_result.errors.map((error) => {
                return error.msg;
            })
            res.render('login-register', {
                member_error: allErrors,
                old_data: req.body
            })
        }
    }
)

/* app.post('/add', (req, res) => {
    const { ssid, passwords } = req.body
    console.log(ssid, passwords)
    const sql = 'INSERT INTO user (ssid, passwords) VALUES (?, ?)';
    pool.query(sql, [ssid, md5(passwords)], (err, results) => {
        if (err) {
            console.log(err)
            res.json({'msg': 'failed'})
        } else {
            res.json({'msg': 'done'});
        }
    })
}) */
//console.log(process.env)
port = 3000
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
