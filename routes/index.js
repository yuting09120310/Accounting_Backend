var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var mc = require('../config/mysqlConfig')

//Start token驗證
const jwt = require("jsonwebtoken");
const { expressjwt } = require("express-jwt");
const secretKey = 'DEMO';



router.post("/login", (req, res) => {
  //利用使用者post進來的資料去搜尋資料庫
  let data = 'SELECT * FROM `user_login` WHERE password = ' + `'${req.body.password}'` + 'user =' + `'${req.body.username}'`;
  mc.query(data, function (error, results, fields) {
    //如果results => 搜尋結果大於1 那就給予token 授予以下curd功能  由於results是物件 不能直接做判斷 所以須先轉型確認長度
    var size = Object(results).length;
    
    if (size > 0) {
      //Start token
      const payload = {
        username: req.body.username
      }
      const token = jwt.sign(payload, secretKey, { expiresIn: '30s' });
      return res.send({
        token,
        data: results,
      });
      //End token
    } else {
      //登入失敗
      return res.send({ data: "noData" });
    }
  });
});

//搜尋特定使用者
router.get('/account/:id', function (req, res) {
  // 是為了修復 CORS 的問題而設
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  mc.query('SELECT * FROM user_login where userId = ' + req.params.id, function (error, results, fields) {
    if (error) throw error;
    return res.send({ data: results });
  });
});


//註冊時先驗證有無相同使用者
router.post('/checkUser', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let data = 'SELECT * FROM `user_login` WHERE user = ' + `'${req.body.username}'`;

  mc.query(data,  function (error, results, fields) {
    var size = Object(results).length;
    console.log(results)

    if (size > 0) {
      return res.send({ error: true, data: error, message: '已有相同帳號' });;
    }
    else {
      return res.send({ error: false, data: results, message: 'OK' });
    }
  });
});

//新增使用者
router.post('/addUser', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  var addData = req.body
  console.log(addData)

  let {userNamem, password, account_one, money_one , account_two , money_two , account_three ,money_three} = req.body

  let account = [[account_one,money_one],[account_two,money_two],[account_three,money_three]]

  account.forEach(element => {
    if(element[0].length != 0){
      console.log(element[0],element[1]);
    } 
  });

  //  ? 會讀取後面的 addData
  // mc.query('INSERT INTO user_login SET ?', addData, function (error, results, fields) {
  //   if (error) {
  //     return res.send({ error: true, data: error, message: '已有相同密碼' });;
  //   }
  //   else {
  //     return res.send({ error: false, data: results, message: '新增使用者成功' });
  //   }
  // });
});

// -----------------------------------------------------------------------------------------------------------

//登入後帶出使用者銀行
router.get('/bank/:id', function (req, res) {
  // 是為了修復 CORS 的問題而設
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  mc.query('SELECT * FROM account_bank where userId = ' + req.params.id, function (error, results, fields) {
    if (error) throw error;
    return res.send({ data: results });
  });
});

//帶出使用者花費歷史紀錄
router.get('/record/:id', function (req, res) {
  // 是為了修復 CORS 的問題而設
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let allBank;

  mc.query('SELECT * FROM account_bank where userId = ' + req.params.id, function (error, results, fields) {
    allBank = results;
  });

  mc.query('SELECT * FROM money_record where Id = ' + req.params.id, function (error, results, fields) {
    if (error) throw error;
    return res.send({ data: results, allBank });
  });

});

//帶出使用者花費歷史紀錄
router.get('/record/:id/:bank', function (req, res) {
  // 是為了修復 CORS 的問題而設
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let allBank;

  mc.query('SELECT * FROM account_bank where userId = ' + req.params.id, function (error, results, fields) {
    allBank = results;
  });

  mc.query(`SELECT * FROM money_record where Id = ${req.params.id} AND 銀行 = '${req.params.bank}'`, function (error, results, fields) {
    if (error) throw error;
    return res.send({ data: results, allBank });
  });
  
});


//寫入花費紀錄以及更新最新餘額
router.post('/pay', function (req, res) {
  // 是為了修復 CORS 的問題而設
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let id = req.body.userId;
  let name = req.body.user;
  let money = req.body.inputMoney;
  let bank = req.body.selectBank;
  let type = req.body.selectType;
  let remark = req.body.inputRemark;
  let balans;

  let selectSQL = `SELECT money FROM account_bank WHERE userId=${id} AND bank='${bank}'`;

  let date = new Date().toISOString().slice(0, 10)

  mc.query(selectSQL, function (error, results, fields) {
    //取得當前餘額 以及 此筆金額 扣除後的結果
    balans = results[0].money - money;

    //將此筆資料 寫入紀錄中 record
    let insertSQL = 'INSERT INTO `money_record`(`Id`, `姓名`, `錢`, `銀行`, `類型`, `事項`, `餘額`, `類別`,`時間`) VALUES ' + `('${id}','${name}','-${money}','${bank}','${type}','${remark}','${balans}','0','${date}')`
    mc.query(insertSQL);

    //更新當前餘額
    let updateSQL = `UPDATE account_bank SET money='${balans}' WHERE userId='${id}' AND bank='${bank}'`
    mc.query(updateSQL);

    //搜尋最新餘額回傳到用戶端
    mc.query(selectSQL, function (error, results, fields) {
      return res.send({ data: results });
    });
  });

});


//寫入花費紀錄以及更新最新餘額
router.post('/earnings', function (req, res) {
  // 是為了修復 CORS 的問題而設
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let id = req.body.userId;
  let name = req.body.user;
  let money = req.body.inputMoney;
  let bank = req.body.selectBank;
  let type = req.body.selectType;
  let remark = req.body.inputRemark;
  let balans;

  let selectSQL = `SELECT money FROM account_bank WHERE userId=${id} AND bank='${bank}'`;

  let date = new Date().toISOString().slice(0, 10)

  mc.query(selectSQL, function (error, results, fields) {
    //取得當前餘額 以及 此筆金額 扣除後的結果
    balans = Number(results[0].money) + Number(money);

    //將此筆資料 寫入紀錄中 record
    let insertSQL = 'INSERT INTO `money_record`(`Id`, `姓名`, `錢`, `銀行`, `類型`, `事項`, `餘額`, `類別`, `時間`) VALUES ' + `('${id}','${name}','${money}','${bank}','${type}','${remark}','${balans}' , 1 ,'${date}')`
    mc.query(insertSQL);

    //更新當前餘額
    let updateSQL = `UPDATE account_bank SET money='${balans}' WHERE userId='${id}' AND bank='${bank}'`
    mc.query(updateSQL);

    //搜尋最新餘額回傳到用戶端
    mc.query(selectSQL, function (error, results, fields) {
      return res.send({ data: results });
    });
  });

});



//如果使用者有token 需要利用以下去解析json
router.use(expressjwt({ secret: secretKey, algorithms: ['HS256'] }).unless({ path: [/^\/api\//] }));
// token驗證

module.exports = router;

