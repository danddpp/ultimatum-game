module.exports = function(req, res, next){
    var user = req.body.usuario;
     if(!(user.nome && user.sobrenome && user.email && user.login &&
        user.senha)){
     	res.render('home/criar_conta', {mensagem: 'É necessário preencher todos ' +
        'os campos!'});
     } else {
         return next();
     }
   
};


