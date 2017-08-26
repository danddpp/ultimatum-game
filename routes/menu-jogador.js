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



router.post('/entrar_sala', function(req, res) {
     if (req.isAuthenticated()) {
        var idJogador = req.user._id;
        var query = 'Em andamento';
        var flag = false;
        
        var time1 = Math.floor((Math.random() * 5000) + 1);
        var time2 = Math.floor((Math.random() * 1000) + 1);
        var time3 = Math.floor((Math.random() * 100) + 1);
         
         
         
         var time = ((time1 - time2) + time3);


        setTimeout(function() {
          
          Partida.find(query).exec(function(err, partidas) {
              if(partidas) {

                 for(var i = 0; i < partidas.length; i++) {
                   
                  if(partidas[i].status == 'Em andamento') {
                  
                   var jogadores = [];
                   jogadores = partidas[i].jogadores;   
                  
                    for(var j = 0; j < jogadores.length; j++) {
                       if(jogadores[j].usuario._id == idJogador) {      
                          flag = true;
                       }
                    }

                  }

                 }

                  if(flag == false) {
                     var id_partida = req.body.params.idPartida;
                     var cursoPartida = req.body.params.tipoCurso;
                     var moduloPartida= req.body.params.modulo;
                     
                     Partida.findById(id_partida).exec(function(err, partida) {
                       if(partida) {
                         
                         var cursoJogador = req.user.curso; 
                         var moduloJogador = req.user.modulo;
                         
                           if(cursoPartida == "Livre") {
                             partida.num_jogadores++;             
                             
                             var id_sala = partida.tipo_sala.id_sala;

                             var novoJogador = new c_jogador(req.user, partida._id);

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
                              
                             if(cursoJogador == cursoPartida && moduloJogador == moduloPartida) {
                               partida.num_jogadores++;
                             
                             var id_sala = partida.tipo_sala.id_sala; 

                             var novoJogador = new c_jogador(req.user, partida._id);

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
                                var nome_jogador = req.user.nome;
                                var curso = req.user.curso;
                                var modulo = req.user.modulo;
                                var nivel = req.user.nivel;
                                var id_usuario = req.user._id;
                                
                               Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
                                if(partidas) {

                                 res.render('menu-partida/index', { nome_jogador: nome_jogador,
                                                                    curso: curso,
                                                                    modulo: modulo,
                                                                    mensagem: 'curso e/ou modulo do jogador não é'+ 
                                                                    'o mesmo que o da partida!',
                                                                    partidas: partidas,
                                                                    nivel_usuario: nivel,
                                                                    id_usuario: id_usuario });
                                 }
                               });
                             }
                           }
                               
                       } else {
                         return req.next(err);
                       }
                     });    
                  } else {
                     var nome_jogador = req.user.nome;
                     var curso = req.user.curso;
                     var modulo = req.user.modulo;
                     var nivel = req.user.nivel;
                     var id_usuario = req.user._id;
                     
                    Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
                     if(partidas) {

                      res.render('menu-partida/index', { nome_jogador: nome_jogador,
                                                         curso: curso,
                                                         modulo: modulo,
                                                         mensagem: 'Já estou participando de outra partida!',
                                                         partidas: partidas,
                                                         nivel_usuario: nivel,
                                                         id_usuario: id_usuario });
                      }
                    });
                   }
                 
              } else {
                  return req.next(err);
              }
          });
        }, time);
        
     } else {
        return res.redirect('/');
     }
});





//rota acessada apenas no primeiro round da primeira rodada
router.post('/iniciar_partida', function(req, res) {
    if(req.isAuthenticated()) {
    
      var query = req.body.idPartida_ok;
      var minha_pontuacao = 0;
      var meu_percentual_ganho = 0;
      
      
      var time1 = Math.floor((Math.random() * 5000) + 1);
      var time2 = Math.floor((Math.random() * 1000) + 1);
      var time3 = Math.floor((Math.random() * 100) + 1);
       
       
       
      var time = ((time1 - time2) + time3);


      setTimeout(function() {
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
      }, time); 


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
                       jogadores[i].percentual_ganho = percentual_ganho;
                       adversarios.push(jogadores[i]);

                       
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      minha_pontuacao = jogadores[i].pontuacao_max;
                      meu_percentual_ganho = jogadores[i].percentual_ganho;
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
                       jogadores[i].percentual_ganho = percentual_ganho;
                       adversarios.push(jogadores[i]);
                       
                     } else {
                      valor_total = jogadores[i].valores_sorteados[indice_valor];
                      minha_pontuacao = jogadores[i].pontuacao_max;
                      meu_percentual_ganho = jogadores[i].percentual_ganho;
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


module.exports = router;