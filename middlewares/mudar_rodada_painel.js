var Estado_painel = require('./../models/Estado_painel');
var Jogador = require('./../models/Jogador');
var p_adversario = require('./../controllers/painel/p_adversario');
var p_round = require('./../controllers/painel/p_round');
var p_rodada = require('./../controllers/painel/p_rodada');

module.exports = function(req, res, next) {
   var query = req.body.data.id_painel;
   var id_rodada = req.body.data.id_rodada;

   var id_user = req.user._id;

   Jogador.find().where('usuario._id').equals(id_user).exec(function(err, jogador) {
    if (err) {

    } else {
      
      if(jogador[0].flag_rodada_round1 == false) {
      	
      	jogador[0].flag_rodada_round1 = true;
      	jogador[0].save(function() {
          Estado_painel.findById(query).exec(function(err, painel) {
          	 if(err) {
              req.next(err);
          	 } else {
             
              var p_id_usuario = req.user._id; 
                                         
              var jogador_painel = {
                  id_usuario: p_id_usuario,
                  valor_ofertado: 0,
                  nome_adversario: null,
                  bt_enviar_oferta: false,
                  subtotal: 0
                  };
                                          

              var enemies = painel.rodadas[0].rounds[0].adversarios;
              var p_adversarios = [];
                                          
                                          
              for(var e = 0; e < enemies.length; e++) {
                var id = enemies[e].id_usuario; 
                var p_adv = new p_adversario(id); 
                p_adversarios.push(p_adv);
              } 
                                          
                                          
              var round1 = new p_round(1, jogador_painel);
              round1.adversarios = p_adversarios;
                                          
              var round2 = new p_round(2, jogador_painel);
              round2.adversarios = p_adversarios;

              var round3 = new p_round(3, jogador_painel);
              round3.adversarios = p_adversarios;

              var round4 = new p_round(4, jogador_painel);
              round4.adversarios = p_adversarios;

              var round5 = new p_round(5, jogador_painel);
              round5.adversarios = p_adversarios;

              var round6 = new p_round(6, jogador_painel);
              round6.adversarios = p_adversarios;

                                          
              var p_rounds = [];
              p_rounds.push(round1);
              p_rounds.push(round2);
              p_rounds.push(round3);
              p_rounds.push(round4);
              p_rounds.push(round5);
              p_rounds.push(round6);
                                            
              var num_nova_rodada = Number(painel.rodadas.length+1);
              var rodada_painel = new p_rodada(id_rodada, num_nova_rodada);  
                                              
              rodada_painel.rounds = p_rounds;

              painel.rodadas.push(rodada_painel);
                                           
              painel.save();
              
              next();
          	 }
          });
      	});
      } else {
      	//console.log('here now');
      	next();
      }
    }
   });   
};