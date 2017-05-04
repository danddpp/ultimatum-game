var router = require('express').Router();
var Jogador = require('./../models/Jogador');
var sortearValores = require('./../functions/sortearValores');
var Partida = require('./../models/Partida');
var c_round = require('./../controllers/round');
var c_jogador = require('./../controllers/jogador');
var c_estado_painel = require('./../controllers/painel/estado_painel');
var p_jogador = require('./../controllers/painel/p_jogador');
var p_round = require('./../controllers/painel/p_round');
var p_rodada = require('./../controllers/painel/p_rodada');
var p_adversario = require('./../controllers/painel/p_adversario');
var Estado_Painel = require('./../models/Estado_Painel');
var mudar_rodada_painel = require('./../middlewares/mudar_rodada_painel');

router.get('/menu-jogador', function(req, res) {
    if(req.isAuthenticated()) {
        var nome_jogador = req.user.nome;
        var nivel = req.user.nivel;
        //console.log(req.user);
        //console.log(req.session);
        res.render('menu-jogador/index', {nome_jogador: nome_jogador,
                                          nivel_usuario: nivel,
        	                                mensagem: 'Bem vindo '+ nome_jogador +'!'});
    } else {
    	res.redirect('/');
    }
});




router.post('/entrar_sala', function(req, res) {
     if (req.isAuthenticated()) {
        var idJogador = req.user._id;
        var query = 'Em andamento';
        var flag = false;
        
        Partida.find(query).exec(function(err, partidas) {
            if(partidas) {

               for(var i = 0; i < partidas.length; i++) {
                 
                if(partidas[i].status == 'Em andamento') {
                
                 var jogadores = [];
                 jogadores = partidas[i].jogadores;   
                
                  for(var j = 0; j < jogadores.length; j++) {
                     if(jogadores[j].usuario._id == idJogador) {
                        //console.log('jogadores');        
                        flag = true;
                     }
                  }

                }

               }
                //console.log(flag);
                if(flag == false) {
                   var id_partida = req.body.params.idPartida;
                   var cursoPartida = req.body.params.tipoCurso;
                   //var adversarios = [];

                   Partida.findById(id_partida).exec(function(err, partida) {
                     if(partida) {
                       
                       var cursoJogador = req.user.curso; 

                       
                         if(cursoPartida == "Livre") {
                           partida.num_jogadores++;             

                           var novoJogador = new c_jogador(req.user);
                           //console.log(novoJogador); 
                           var jogador = new Jogador({
                              flag_rodada_round1: novoJogador.flag_rodada_round1,
                              usuario: novoJogador.usuario,
                              id_partida: novoJogador.id_partida, 
                              valores_sorteados: sortearValores(),
                              valores_ofertados: novoJogador.valores_ofertados,
                              ofertas_recebidas: novoJogador.ofertas_recebidas,
                              num_ofertas_aceitou: novoJogador.num_ofertas_aceitou,
                              num_ofertas_recusou: novoJogador.num_ofertas_recusou,
                              pontuacao_max: novoJogador.pontuacao_max,
                              percentual_ganho: novoJogador.percentual_ganho
                          });        

                                         
                           Jogador.create(jogador, function(err, jogador) {
                              if(err) {
                                return req.next(err);
                              } else {
                                //inserindo o dono da sala
                                partida.jogadores.push(jogador);
                                jogador.id_partida = partida._id;

                                jogador.save();
                                
                                partida.save( function(err) {
                                 if(err) {
                                   return req.next(err);
                                 } else { 
                                  res.redirect('/menu_partida');
                                 }
                                });


                              }        
                           });
                           
                           

                         } else {
                            
                           if(cursoJogador == cursoPartida) {
                             partida.num_jogadores++;
                             
                           var novoJogador = new c_jogador(req.user);
                           //console.log(novoJogador); 
                           var jogador = new Jogador({
                              flag_rodada1_round1: novoJogador.flag_rodada1_round1,
                              usuario: novoJogador.usuario, 
                              valores_sorteados: sortearValores(),
                              valores_ofertados: novoJogador.valores_ofertados,
                              ofertas_recebidas: novoJogador.ofertas_recebidas,
                              num_ofertas_aceitou: novoJogador.num_ofertas_aceitou,
                              num_ofertas_recusou: novoJogador.num_ofertas_recusou,
                              pontuacao_max: novoJogador.pontuacao_max,
                              percentual_ganho: novoJogador.percentual_ganho
                          });        

                                         
                           Jogador.create(jogador, function(err, jogador) {
                              if(err) {
                                return req.next(err);
                              } else {
                                //inserindo o dono da sala
                                partida.jogadores.push(jogador);
                                
                                
                                partida.save(function(err) {
                                 if(err) {
                                   return req.next(err);
                                 } else { 
                                    res.redirect('/menu_partida');
                                 }
                                });


                              }        
                           });

                           } else {
                             console.log("curso do jogador não é o mesmo que o da partida!");
                             req.next();
                           }
                         }
                             
                     } else {
                       return req.next(err);
                     }
                   });    
                } else {
                  console.log('ja estou participando de um jogo');
                  req.next();
                }

               
            } else {
                return req.next(err);
            }
        });
        
     } else {
        return res.redirect('/');
     }
});





//rota acessada apenas no primeiro round da primeira rodada
router.post('/iniciar_partida', function(req, res) {
    if(req.isAuthenticated()) {
    
      var query = req.body.idPartida;
      //res.req.params.id = null;
      //console.log(res.req);
      
      Partida.findById(query).exec(function(err, partida) {
         if(partida) {
         
          var eu = req.user._id;
          var flag = false; 
          var jogadores = [];
          var meu_id_jogador = 0;
          jogadores = partida.jogadores;
         
         for(var i = 0; i < jogadores.length; i++) {
           if(eu == jogadores[i].usuario._id) {
              flag = true;
              meu_id_jogador = jogadores[i]._id; 
           }   
         }
          
          var adversarios = [];
          var valor_total_R1_round1 = 0;
          if(flag == true) {
           for(var i = 0; i < jogadores.length; i++) {
             if(eu != jogadores[i].usuario._id) {   
                adversarios.push(jogadores[i]);
             } else {
                valor_total_R1_round1 = jogadores[i].valores_sorteados[0];
             }
           }

          
          Jogador.findById(meu_id_jogador).exec(function(err, jogador) {
            if(err) {
              req.next(err);
            } else {
              if(jogador.flag_rodada_round1 == false) {
                 
                 jogador.flag_rodada_round1 = true;
                 jogador.save();

                 //dados para armazenamento do estado do painel de jogo
                  var p_id_usuario = req.user._id; 
                  //var jogador_painel = new p_jogador(p_id_usuario);
                  var jogador_painel = {
                    id_usuario: p_id_usuario,
                    valor_ofertado: 0,
                    nome_adversario: null,
                    bt_enviar_oferta: false,
                    subtotal: 0
                  };                         
                 



                 var p_adversarios = [];
                 for(var i = 0; i < adversarios.length; i++) {
                   var id = adversarios[i].usuario._id;
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
                    
                  var p_id_rodada = partida.rodadas[0]._id;   
                  var rodada_painel = new p_rodada(p_id_rodada, 1);  
                      
                  rodada_painel.rounds = p_rounds;

                  var p_rodadas = [];
                  
                  p_rodadas.push(rodada_painel);
                  
                  var c_painel = new c_estado_painel(partida._id, meu_id_jogador);
                  c_painel.rodadas = p_rodadas;

                  //console.log(p_rodadas); 
                   
                  var painel = new Estado_Painel({
                      id_partida: c_painel.id_partida,
                      id_jogador: c_painel.id_jogador,
                      rodadas:c_painel.rodadas
                  });

                  
                  Estado_Painel.create(painel, function(err, painel) {
                     if(err) {
                       req.next(err)
                     } else {
                 
                        var id_painel = painel._id;
                        var id_rodada = painel.rodadas[0].id_rodada;
                        var p_round = painel.rodadas[0].rounds[0];
                        var aux_id_partida = partida._id;
                        var aux_num_round = 0;
                        var aux_num_rodada = 0;
                        var aux_indice_valor = 0;
                        
                        var painel_round = {
                            id_painel: id_painel,
                            id_rodada: id_rodada,
                            p_round: p_round,
                            aux_id_partida: aux_id_partida,
                            aux_num_round: aux_num_round,
                            aux_num_rodada: aux_num_rodada,
                            aux_indice_valor: aux_indice_valor
                        };                  

                        var params = {
                             eu: req.user,
                             valor_total: valor_total_R1_round1,
                             adversarios: adversarios,
                             rodada: partida.rodadas[0],
                             id_rodada: partida.rodadas[0]._id,
                             id_partida: partida._id,
                             id_round: partida.rodadas[0].rounds[0]._id,
                             id_jogador: null,
                             num_rodada: partida.rodadas[0].numero_rodada,
                             num_round: partida.rodadas[0].rounds[0].numero,
                             indice_valor: 0,
                             painel: painel_round,
                             status_partida: partida.status
                         };
                        console.log(params); 
                        res.render('menu-jogador/painel_jogador', {params: params});
                     }
                  });
              } else {
                
                Estado_Painel.find().where('id_jogador').equals(meu_id_jogador).exec(function(err, painel) {
                   
                   var id_painel = painel[0]._id;
                   var id_rodada = painel[0].rodadas[0].id_rodada;
                   var p_round = painel[0].rodadas[0].rounds[0];
                   var aux_id_partida = painel[0].aux_id_partida;
                   var aux_num_round = painel[0].aux_num_round;
                   var aux_num_rodada = painel[0].aux_num_rodada;
                   var aux_indice_valor = painel[0].aux_indice_valor;                   
                   
                   
                   var painel_round = {
                       id_painel: id_painel,
                       id_rodada: id_rodada,
                       p_round: p_round,
                       aux_id_partida: aux_id_partida,
                       aux_num_round: aux_num_round,
                       aux_num_rodada: aux_num_rodada,
                       aux_indice_valor: aux_indice_valor
                   };


                   var params = {
                        eu: req.user,
                        valor_total: valor_total_R1_round1,
                        adversarios: adversarios,
                        rodada: partida.rodadas[0],
                        id_rodada: partida.rodadas[0]._id,
                        id_partida: partida._id,
                        id_round: partida.rodadas[0].rounds[0]._id,
                        id_jogador: null,
                        num_rodada: partida.rodadas[0].numero_rodada,
                        num_round: partida.rodadas[0].rounds[0].numero,
                        indice_valor: 0,
                        painel: painel_round,
                        status_partida: partida.status
                    };
                   res.render('menu-jogador/painel_jogador', {params: params}); 
                });

              }
            }
          });
          

          } else {
             console.log('não posso jogar essa partida. não estou nessa sala!!!');
          }


         } else {
           return req.next(err);
         }
      });
    } else {
      res.redirect('/');
    }
});



router.post('/iniciar_novoRound', function(req, res) {
    
    if(req.isAuthenticated()) {
      var query = req.body.data.id_partida;
      var num_rodada = req.body.data.num_rodada;
      var num_round = req.body.data.num_round;
      var indice_valor = ++req.body.data.indice_valor;
      var id_painel_ = req.body.data.id_painel;



      if(num_round < 7) {
                      
        if(num_rodada < 7) {

          Partida.findById(query).exec(function(err, partida) {
          if(partida) {

                  var aux = partida.rodadas.length-1;
                  var rodada = partida.rodadas[aux];
                  var novo_round = rodada.rounds[num_round];
                  var id_partida = partida._id;
                  var adversarios = [];
                  var id_jogador = 0;

                  Jogador.find().where('id_partida').equals(id_partida)
                                                    .exec(function(err, jogadores) {
                  var eu = req.user._id;
                  var valor_total = 0;
                  
                   for(var i = 0; i < jogadores.length; i++) {
                     
                     if(jogadores[i].usuario._id != eu) {
                       
                       var jogador = jogadores[i];
                       var soma_valores = 0;
                       var soma_ofertas_recebidas = 0;

                       for(var j = 0; j < jogador.ofertas_recebidas.length; j++) {
                          
                          //soma total das ofertas recebidas
                          soma_ofertas_recebidas += 
                                  Number(jogador.ofertas_recebidas[j].ofertaRecebida);

                          //soma das ofertas que foram aceitas 
                          if(jogador.ofertas_recebidas[j].aceitei == 'sim') {
                            
                           soma_valores += Number(jogador.ofertas_recebidas[j].ofertaRecebida);
                          } 

                       }

                       var subtotal_valores_ofertados = 0;
                       var subtotal_ofertas_aceitas = 0;
                       var aux_a = 0;
                       var aux_b = 0;
                       var subtotal = 0;
                       for(var k = 0; k < jogador.ofertas_realizadas.length; k++) {
                         
                         aux_a = Number(jogador.ofertas_realizadas[k].vrTotal);
                         aux_b = Number(jogador.ofertas_realizadas[k].ofertaEnviada);
                         subtotal = aux_a - aux_b;

                         subtotal_valores_ofertados += Number(subtotal);

                         if(jogador.ofertas_realizadas[k].aceitou == 'sim') {
                            subtotal_ofertas_aceitas += Number(subtotal);
                         }
                       }

                       var ganho_possivel =  subtotal_valores_ofertados + 
                                             soma_ofertas_recebidas;

                       var ganho_obtido = soma_valores + subtotal_ofertas_aceitas;
                       
                       var percentual_ganho = Number((ganho_obtido*100)/ganho_possivel);

                       jogadores[i].percentual_ganho = percentual_ganho;
                       
                       adversarios.push(jogadores[i]);

                       
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      id_jogador = jogadores[i]._id;
                     }
                   }
                   
                   Estado_Painel.findById(id_painel_).exec(function(err, painel) {
                      if(err) {
                        req.next(err);
                      } else {
                        
                       var id_painel = painel._id;
                       var id_rodada = painel.rodadas[aux].id_rodada;
                       var p_round = painel.rodadas[aux].rounds[num_round];
                       var aux_id_partida = painel.aux_id_partida;
                       var aux_num_round = painel.aux_num_round;
                       var aux_num_rodada = painel.aux_num_rodada;
                       var aux_indice_valor = painel.aux_indice_valor;



                       var painel_round = {
                           id_painel: id_painel,
                           id_rodada: id_rodada,
                           p_round: p_round,
                           aux_id_partida: aux_id_partida,
                           aux_num_round: aux_num_round,
                           aux_num_rodada: aux_num_rodada,
                           aux_indice_valor: aux_indice_valor
                       };


                        
                        var params = {
                            eu: req.user,
                            valor_total: valor_total,
                            adversarios: adversarios,
                            rodada: partida.rodadas[aux],
                            id_rodada: partida.rodadas[aux]._id,
                            id_partida: partida._id,
                            id_round: partida.rodadas[aux].rounds[num_round]._id,
                            id_jogador: id_jogador,
                            num_rodada: partida.rodadas[aux].numero_rodada,
                            num_round: partida.rodadas[aux].rounds[num_round].numero,
                            indice_valor: indice_valor,
                            painel: painel_round,
                            status_partida: partida.status
                        }; 
                        
                        res.render('menu-jogador/painel_jogador', {params: params});
                      }
                   });
                    
                  });

          } else {
            return req.next(err);
          }
      });

    }

  }

    } else {
      return res.redirect('/');
    }
});


router.post('/iniciar_novaRodada', mudar_rodada_painel, function(req, res) {
  if(req.isAuthenticated()) {

   var query = req.body.data.id_partida;
   var id_rodada = req.body.data.id_rodada;//id da nova rodada
   var indice_valor = ++req.body.data.indice_valor;
   var id_painel_ = req.body.data.id_painel;
   
   Partida.findById(query).exec(function(err, partida) {
      if(partida) {
        
        var adversarios = [];
        var id_partida = partida._id;
        var id_jogador = 0;
        
        for(var i = 0; i < partida.rodadas.length; i++) {
          if(partida.rodadas[i]._id == id_rodada) {
            var nova_rodada = partida.rodadas[i];
            var p_id_rodada = id_rodada;
          }
        } 


      
       Jogador.find().where('id_partida').equals(id_partida)
                                                    .exec(function(err, jogadores) {
                  console.log('7');
                  var eu = req.user._id;
                  var valor_total = 0;
                  var aux_p_adversarios = [];

                   for(var i = 0; i < jogadores.length; i++) {
                     
                     if(jogadores[i].usuario._id != eu) {
     
                       var jogador = jogadores[i];
                       var soma_valores = 0;
                       var soma_ofertas_recebidas = 0;
                           
                           aux_p_adversarios.push(jogadores[i]);

                       for(var j = 0; j < jogador.ofertas_recebidas.length; j++) {
                          //soma total das ofertas recebidas
                          soma_ofertas_recebidas += 
                                  Number(jogador.ofertas_recebidas[j].ofertaRecebida);

                          //soma das ofertas que foram aceitas 
                          if(jogador.ofertas_recebidas[j].aceitei == 'sim') {
                           soma_valores += Number(jogador.ofertas_recebidas[j].ofertaRecebida);
                          } 

                       }

                       var subtotal_valores_ofertados = 0;
                       var subtotal_ofertas_aceitas = 0;
                       var aux_a = 0;
                       var aux_b = 0;
                       var subtotal = 0;
                       for(var k = 0; k < jogador.ofertas_realizadas.length; k++) {
                         aux_a = Number(jogador.ofertas_realizadas[k].vrTotal);
                         aux_b = Number(jogador.ofertas_realizadas[k].ofertaEnviada);
                         subtotal = aux_a - aux_b;

                         subtotal_valores_ofertados += Number(subtotal);

                         if(jogador.ofertas_realizadas[k].aceitou == 'sim') {
                            subtotal_ofertas_aceitas += Number(subtotal);
                         }
                       }

                       var ganho_possivel =  subtotal_valores_ofertados + 
                                             soma_ofertas_recebidas;

                       var ganho_obtido = soma_valores + subtotal_ofertas_aceitas;
                       
                       var percentual_ganho = Number((ganho_obtido*100)/ganho_possivel);

                       jogadores[i].percentual_ganho = percentual_ganho;
                       
                       adversarios.push(jogadores[i]);
                       
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      id_jogador = jogadores[i]._id;
                     }
                   }

                   
                   //console.log('uuhuhu '+id_jogador);
                   //pegar o painel pelo id do painel
                   Estado_Painel.findById(id_painel_).exec(function(err, painel) { 
                    
                    if(err) {
                      req.next(err);
                    } else {
                          // console.log('uuhuhu 2222222222222 ' + p_id_rodada);
                         
                        var aux_rodada = painel.rodadas.length-1;

                        var id_painel = painel._id;
                        var id_rodada_ = p_id_rodada;
                        var p_round = painel.rodadas[aux_rodada].rounds[0];
                        
                        console.log(p_round);
                        var aux_id_partida = painel.aux_id_partida;
                        var aux_num_round = painel.aux_num_round;
                        var aux_num_rodada = painel.aux_num_rodada;
                        var aux_indice_valor = painel.aux_indice_valor;
                        
                        
                        var painel_round = {
                            id_painel: id_painel,
                            id_rodada: id_rodada_,
                            p_round: p_round,
                            aux_id_partida: aux_id_partida,
                            aux_num_round: aux_num_round,
                            aux_num_rodada: aux_num_rodada,
                            aux_indice_valor: aux_indice_valor
                        };

                        
                        var params = {
                           eu: req.user,           
                           valor_total: valor_total,
                           adversarios: adversarios,
                           rodada: nova_rodada,
                           id_rodada: nova_rodada._id,
                           id_partida: partida._id,
                           id_round: nova_rodada.rounds[0]._id,
                           id_jogador: id_jogador,
                           num_rodada: nova_rodada.numero_rodada,
                           num_round: nova_rodada.rounds[0].numero,
                           indice_valor: indice_valor,
                           painel: painel_round,
                           status_partida: partida.status
                        };  
                        
                        //console.log(params.painel);
                        ///criar nova p_rodada aqui
                        //console.log('uipa4');
                        res.render('menu-jogador/painel_jogador', {params: params});
                                             
                    } 
                    
                   });
                  
                  });

      } else {
        req.next(err);
      }
   });  

  } else {
    res.redirect('/');
  }
});


/*router.get('/iniciar_partida', function(req, res) {
    if(req.isAuthenticated()) {
    
    Jogador.find(function(err, jogadores) {
        if(err) {

        } else {

          if (jogadores[0].usuario.login == req.user.usuario.login) {
             var adversarios = [];
             var eu = {};
             for(var i = 1; i < jogadores.length; i++) {
               adversarios.push(jogadores[i]);
             }
             
             jogadores[0].valor_total = sortearValorTotal();
             eu = jogadores[0];             
             var params = {
                 adversarios: adversarios,
                 eu: eu
             };

             res.render('menu-jogador/painel_jogador', {params: params});
          } else { 

            var adversarios = [];
            var eu = {};
            //adversarios.push(jogadores[0]);
            for(var i = 0; i < jogadores.length; i++) {
                if(!(jogadores[i].usuario.login == req.user.usuario.login)) {
                   adversarios.push(jogadores[i]);
                } else {
                  jogadores[i].valor_total = sortearValorTotal();
                  eu = jogadores[i];
                }
            }
                
                var params = {
                    adversarios: adversarios,
                    eu: eu
                };

                res.render('menu-jogador/painel_jogador', {params: params});
            }
        }
    });

    } else {
    	res.redirect('/');
    }
});
*/


module.exports = router;