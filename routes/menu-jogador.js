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
var Estado_Painel = require('./../models/Estado_painel');
var mudar_rodada_painel = require('./../middlewares/mudar_rodada_painel');

router.get('/menu-jogador', function(req, res) {
    if(req.isAuthenticated()) {
        var nome_jogador = req.user.nome;
        var nivel = req.user.nivel;

        res.render('menu-jogador/index', {nome_jogador: nome_jogador,
                                          nivel_usuario: nivel,
        	                                mensagem: 'Bem vindo '+ nome_jogador +'!'});
    } else {
    	res.redirect('/');
    }
});


router.get('/jogo_do_ultimato', function(req, res) {
   if(req.isAuthenticated()) {
      var nome_jogador = req.user.nome;
      var nivel = req.user.nivel;

      res.render('menu-jogador/descricao_jogo_do_ultimato', { nome_jogador: nome_jogador,
                                         nivel_usuario: nivel });
   } else {
    res.redirect('/');
   }
});




//rota acessada apenas no primeiro round da primeira rodada
router.post('/iniciar_partida', function(req, res) {
    if(req.isAuthenticated()) {
      
      var query = req.body.idPartida_ok;
      var minha_pontuacao = 0;
      var meu_percentual_ganho = 0;
      
      
        Partida.findById(query).exec(function(err, partida) {
           if(partida) {
           
            if(partida.num_rodada_atual == 1 && partida.num_round_atual == 1) {
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
                     minha_pontuacao = jogadores[i].pontuacao_max;
                     meu_percentual_ganho = jogadores[i].percentual_ganho;
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
                             
                             var persuasao_padrao = null;
                            
                             if(partida.persuasoes_padrao != null) {
                               for (var i = 0; i < partida.persuasoes_padrao.length; i++) {
                                 if(partida.persuasoes_padrao[i].opcao == true &&
                                    partida.persuasoes_padrao[i].rodada == 1 && 
                                    partida.persuasoes_padrao[i].round == 1) {
                            
                                    if(partida.persuasoes_padrao[i].tipo == 'Reciprocidade') {
                                       persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg2;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].jogador;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;   
                                    }

                                    if(partida.persuasoes_padrao[i].tipo == 'Coerência') {

                                      if(partida.persuasoes_padrao[i].quiz_respondido == false) {
                                      
                                       persuasao_padrao = persuasoes_padrao[i].tipo;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].quiz_respondido;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg_quiz1;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg_quiz2;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].opcao_coerencia;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                       persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;   
                                      
                                      }  

                                    }

                                    if(partida.persuasoes_padrao[i].tipo == 'Aprovação social') {
                                        persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;
                                    }

                                    if(partida.persuasoes_padrao[i].tipo == 'Afinidade') {
                                        persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].nome_afinidade;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].nome_controle1;
                                        persuasao_padrao += ';'+partida.persuasoes_padrao[i].nome_controle2;
                                    }

                                 }
                               }
                             }
                               


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
                                  status_partida: partida.status,
                                  persuasao_padrao: persuasao_padrao,
                                  minha_pontuacao: minha_pontuacao,
                                  meu_percentual_ganho: meu_percentual_ganho
                              };
                             

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

                        var persuasao_padrao = null;
                            
                            if(partida.persuasoes_padrao != null) {
                              if(partida.persuasoes_padrao[0].rodada == 1 && 
                                 partida.persuasoes_padrao[0].round == 1 &&
                                 partida.persuasoes_padrao[0].opcao == true) {
                                 if(partida.persuasoes_padrao[0].tipo == 'Reciprocidade') {
                                   persuasao_padrao = partida.persuasoes_padrao[0].tipo;
                                   persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg;
                                   persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg2;
                                   persuasao_padrao += ';'+partida.persuasoes_padrao[0].jogador;
                                   persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_usuario;
                                   persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_destinatario;   
                                  } 

                                 if(partida.persuasoes_padrao[0].tipo == 'Coerência') {
                                     
                                     if(partida.persuasoes_padrao[0].quiz_respondido == false) {
                                      
                                      persuasao_padrao = partida.persuasoes_padrao[0].tipo;
                                      persuasao_padrao += partida.persuasoes_padrao[0].quiz_respondido;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg_quiz1;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg_quiz2;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[0].opcao_coerencia;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_usuario;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_destinatario;   
                                      
                                    }

                                 }

                                 if(partida.persuasoes_padrao[0].tipo == 'Aprovação social') {
                                     persuasao_padrao = partida.persuasoes_padrao[0].tipo;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_usuario;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_destinatario; 
                                 }

                                 if(partida.persuasoes_padrao[0].tipo == 'Afinidade') {
                                     persuasao_padrao = partida.persuasoes_padrao[0].tipo;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_usuario;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_destinatario;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].nome_afinidade;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].nome_controle1;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[0].nome_controle2;
                                 }

                                 if(partida.persuasoes_padrao[0].tipo == 'Autoridade') {
                                     persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                                 }

                                 if(partida.persuasoes_padrao[0].tipo == 'Escassez') {
                                     persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                                 } 
                              }
                            }  
                               
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
                             status_partida: partida.status,
                             persuasao_padrao: persuasao_padrao,
                             minha_pontuacao: minha_pontuacao,
                             meu_percentual_ganho: meu_percentual_ganho,
                             minha_pontuacao: minha_pontuacao,
                             meu_percentual_ganho: meu_percentual_ganho
                         };

                        res.render('menu-jogador/painel_jogador', {params: params}); 
                     });

                   }
                 }
               });
               

               } else {
                  console.log('não posso jogar essa partida. não estou nessa sala!!!');
               }
            
            } else {//se rodada e round naõ forem mais 1
              
               Partida.findById(query).exec(function(err, partida) {
                if (partida) {

                  var indice_round = partida.num_round_atual-1;
                  var indice_rodada = partida.num_rodada_atual-1;
                  var num_round = partida.num_round_atual;

                  var rodada = partida.rodadas[indice_rodada];
                  var round = rodada.rounds[indice_round];
                  var id_partida = partida._id;
                  var adversarios = [];
                  var id_jogador = 0;
                  var indice_valor = partida.indice_valor;

                  Jogador.find().where('id_partida').equals(id_partida)
                                                    .exec(function(err, jogadores) {
                  var eu = req.user._id;
                  
                   for(var i = 0; i < jogadores.length; i++) {
                     
                     if(jogadores[i].usuario._id != eu) {
                       adversarios.push(jogadores[i]);
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      minha_pontuacao = jogadores[i].pontuacao_max;
                      meu_percentual_ganho = jogadores[i].percentual_ganho;
                      id_jogador = jogadores[i]._id;
                     }
                   }


                   Estado_Painel.find().where('id_jogador').equals(id_jogador)
                                                        .exec(function(err, painel) {
                      if(err) {
                        req.next(err);
                      } else {
        
                       var id_painel = painel[0]._id;
                       var id_rodada = painel[0].rodadas[indice_rodada].id_rodada;
                       var p_round = painel[0].rodadas[indice_rodada].rounds[indice_round];
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
                        
                       var persuasao_padrao = null;
                       var n_rodada = partida.rodadas[indice_rodada].numero_rodada;
                       var n_round =  partida.rodadas[indice_rodada].rounds[indice_round].numero;
                       
                       if(partida.persuasoes_padrao != null) {
                         var persuasoes_padrao = [];
                         persuasoes_padrao = partida.persuasoes_padrao;
                         
                         for(var k = 0; k < persuasoes_padrao.length; k++ ) {
                             if(persuasoes_padrao[k].opcao != false) {
                               if(persuasoes_padrao[k].rodada == n_rodada &&
                                  persuasoes_padrao[k].round == n_round) {
                                  if(persuasoes_padrao[k].tipo == 'Reciprocidade') {
                                    persuasao_padrao = persuasoes_padrao[k].tipo;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].msg2;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].jogador;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;
                                   } 

                                   if(persuasoes_padrao[k].tipo == 'Coerência') {
                                     
                                     if(persuasoes_padrao[k].quiz_respondido == false) {
                                      
                                      persuasao_padrao = persuasoes_padrao[k].tipo;
                                      persuasao_padrao += persuasoes_padrao[k].quiz_respondido;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].msg_quiz1;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].msg_quiz2;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].opcao_coerencia;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;   
                                      
                                    }

                                 }

                                 if(persuasoes_padrao[k].tipo == 'Aprovação social') {
                                     persuasao_padrao = persuasoes_padrao[k].tipo;
                                     persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                     persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                     persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario; 
                                 }

                                   if(persuasoes_padrao[k].tipo == 'Afinidade') {
                                       persuasao_padrao = persuasoes_padrao[k].tipo;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].nome_afinidade;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].nome_controle1;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].nome_controle2;
                                   }

                                   if(persuasoes_padrao[k].tipo == 'Autoridade') {
                                       persuasao_padrao = persuasoes_padrao[k].msg; 
                                   }

                                   if(persuasoes_padrao[k].tipo == 'Escassez') {
                                       persuasao_padrao = persuasoes_padrao[k].msg; 
                                   }   
                               }
                             }
                         }
                       }       


                        var params = {
                            eu: req.user,
                            valor_total: valor_total,
                            adversarios: adversarios,
                            rodada: partida.rodadas[indice_rodada],
                            id_rodada: partida.rodadas[indice_rodada]._id,
                            id_partida: partida._id,
                            id_round: partida.rodadas[indice_rodada].rounds[indice_round]._id,
                            id_jogador: id_jogador,
                            num_rodada: n_rodada,
                            num_round: n_round,
                            indice_valor: indice_valor,
                            painel: painel_round,
                            status_partida: partida.status,
                            persuasao_padrao: persuasao_padrao,
                            minha_pontuacao: minha_pontuacao,
                            meu_percentual_ganho: meu_percentual_ganho
                        }; 
                        
                        res.render('menu-jogador/painel_jogador', {params: params});
                      }
                   });
                    
                  });                 
                } else {

                }
              });
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
      var minha_pontuacao = 0;
      var meu_percentual_ganho = 0;
      
            
      if(num_round < 7) {
                      
        if(num_rodada < 7) {
           
          Partida.findById(query).exec(function(err, partida) {
          if(partida) {

                  partida.contador_prox_round = 0; 
                  partida.save(); 

                  var aux = partida.rodadas.length-1;
                  
                  var rodada = partida.rodadas[aux];
                  var novo_round = rodada.rounds[num_round];
                  var id_partida = partida._id;
                  var adversarios = [];
                  var id_jogador = 0;
                  var indice_round = partida.num_round_atual-1;
                  var indice_rodada = partida.num_rodada_atual-1;

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

                       var ganho_possivel =  subtotal_valores_ofertados + soma_ofertas_recebidas;
                       var ganho_obtido = soma_valores + subtotal_ofertas_aceitas;
                       var percentual_ganho = Number((ganho_obtido*100)/ganho_possivel);
                       jogadores[i].percentual_ganho = percentual_ganho.toFixed(2);
                       adversarios.push(jogadores[i]);

                       
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      minha_pontuacao = jogadores[i].pontuacao_max;
                      meu_percentual_ganho = jogadores[i].percentual_ganho.toFixed(2);
                      id_jogador = jogadores[i]._id;
                     }
                   }
                   
                   Estado_Painel.findById(id_painel_).exec(function(err, painel) {
                      if(err) {
                        req.next(err);
                      } else {
                        
                       var id_painel = painel._id;
                       var id_rodada = painel.rodadas[indice_rodada].id_rodada;
                       var p_round = painel.rodadas[indice_rodada].rounds[indice_round];
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
                        
                       var persuasao_padrao = null;
                       var n_rodada = partida.rodadas[indice_rodada].numero_rodada;
                       var n_round =  partida.rodadas[indice_rodada].rounds[indice_round].numero;
                       
                       if(partida.persuasoes_padrao != null) {
                         var persuasoes_padrao = [];
                         persuasoes_padrao = partida.persuasoes_padrao;
                         
                         for(var k = 0; k < persuasoes_padrao.length; k++ ) {
                             if(persuasoes_padrao[k].opcao != false) {
                              
                               if((persuasoes_padrao[k].rodada == n_rodada &&
                                   persuasoes_padrao[k].round == n_round) || 
                                   (persuasoes_padrao[k].rodada_2 == n_rodada &&
                                    persuasoes_padrao[k].round_2 == n_round)) {

                                  if(persuasoes_padrao[k].tipo == 'Reciprocidade') {
                                    persuasao_padrao = persuasoes_padrao[k].tipo;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].msg2;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].jogador;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                    persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;   
                                   } 

                                   if(persuasoes_padrao[k].tipo == 'Coerência') {
                                     //console.log(persuasoes_padrao[k].quiz_respondido);
                                     if(persuasoes_padrao[k].rodada == n_rodada &&
                                                  persuasoes_padrao[k].round == n_round) {

                                      persuasao_padrao = persuasoes_padrao[k].tipo;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].rodada;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].round;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].msg_quiz1;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;   
                                                                                                   
                                    } 

                                    else if(persuasoes_padrao[k].rodada_2 == n_rodada &&
                                                 persuasoes_padrao[k].round_2 == n_round) {
                                         
                                          persuasao_padrao = persuasoes_padrao[k].tipo;
                                          persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                          persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;
                                          persuasao_padrao += ';'+persuasoes_padrao[k].msg_quiz2;
                                          persuasao_padrao += ';'+persuasoes_padrao[k].rodada_2;
                                          persuasao_padrao += ';'+persuasoes_padrao[k].round_2;

                                    } 

                                   }

                                   if(persuasoes_padrao[k].tipo == 'Aprovação social') {
                                       persuasao_padrao = persuasoes_padrao[k].tipo;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario; 
                                   }

                                   if(persuasoes_padrao[k].tipo == 'Afinidade') {
                                       persuasao_padrao = persuasoes_padrao[k].tipo;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].nome_afinidade;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].nome_controle1;
                                       persuasao_padrao += ';'+persuasoes_padrao[k].nome_controle2;
                                   }

                                   if(persuasoes_padrao[k].tipo == 'Autoridade') {
                                       persuasao_padrao = persuasoes_padrao[k].msg; 
                                   }

                                   if(persuasoes_padrao[k].tipo == 'Escassez') {
                                       persuasao_padrao = persuasoes_padrao[k].msg; 
                                   }
                               }
                             }
                         }
                       }     

                        var params = {
                            eu: req.user,
                            valor_total: valor_total,
                            adversarios: adversarios,
                            rodada: partida.rodadas[indice_rodada],
                            id_rodada: partida.rodadas[indice_rodada]._id,
                            id_partida: partida._id,
                            id_round: partida.rodadas[indice_rodada].rounds[indice_round]._id,
                            id_jogador: id_jogador,
                            num_rodada: n_rodada,
                            num_round: n_round,
                            indice_valor: indice_valor,
                            painel: painel_round,
                            status_partida: partida.status,
                            persuasao_padrao: persuasao_padrao,
                            minha_pontuacao: minha_pontuacao,
                            meu_percentual_ganho: meu_percentual_ganho
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
   var minha_pontuacao = 0;
   var meu_percentual_ganho = 0;

   Partida.findById(query).exec(function(err, partida) {
      if(partida) {
        
        partida.contador_prox_round = 0;        
        partida.save();

        var adversarios = [];
        var id_partida = partida._id;
        var id_jogador = 0;
        var indice_round = partida.num_round_atual-1;
        var indice_rodada = partida.num_rodada_atual-1;

        for(var i = 0; i < partida.rodadas.length; i++) {
          if(partida.rodadas[i]._id == id_rodada) {
            var nova_rodada = partida.rodadas[i];
            var p_id_rodada = id_rodada;
          }
        } 


      
       Jogador.find().where('id_partida').equals(id_partida)
                                                    .exec(function(err, jogadores) {
                  
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
                          
                          soma_ofertas_recebidas += 
                                  Number(jogador.ofertas_recebidas[j].ofertaRecebida);

                           
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

                       var ganho_possivel =  subtotal_valores_ofertados + soma_ofertas_recebidas;
                       var ganho_obtido = soma_valores + subtotal_ofertas_aceitas;
                       var percentual_ganho = Number((ganho_obtido*100)/ganho_possivel);
                       jogadores[i].percentual_ganho = percentual_ganho.toFixed(2);
                       adversarios.push(jogadores[i]);
                       
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      minha_pontuacao = jogadores[i].pontuacao_max;
                      meu_percentual_ganho = jogadores[i].percentual_ganho.toFixed(2);
                      id_jogador = jogadores[i]._id;
                     }
                   }


                   Estado_Painel.findById(id_painel_).exec(function(err, painel) { 
                    
                    if(err) {
                      req.next(err);
                    } else {
                                                   
                        var aux_rodada = painel.rodadas.length-1;

                        var id_painel = painel._id;
                        var id_rodada_ = p_id_rodada;
                        var p_round = painel.rodadas[aux_rodada].rounds[0];
                        
                        
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
                        
                        var persuasao_padrao = null;
                        var n_rodada = nova_rodada.numero_rodada;
                        var n_round =  nova_rodada.rounds[0].numero;

                        if(partida.persuasoes_padrao != null) {
                           var persuasoes_padrao = [];
                           persuasoes_padrao = partida.persuasoes_padrao;
                           
                           for(var k = 0; k < persuasoes_padrao.length; k++ ) {
                               if(persuasoes_padrao[k].opcao != false) {
                                 if(persuasoes_padrao[k].rodada == n_rodada &&
                                    persuasoes_padrao[k].round == n_round) {
                                    if(persuasoes_padrao[k].tipo == 'Reciprocidade') {
                                      persuasao_padrao = persuasoes_padrao[k].tipo;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].msg2;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].jogador;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;   
                                     } 

                                     if(persuasoes_padrao[k].tipo == 'Coerência') {
                                      if(persuasoes_padrao[k].resposta == null) {
                                        persuasao_padrao = persuasoes_padrao[k].tipo;
                                        persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                        persuasao_padrao += ';'+persuasoes_padrao[k].jogador;
                                        persuasao_padrao += ';'+persuasoes_padrao[k].resposta;
                                        persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;   
                                      } 
                                     }

                                     if(persuasoes_padrao[k].tipo == 'Aprovação social') {
                                         persuasao_padrao = persuasoes_padrao[k].tipo;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario; 
                                     }

                                     if(persuasoes_padrao[k].tipo == 'Afinidade') {
                                         persuasao_padrao = persuasoes_padrao[k].tipo;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].nome_afinidade;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].nome_controle1;
                                         persuasao_padrao += ';'+persuasoes_padrao[k].nome_controle2;
                                     }

                                     if(persuasoes_padrao[k].tipo == 'Autoridade') {
                                         persuasao_padrao = persuasoes_padrao[k].msg; 
                                     }

                                     if(persuasoes_padrao[k].tipo == 'Escassez') {
                                         persuasao_padrao = persuasoes_padrao[k].msg; 
                                     } 
                                 }
                               }
                           }
                        }
                        
                        var params = {
                           eu: req.user,           
                           valor_total: valor_total,
                           adversarios: adversarios,
                           rodada: nova_rodada,
                           id_rodada: nova_rodada._id,
                           id_partida: partida._id,
                           id_round: nova_rodada.rounds[0]._id,
                           id_jogador: id_jogador,
                           num_rodada: n_rodada,
                           num_round: n_round,
                           indice_valor: indice_valor,
                           painel: painel_round,
                           status_partida: partida.status,
                           persuasao_padrao: persuasao_padrao,
                           minha_pontuacao: minha_pontuacao,
                           meu_percentual_ganho: meu_percentual_ganho
                        };  
                        
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



router.get('/retornar_ao_jogo', function(req, res) {
  if(req.isAuthenticated()) {
    
    var query = req.user.id_partida;

    var minha_pontuacao = 0;
    var meu_percentual_ganho = 0;
    
    
      Partida.findById(query).exec(function(err, partida) {
         if(partida) {
         
          if(partida.num_rodada_atual == 1 && partida.num_round_atual == 1) {
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
                   minha_pontuacao = jogadores[i].pontuacao_max;
                   meu_percentual_ganho = jogadores[i].percentual_ganho;
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
                           
                           var persuasao_padrao = null;
                          
                           if(partida.persuasoes_padrao != null) {
                             for (var i = 0; i < partida.persuasoes_padrao.length; i++) {
                               if(partida.persuasoes_padrao[i].opcao == true &&
                                  partida.persuasoes_padrao[i].rodada == 1 && 
                                  partida.persuasoes_padrao[i].round == 1) {
                          
                                  if(partida.persuasoes_padrao[i].tipo == 'Reciprocidade') {
                                     persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg2;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].jogador;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;   
                                  }

                                  if(partida.persuasoes_padrao[i].tipo == 'Coerência' && 
                                     partida.persuasoes_padrao[i].quiz_respondido == false) {
                                     persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg_quiz1;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg_quiz2;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].quiz_respondido;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;
                                  }

                                  if(partida.persuasoes_padrao[i].tipo == 'Aprovação social') {
                                     persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                     persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;
                                  }

                                  if(partida.persuasoes_padrao[i].tipo == 'Afinidade') {
                                      persuasao_padrao = partida.persuasoes_padrao[i].tipo;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[i].msg;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_usuario;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[i].id_destinatario;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[i].nome_afinidade;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[i].nome_controle1;
                                      persuasao_padrao += ';'+partida.persuasoes_padrao[i].nome_controle2;
                                  }

                                  if(partida.persuasoes_padrao[i].tipo == 'Autoridade') {
 
                                  }

                                  if(partida.persuasoes_padrao[k].tipo == 'Escassez') {
 
                                  }
                               }
                             }
                           }
                             

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
                                status_partida: partida.status,
                                persuasao_padrao: persuasao_padrao,
                                minha_pontuacao: minha_pontuacao,
                                meu_percentual_ganho: meu_percentual_ganho
                            };
                           

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

                      var persuasao_padrao = null;
                          
                          if(partida.persuasoes_padrao != null) {
                            if(partida.persuasoes_padrao[0].rodada == 1 && 
                               partida.persuasoes_padrao[0].round == 1 &&
                               partida.persuasoes_padrao[0].opcao == true) {
                               if(partida.persuasoes_padrao[0].tipo == 'Reciprocidade') {
                                 persuasao_padrao = partida.persuasoes_padrao[0].tipo;
                                 persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg;
                                 persuasao_padrao += ';'+partida.persuasoes_padrao[0].msg2;
                                 persuasao_padrao += ';'+partida.persuasoes_padrao[0].jogador;
                                 persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_usuario;
                                 persuasao_padrao += ';'+partida.persuasoes_padrao[0].id_destinatario;   
                                } 

                               if(partida.persuasoes_padrao[0].tipo == 'Coerência') {
                                   persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                               }

                               if(partida.persuasoes_padrao[0].tipo == 'Aprovação social') {
                                   persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                               }

                               if(partida.persuasoes_padrao[0].tipo == 'Afinidade') {
                                   persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                               }

                               if(partida.persuasoes_padrao[0].tipo == 'Autoridade') {
                                   persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                               }

                               if(partida.persuasoes_padrao[0].tipo == 'Escassez') {
                                   persuasao_padrao = partida.persuasoes_padrao[0].msg; 
                               } 
                            }
                          }  
                             
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
                           status_partida: partida.status,
                           persuasao_padrao: persuasao_padrao,
                           minha_pontuacao: minha_pontuacao,
                           meu_percentual_ganho: meu_percentual_ganho,
                           minha_pontuacao: minha_pontuacao,
                           meu_percentual_ganho: meu_percentual_ganho
                       };

                      res.render('menu-jogador/painel_jogador', {params: params}); 
                   });

                 }
               }
             });
             

             } else {
                console.log('não posso jogar essa partida. não estou nessa sala!!!');
             }
          
          } else {//se rodada e round naõ forem mais 1
            
             Partida.findById(query).exec(function(err, partida) {
              if (partida) {

                var indice_round = partida.num_round_atual-1;
                var indice_rodada = partida.num_rodada_atual-1;
                var num_round = partida.num_round_atual;

                var rodada = partida.rodadas[indice_rodada];
                var round = rodada.rounds[indice_round];
                var id_partida = partida._id;
                var adversarios = [];
                var id_jogador = 0;
                var indice_valor = partida.indice_valor;

                Jogador.find().where('id_partida').equals(id_partida)
                                                  .exec(function(err, jogadores) {
                var eu = req.user._id;
                
                 for(var i = 0; i < jogadores.length; i++) {
                   
                   if(jogadores[i].usuario._id != eu) {
                     adversarios.push(jogadores[i]);
                   } else {
                    valor_total = jogadores[i].valores_sorteados[indice_valor];
                    minha_pontuacao = jogadores[i].pontuacao_max;
                    meu_percentual_ganho = jogadores[i].percentual_ganho;
                    id_jogador = jogadores[i]._id;
                   }
                 }


                 Estado_Painel.find().where('id_jogador').equals(id_jogador)
                                                      .exec(function(err, painel) {
                    if(err) {
                      req.next(err);
                    } else {
      
                     var id_painel = painel[0]._id;
                     var id_rodada = painel[0].rodadas[indice_rodada].id_rodada;
                     var p_round = painel[0].rodadas[indice_rodada].rounds[indice_round];
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
                      
                     var persuasao_padrao = null;
                     var n_rodada = partida.rodadas[indice_rodada].numero_rodada;
                     var n_round =  partida.rodadas[indice_rodada].rounds[indice_round].numero;
                     
                     if(partida.persuasoes_padrao != null) {
                       var persuasoes_padrao = [];
                       persuasoes_padrao = partida.persuasoes_padrao;
                       
                       for(var k = 0; k < persuasoes_padrao.length; k++ ) {
                           if(persuasoes_padrao[k].opcao != false) {
                             if(persuasoes_padrao[k].rodada == n_rodada &&
                                persuasoes_padrao[k].round == n_round) {
                                if(persuasoes_padrao[k].tipo == 'Reciprocidade') {
                                  persuasao_padrao = persuasoes_padrao[k].tipo;
                                  persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                  persuasao_padrao += ';'+persuasoes_padrao[k].msg2;
                                  persuasao_padrao += ';'+persuasoes_padrao[k].jogador;
                                  persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;
                                  persuasao_padrao += ';'+persuasoes_padrao[k].id_destinatario;
                                 } 

                                 if(persuasoes_padrao[k].tipo == 'Coerência') {
                                    if(persuasoes_padrao[k].resposta == null) {
                                      persuasao_padrao = persuasoes_padrao[k].tipo;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].msg;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].jogador;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].resposta;
                                      persuasao_padrao += ';'+persuasoes_padrao[k].id_usuario;   
                                    }  
                                 }

                                 if(persuasoes_padrao[k].tipo == 'Aprovação social') {
                                     persuasao_padrao = persuasoes_padrao[k].msg; 
                                 }

                                 if(persuasoes_padrao[k].tipo == 'Afinidade') {
                                     persuasao_padrao = persuasoes_padrao[k].msg; 
                                 }

                                 if(persuasoes_padrao[k].tipo == 'Autoridade') {
                                     persuasao_padrao = persuasoes_padrao[k].msg; 
                                 }

                                 if(persuasoes_padrao[k].tipo == 'Escassez') {
                                     persuasao_padrao = persuasoes_padrao[k].msg; 
                                 }   
                             }
                           }
                       }
                     }       


                      var params = {
                          eu: req.user,
                          valor_total: valor_total,
                          adversarios: adversarios,
                          rodada: partida.rodadas[indice_rodada],
                          id_rodada: partida.rodadas[indice_rodada]._id,
                          id_partida: partida._id,
                          id_round: partida.rodadas[indice_rodada].rounds[indice_round]._id,
                          id_jogador: id_jogador,
                          num_rodada: n_rodada,
                          num_round: n_round,
                          indice_valor: indice_valor,
                          painel: painel_round,
                          status_partida: partida.status,
                          persuasao_padrao: persuasao_padrao,
                          minha_pontuacao: minha_pontuacao,
                          meu_percentual_ganho: meu_percentual_ganho
                      }; 
                      
                      res.render('menu-jogador/painel_jogador', {params: params});
                    }
                 });
                  
                });                 
              } else {

              }
            });
          }

         } else {
           return req.next(err);
         }
      });

  } else {
    res.redirect('/');
  }
});


module.exports = router;