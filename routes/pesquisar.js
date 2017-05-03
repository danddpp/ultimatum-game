var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');
var OrdenarPorPercentual = require('./../functions/ordenar_por_percentual');

router.get('/pesquisar_filtros', function(req, res) {
	if(req.isAuthenticated()) {
		var nome_jogador = req.user.nome;

       Partida.find().where('status').equals('Finalizada').exec(function(err, partidas) {
       	 if(err) {
       	 	req.next(err);
       	 } else {
            res.render('painel-resultados/pesquisar-filtros', 
        	                            {nome_jogador: nome_jogador, 
        	                             mensagem:'',
        	                             partidas: partidas});
       	 }
       });  
	} else {
		res.redirect('/');
	}
});


router.post('/visualizar_resultados_por_partida', function(req, res) {
   if(req.isAuthenticated()) {
    var query = req.body.params.idPartida;
    var nome_jogador = req.user.nome;
    


    Partida.findById(query).exec(function(err, partida_) {
      if (err) {
      	req.next(err);
      } else {
        Jogador.find().where('id_partida').equals(query).exec(function(err, jogadores) {
            if(err) {
            	req.next(err);
            } else {
            	var ranking_jogadores = [];
            	ranking_jogadores = OrdenarPorPercentual(jogadores);
                
            	res.render('painel-resultados/ranking-por-percentual', {nome_jogador: nome_jogador,
            	                                                        mensagem: '',
            	                                                        jogadores: ranking_jogadores}); 
            }
        });
      }
    });

  
   } else {
   	 res.redirect('/');
   }
});


module.exports = router;