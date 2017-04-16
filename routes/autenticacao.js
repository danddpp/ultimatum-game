var router = require('express').Router();
var passport = require('passport'); 
var logout = require('express-passport-logout');
var verificarCampos = require('./../middlewares/autenticacao_login');



router.post('/login', verificarCampos, passport.authenticate('local'),
    function(req, res, next) {
       res.redirect('/menu-jogador');
});


router.get('/logout', function(req, res, next) {
        req.logout();
        req.session.destroy(function (err) {
          if (err) { 
            return next(err); 
          }
          res.redirect('/');
        });
});

module.exports = router;
                   

		 

