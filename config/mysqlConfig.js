var mysql = require('mysql');

var mc = mysql.createConnection({
    host: "192.168.0.100",
    user: "sa",
    password: "redhat0703",
    database: "home",
    insecureAuth : true
  });

  mc.connect();

  setInterval(()=>{
    mc.query('Select 1');
  },5000)

module.exports = mc;