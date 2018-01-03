var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');
var c_jogador = require('./../controllers/jogador');
var c_partida = require('./../controllers/partida');
var c_rodada = require('./../controllers/rodada');
var c_round = require('./../controllers/round');
var sortearValores = require('./../functions/sortearValores');
var verificarQtdeJogadoresSala = require('./../middlewares/verificaCamposCriarSala');
var retornar_ao_jogo = require('./../middlewares/retornar_ao_jogo');
var Persuasoes_Padrao_Resultados = require('./../models/Persuasoes_Padrao_Resultados');


router.get('/menu_partida', retornar_ao_jogo, function(req, res) {

     if(req.isAuthenticated()) {
       
       var nome_jogador = req.user.nome;
       var curso = req.user.curso;
       var modulo = req.user.modulo;
       var nivel = req.user.nivel;
       var id_usuario = req.user._id;
       
      Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
       if(partidas) {
         var flag_aux = false;
         for(var i = 0; i < partidas.length; i++) {
            var jogadores = partidas[i].jogadores;
            for(var j = 0; j < jogadores.length; j++) {
                if(jogadores[j].usuario._id == id_usuario) {
                    flag_aux = true;                 
                }
            }
         }

         if(flag_aux == true) {
           res.render('menu-partida/index', { nome_jogador: nome_jogador,
                                             curso: curso,
                                             modulo: modulo,
                                              mensagem: '',
                                              partidas: partidas,
                                              nivel_usuario: nivel,
                                              id_usuario: id_usuario,
                                              flag_bt_entrar: true }); 

         } else {
             res.render('menu-partida/index', { nome_jogador: nome_jogador,
                                               curso: curso,
                                               modulo: modulo,
                                                mensagem: '',
                                                partidas: partidas,
                                                nivel_usuario: nivel,
                                                id_usuario: id_usuario,
                                                flag_bt_entrar: false });    
           }
                
        
       } else {
        res.render('menu-partida/index', { nome_jogador: nome_jogador,
        	                                 curso: curso,
        	                                 modulo: modulo,
                                           mensagem: '',
                                           partidas: null,
                                           nivel_usuario: nivel,
                                           id_usuario: id_usuario,
                                           flag_bt_entrar: false }); 
       }
      });

     } else {
     	res.redirect('/');
     }
});

router.post('/criar_partida', function(req, res) {
       
       if (req.isAuthenticated()) {
       	  //recebendo do formlario os dados do tipo de sala a se criar
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
                        flag = true;
                     }
                  }

                }
                
               }


               if(flag == false) {
                 
                    var tipo_sala = {
                        id_sala: null,
                        curso: req.body.partida.curso,
                        modulo: req.body.partida.modulo,
                        capacidadeSala: Number(req.body.partida.capacidade)
                    };

                    //recebendo da sessao o obj com os dados do usuario/jogador
                    //criador da sala
                    var dono_da_sala = req.user;
                    
                    var num_rodadas = Number(req.body.partida.num_rodadas);

                    //instanciando uma nova partida(obj classe js) passando por param o tipo de sala
                    var nova_partida = new c_partida(tipo_sala, dono_da_sala._id, num_rodadas);
                    nova_partida.num_jogadores = 1;
                    //instanciando a primeira rodada (obj classe js) que contem 6 rounds
                    var rodada1 = new c_rodada(Number(1));
                    //criando vetor que armazenara os jogadores da sala/partida
                    
                         
                    //definindo os valores para ofertar dos 6 rounds da primeira rodada para
                    //o primeiro jogador (criador d sala)
                    
                    
                    
                      var novoJogador = new c_jogador(dono_da_sala, null);
                      //console.log(novoJogador); 
                      var jogador = new Jogador({
                              flag_rodada_round1: novoJogador.flag_rodada_round1,
                              flag_bt_entrar: novoJogador.flag_bt_entrar,
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
                                //console.log(jogador.valores_sorteados);
                                //nova_partida.jogadores.push(jogador);
                                //return req.next(); 
                               
                               var id_jogador = jogador._id;

                               var qtde_total_jogadas = tipo_sala.capacidadeSala;
                               
                               var round1 = new c_round(1, qtde_total_jogadas);
                               var round2 = new c_round(2, qtde_total_jogadas);
                               var round3 = new c_round(3, qtde_total_jogadas);
                               var round4 = new c_round(4, qtde_total_jogadas);
                               var round5 = new c_round(5, qtde_total_jogadas);
                               var round6 = new c_round(6, qtde_total_jogadas);
                                              
                               rodada1.rounds.push(round1);
                               rodada1.rounds.push(round2);
                               rodada1.rounds.push(round3);
                               rodada1.rounds.push(round4);
                               rodada1.rounds.push(round5);
                               rodada1.rounds.push(round6);    
                    
                    //inserindo no vetor da partida a primeira rodada(de um total de seis)
                    //e seus respectivos seis rounds 
                      
                    nova_partida.rodadas.push(rodada1);

                    nova_partida.jogadores.push(jogador);
                    //criando o obj/motrdelo partida para inserir no bd
                    

                    var partida = new Partida({
                        id_dono: nova_partida.id_dono, 
                        data: nova_partida.data,
                        status: nova_partida.status,
                        num_rodadas: num_rodadas,
                        tipo_sala: nova_partida.tipo_sala,
                        num_jogadores: nova_partida.num_jogadores,
                        jogadores: nova_partida.jogadores,
                        rodadas: nova_partida.rodadas,
                        persuasoes_padrao: nova_partida.persuasoes_padrao,
                        contador_iniciar_partida: nova_partida.contador_iniciar_partida,
                        iniciada: nova_partida.iniciada,
                        num_rodada_atual: nova_partida.num_rodada_atual,
                        num_round_atual: nova_partida.num_round_atual,
                        indice_valor: nova_partida.indice_valor,
                        versao: nova_partida.versao,
                        contador_aceite: nova_partida.contador_aceite,
                        contador_prox_round: nova_partida.contador_prox_round,
                        reciprocidade_pergunta1: nova_partida.reciprocidade_pergunta1,
                        coerencia_pergunta1: nova_partida.coerencia_pergunta1,
                        coerencia_pergunta2: nova_partida.coerencia_pergunta2,
                        ap_social_pergunta: nova_partida.ap_social_pergunta,
                        afinidade_pergunta1: nova_partida.afinidade_pergunta1,
                        afinidade_pergunta2: nova_partida.afinidade_pergunta2,
                        afinidade_pergunta3: nova_partida.afinidade_pergunta3
                    });

                    var id_partida = null;
 
                       //inserindo no bd uma nova partida
                         Partida.create(partida, function(err, partida) {
                          if(err) {
                            return req.next(err);
                          } else {  
                              
                              jogador.id_partida = partida._id;
                              id_partida = partida._id;

                              jogador.save();
                              
                              partida.save();


                              var reciprocidade_resultado = [];
                              var coerencia_resultado = [];
                              var aprovacao_social_resultado = [];
                              var afinidade_resultado = [];
                              var autoridade_resultado = [];
                              var escassez_resultado = [];  


                               var ppr = new Persuasoes_Padrao_Resultados({
                                   id_partida: id_partida,
                                   reciprocidade_resultado: reciprocidade_resultado,
                                   coerencia_resultado: coerencia_resultado,
                                   aprovacao_social_resultado: aprovacao_social_resultado,
                                   afinidade_resultado: afinidade_resultado,
                                   autoridade_resultado: autoridade_resultado,
                                   escassez_resultado: escassez_resultado                                                                                                                                        
                               }); 
                               
                               Persuasoes_Padrao_Resultados.create(ppr, function(err, ppr) {
                                   if(err) {
                                     console.log(err);
                                   } else {
                                      partida.id_resultados = ppr._id;
                                      partida.save();
                                      
                                      res.redirect('/menu_partida'); 
                                   }
                               });

                          }        
                       });

                      }        
                    });

               } else {
               	res.redirect('/menu_partida');
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
