var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');

router.get('/painel_persuasao', function(req, res) {
    if(req.isAuthenticated()) {
       var nome_jogador = req.user.nome;
       var nivel = req.user.nivel;
       var id_ = req.user._id;

    Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
    	 if(err) {
    	 	req.next(err);
    	 } else {
         res.render('painel-persuasoes/index', 
     	                            {nome_jogador: nome_jogador,
     	                             id_usuario: id_, 
     	                             mensagem:'',
     	                             nivel_usuario: nivel,
     	                             partidas: partidas});
    	 }
    });

    } else {
    	res.redirect('/');
    }
});


module.exports = router;