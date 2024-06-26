// require('dotenv').config({ path: 'E:\\Project\\WorkSpace_web\\.env' });

const mysql = require("mysql2");
// const dbConnection = mysql.createPool({
const dbConnection = mysql.createConnection({
    host: "localhost",
    port: "3309",
    user: "root",
    password: "1234",
    database: "db_project"
}).promise()

dbConnection.connect((error) => {
    if (error) {
        console.error('Error connecting to MySQL database:', error);
    } else {
        console.log('Connected to MySQL database!');
    }
});

module.exports = dbConnection;