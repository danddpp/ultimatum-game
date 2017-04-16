module.exports = function(req, res, next){
    var user = req.body.usuario;
     if(!(user.login && user.senha)){
     	res.render('home/index', {mensagem: 'É necessário preencher todos ' +
        'os campos!'});
     } else {
         return next();
     }
   
};


