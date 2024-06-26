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
const { title } = require('process');



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
            if(rows.length > 0){
                return Promise.reject('This email allredy in use!');
            }
            return true;
        })

    }),
],//End of post data validation
    (req, res, next) => {
        const validation_result = validationResult(req);
        const {user_ssid, user_pass} = req.body;
        
        dbConnection.execute('SELECT * FROM user WHERE ssid = ?', [user_ssid])
        .then(([rows]) => {
                if(rows.length == 0){
                    dbConnection.execute("INSERT INTO user (ssid, passwords) VALUES(?, ?)", [user_ssid, user_pass])
                    .then(result => {
                       /*  swal.fire({
                            icon: 'success',
                            title: "SUCCEED",
                            text: "The recording SSID and PASSWORD was successful."
                        })  */
                        //res.render('index',{title:"The recording SSID and PASSWORD was successful."});
                        res.jsonp({success : true})
                    }).catch(err => {
                        if(err) throw err;
                    })
                    
                }else{
                    dbConnection.execute("UPDATE user SET passwords = ? WHERE ssid = ?", [user_pass, user_ssid])
                    .then(result => {
                        res.send(`Your Update Password successfully`)
                    }).catch(err => {
                        if(err) throw err;
                    })
                    
                }
    
        })
    }
)

port = 3000
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
