var mysql = require('mysql');

var mc = mysql.createConnection({
    host: "us-cdbr-east-05.cleardb.net",
    user: "bc41b1da526a7a",
    password: "c925ac4c",
    database: "heroku_ec39e77ebc0cf96",
    insecureAuth : true
  });

  mc.connect();

  setInterval(()=>{
    mc.query('Select 1');
  },5000)

module.exports = mc;