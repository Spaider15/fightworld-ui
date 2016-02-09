var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/main', function(req, res, next) {
  res.render('main', { title: 'Express' });
});
router.get('/login', function(req, res, next) {
  res.render('main', { title: 'Express' });
});
router.get('/fight', function(req, res, next) {
  res.render('fight', { title: 'Express' });
});
module.exports = router;
