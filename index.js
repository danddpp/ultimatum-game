const KEY = 'UltimatumGame.sid';
const SECRET = 'UltimatumGame';
var routesHome = require('./routes/home');
var routesLogin = require('./routes/autenticacao');
var routesMenuJogador = require('./routes/menu-jogador');
var routesMenuPartida = require('./routes/menu-partida');
var routesPesquisar = require('./routes/pesquisar');
var mongoose = require('mongoose');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var methodOverride = require('method-override');
var config = require('./config-connection');
var app = express();
var server = require('http').Server(app);
var cookie = cookieParser(SECRET);
var store = new expressSession.MemoryStore();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var io = require('socket.io')(server,{});



//conectando com banco de dados
mongoose.connect(config.mongoURI[app.settings.env], function(err, res) {
  if(err) {
    console.log('Error connecting to the database. ' + err);
  } else {
    console.log('Connected to Database: ' + config.mongoURI[app.settings.env]);
  }
});



//configurando middlewares
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookie);
app.use(expressSession({
  secret: SECRET,
  name: KEY,
  resave: true,
  saveUninitialized: true,
  store: store
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/public'));
app.use(passport.initialize());
app.use(passport.session());


//config rotas home
app.get('/', routesHome);
app.get('/criar_conta', routesHome);
app.post('/cadastrar_usuario', routesHome);

//config rotas autenticacao
app.post('/login', routesLogin);
app.get('/logout', routesLogin);


//config rotas menu-partida
app.get('/menu_partida', routesMenuPartida);
app.post('/criar_partida', routesMenuPartida);


//config rotas menu-jogador
app.get('/menu-jogador', routesMenuJogador);
app.post('/iniciar_partida', routesMenuJogador);
app.post('/entrar_sala', routesMenuJogador);
app.post('/iniciar_novoRound', routesMenuJogador);
app.post('/iniciar_novaRodada', routesMenuJogador);


//config rotas pesquisar
app.get('/pesquisar_filtros', routesPesquisar);
app.post('/pesquisar', routesPesquisar);
app.post('/visualizar_resultados_por_partida', routesPesquisar);


//configuração do passport
var Usuario = require('./models/Usuario');

passport.use(new LocalStrategy({
    usernameField: 'usuario[login]',
    passwordField: 'usuario[senha]'
},
//verificar se campos de login estão vindo vazios e implementar
//veerificação nas rotas para averiguar se existe usuario logado, a fim
//de evitar o acesso digitando a url direto no navegador
  function(username, password, done) 
  {
    Usuario.find(function(err, usuarios) {
           var pass = false;
           for(var i = 0; i < usuarios.length; i++) {
               if(usuarios[i].login == username && 
                  usuarios[i].senha == password) {
                  pass = true;
                  var usuario = usuarios[i];
               }
           }    
           if(pass) {
              return done( null, usuario);
           } else {
              return done(null, false, {message: 'Unable to login'});
           }       
      });
    }
  ));

  passport.serializeUser(function(usuario, done) {
    done(null, usuario);
  });

  passport.deserializeUser(function(usuario, done) {
    done(null, usuario);
  });



//socket.io
   //compartilhando uma sessao com o socketIo
  io.use(function(socket, next) {
     var data = socket.request;
     cookie(data, {}, function(err) {
        var sessionID = data.signedCookies[KEY];
        //console.log(data);
        store.get(sessionID, function(err, session) {
           if(err || !session) {
              return next(new Error('Acesso negado!'));
           } else {
            //console.log(session);
            socket.handshake.session = session;
            return next();
           }
        });
     });
  });



  var crypto = require('crypto');
  var Partida = require('./models/Partida');
  var Jogador = require('./models/Jogador');
  var Oferta = require('./controllers/oferta');
  var Ofertado = require('./controllers/ofertado');
  var Rodada = require('./controllers/rodada');
  var Round = require('./controllers/round');
  var finalizar_partida = require('./functions/finalizar_partida');
  var salvar_percentual_ganho = require('./functions/salvar_percentual_ganho');
  var c_round = require('./controllers/round');
  var p_jogador = require('./controllers/painel/p_jogador');
  var p_adversario = require('./controllers/painel/p_adversario');
  var p_round = require('./controllers/painel/p_round');
  var p_rodada = require('./controllers/painel/p_rodada');
  var Estado_Painel = require('./models/Estado_Painel');
  //config socket.io

  var onlines = {};//armazena jogadores online
  //var partida = null;


  io.sockets.on('connection', function(socket) {
     console.log('notify-onlines');
     //armazena a sessao do usuario compartilhada com o socket
     var session = socket.handshake.session;
     //armazena os dados do jogador (vindos da sessao/socket )que acabou de se conectar ao socket
     var usuario = session.passport.user;
     
     //vetor que armazena os jogadores conectados ao socket
     onlines[usuario._id] = usuario._id;
        
       //laço executado sempre que um novo jogador se conecta ao socket  
       for(var id in onlines) {
         //eventos que emitem o id do jogador para que no cliente apareça como Online
         //console.log('notify-onlines');
         socket.emit('notify-onlines', id);
         socket.broadcast.emit('notify-onlines', id);
       }

       
       socket.on('disconnect', function() {
         //evento que emite o id de um jogador para que no cliente apareça como Offline
        socket.broadcast.emit('notify-offlines', usuario._id);
        //deletando o jogador do vetor pois saiu da aplicação
        delete onlines[usuario._id];
       });


      socket.on('qtde_atual_jogadores', function(data) {
         socket.emit('qtde_atual_jogadores_send', data);
         socket.broadcast.emit('qtde_atual_jogadores_send', data);
      });   


      socket.on('habilitar_bt_jogar', function(data) {
        socket.emit('habilitar_bt_jogar_ok', data);
        socket.broadcast.emit('habilitar_bt_jogar_ok', data);
      });


  //inicio rotinas socket chat//////////////////
  socket.on('send-server', function(data) {

    var msg =  "<li id="+"'del'" +"class="+"'left clearfix'"+"><span class="+
            "'chat-img pull-left'"+">"+
       "<div class="+"'chat-body clearfix'"+">"+
        "<div class="+"'header'"+">"+
         "<strong class="+"'primary-font'"+">"+data.nome+"</strong>"+
          "<small class="+"'pull-left text-muted'"+">"+
        "</div>"+
          "<p>"+"<strong>"+data.msg+"</strong>"+"</p>"+
       "</div>"+
      "</li>";
      //console.log(msg);
      var message = {
         id_destinatario: data.id_destinatario,
         nome: data.nome,
         meu_id_painel_adversario: data.meu_id_painel_adversario,     
         msg: msg
      };

      socket.emit('send-client', message);
      socket.broadcast.emit('send-client', message);    
  });
//fim rotinas socket chat//////////////////


// rotinas socket jogo  ///////////////////////////////////
        //var length = onlines.length;
        //recebe do cliente a oferta
        socket.on('send-server-oferta', function(ofertaAdv) {
           var query = ofertaAdv.id_painel;
           Estado_Painel.findById(query).exec(function(err, painel) {
              if(err) {
                console.log(err);
              } else {
                var aux_rodada = painel.rodadas.length-1;
                var aux_round = ofertaAdv.num_p_round-1;
                var jogador = painel.rodadas[aux_rodada].rounds[aux_round].jogador;
               
                var jogador_painel = {
                  id_usuario: jogador.id_usuario,
                  valor_ofertado: Number(ofertaAdv.minhaOferta),
                  nome_adversario: ofertaAdv.nome_adversario,
                  bt_enviar_oferta: jogador.bt_enviar_oferta,
                  subtotal: ofertaAdv.subtotal
                };

                  painel.rodadas[aux_rodada].rounds[aux_round].jogador = jogador_painel;
                  //console.log(jogador_painel); 
                  painel.save();

                  //eventos que emitem para o cliente uma oferta vinda de um jogador
                  socket.emit('send-client-oferta', ofertaAdv);
                  socket.broadcast.emit('send-client-oferta', ofertaAdv);             
              }
           });
        });

        //estado painel////////////////////////////////////////////////////////////
        socket.on('salvar_vr_oferta_recebida_adv_painel', function(data) {
            var query = data.id_painel;
            //console.log(query);
            Estado_Painel.findById(query).exec(function(err, painel) {
               if(err) {
                console.log(err);
               } else {

                var aux_rodada = painel.rodadas.length-1;
                var aux_round = data.num_p_round-1;
                var p_adversarios = painel.rodadas[aux_rodada].rounds[aux_round].adversarios;
                

                for(var i = 0; i < p_adversarios.length; i++) {
                   //console.log(p_adversarios[i].id_usuario+' = '+data.id_adv);
                   if(p_adversarios[i].id_usuario == data.id_adv) {
                      var p_adversario = {
                          id_usuario: p_adversarios[i].id_usuario,
                          valor_total_adv: data.vr_total,
                          valor_oferta_adv: data.vr_ofertado,
                          total_pontos: p_adversarios[i].total_pontos,
                          percent_ganho: p_adversarios[i].percent_ganho,
                          bt_aceite: p_adversarios[i].bt_aceite
                      };
                      painel.rodadas[aux_rodada].rounds[aux_round].adversarios[i] = p_adversario;
                      //console.log(p_adversario);
                      painel.save();
                   }
                }                            

               } 
            });
        });
      //estado painel////////////////////////////////////////////////////////////





// *** Mudança de round *** //
        //estado painel////////////////////////////////////////////////////////////
        socket.on('salvar_bt_novo_round_show_ok', function(data) {
          var id_painel = data.id_painel;
          Estado_Painel.findById(id_painel).exec(function(err, painel) {
              if(err) {

              } else {
              var num_round = data.num_round-1;
              var num_rodada = data.num_rodada-1;   
              painel.rodadas[num_rodada].rounds[num_round].bt_prox_round_show = true;
              painel.save();
              }
          }); 
        });
        //estado painel////////////////////////////////////////////////////////////

        //estado painel////////////////////////////////////////////////////////////
        socket.on('salvar_dados_bt_mudar_round', function(data_) {
          var query = data_.id_painel;
          Estado_Painel.findById(query).exec(function(err, painel) {
            if(err) {
              console.log(err);
            } else {
              
              painel.aux_id_partida = data_.id_partida;
              painel.aux_num_round = data_.num_round;
              painel.aux_num_rodada = data_.num_rodada;
              painel.aux_indice_valor = data_.indice_valor;

              painel.save();

            }
          });
          //console.log('huH');
          socket.emit('salvar_dados_bt_mudar_round_ok', data_); 
        });
        //estado painel////////////////////////////////////////////////////////////  
        
        socket.on('salvar_dados_bt_mudar_round', function(data_) {
          var query = data_.id_painel;
          Estado_Painel.findById(query).exec(function(err, painel) {
            if(err) {
              console.log(err);
            } else {
              
              painel.aux_id_partida = data_.id_partida;
              painel.aux_num_round = data_.num_round;
              painel.aux_num_rodada = data_.num_rodada;
              painel.aux_indice_valor = data_.indice_valor;

              painel.save();

            }
          });
          //console.log('huH');
          socket.emit('salvar_dados_bt_mudar_round_ok', data_); 
        });



        socket.on('carregar_jogadores', function(data_) {
         //jogo//////////////////////////////////////////////////////////////////////
         var query = data_.id_partida;
         Partida.findById(query).exec(function(err, partida) {
           if(partida) {
           var qtde_jogadores = Number(partida.num_jogadores);
            for(var i = 0; i < partida.rodadas.length; i++) {
                if(data_.id_rodada == partida.rodadas[i]._id) {
                  var rodada = partida.rodadas[i];
                  for(var j = 0; j < rodada.rounds.length; j++) {
                    if(data_.id_round == rodada.rounds[j]._id) {
                      var round = rodada.rounds[j];
                      round.count_change_round++;
                      partida.rodadas[i].rounds[j].count_change_round = 
                                                    Number(round.count_change_round);
                      partida.save();


                      if(round.count_change_round == qtde_jogadores) {
                        var data = {
                          id_partida: data_.id_partida,
                          next_round: true
                        };
                        socket.emit('iniciar_novo_round', data);
                        socket.broadcast.emit('iniciar_novo_round', data);
                      //jogo//////////////////////////////////////////////////////////////////////  
                      } else {
                      //estado painel////////////////////////////////////////////////////////////  
                         var id_painel = data_.id_painel;
                         Estado_Painel.findById(id_painel).exec(function(err, painel) {
                             if(err) {
                              console.log(err);
                             } else {
                              //console.log('err');
                             var num_round = data_.num_round-1;
                             var num_rodada = data_.num_rodada-1;   
                             painel.rodadas[num_rodada].rounds[num_round].bt_prox_round_click = true;
                             console.log(painel.rodadas[num_rodada].rounds[num_round]);
                             painel.save();
                             }
                         });
                       //estado painel////////////////////////////////////////////////////////////   
                      }
                    }
                  }
                }
            }
           } else {
            console.log(err);
           }
         });           
        });
// *** Mudança de round *** //






// *** Mudança de rodada *** //
        //a cada mudança de rodada
        //estado painel////////////////////////////////////////////////////////////
        socket.on('salvar_bt_nova_rodada_show_ok', function(data) {
          var id_painel = data.id_painel;

          Estado_Painel.findById(id_painel).exec(function(err, painel) {
              if(err) {
               console.log(err);
              } else {
              var num_round = data.num_round-1;
              var num_rodada = data.num_rodada-1;   
              painel.rodadas[num_rodada].rounds[num_round].bt_prox_rodada_show = true;
              painel.save(function() {
                var id_usuario = data.id_usuario;
                Jogador.find().where('usuario._id').equals(id_usuario).exec(function(err, jogador) {
                  if(err) {
                    console.log(err);
                  } else {
                    //console.log(jogador[0]);
                    jogador[0].flag_rodada_round1 = false;
                    jogador[0].save();
                  }
                });
              });
              }
          }); 
        });
        //estado painel////////////////////////////////////////////////////////////

        //estado painel////////////////////////////////////////////////////////////
        socket.on('carregar_jogadores_prox_rodada', function(data_) {
         //jogo//////////////////////////////////////////////////////////////////////
         var query = data_.id_partida;
         Partida.findById(query).exec(function(err, partida) {
           if(partida) {
           var qtde_jogadores = Number(partida.num_jogadores);
            
            for(var i = 0; i < partida.rodadas.length; i++) {
                
                if(data_.id_rodada == partida.rodadas[i]._id) {
                  var rodada = partida.rodadas[i];
                  
                  for(var j = 0; j < rodada.rounds.length; j++) {
                    
                    if(data_.id_round == rodada.rounds[j]._id) {
                      var round = rodada.rounds[j];
                      round.count_change_round++;
                      partida.rodadas[i].rounds[j].count_change_round = Number(round.count_change_round);
                      partida.save();

                      if(round.count_change_round == qtde_jogadores) {
                        var data = {
                          id_partida: data_.id_partida,
                          next_round: true
                        };
                        //console.log('ei');
                        socket.emit('iniciar_nova_rodada', data);
                        socket.broadcast.emit('iniciar_nova_rodada', data);
                      } else {
                        var id_painel = data_.id_painel;
                        
                        Estado_Painel.findById(id_painel).exec(function(err, painel) {
                            if(err) {
                             console.log(err);
                            } else {
                            //console.log('here SMDF');
                            var aux_rodada = painel.rodadas.length-1;
                            var aux_round = painel.rodadas[aux_rodada].rounds.length-1;   
                            painel.rodadas[aux_rodada].rounds[aux_round].bt_prox_rodada_click = true;
                            painel.save();
                            }
                        });
                      }
                    
                    }

                  }
                }
            }
           } else {
            console.log(err);
           }
         });           
        });
// *** Mudança de rodada *** //


        socket.on('enviar_aceite', function(data) {
          //estado painel//////////////////////////////////////////////////////////// 
          var id_painel = data.id_painel;
          Estado_Painel.findById(id_painel).exec(function(err, painel) {
              if(err) {

              } else {
                var aux_rodada = painel.rodadas.length-1;
                var aux_round = data.num_round-1;
                var p_adversarios = painel.rodadas[aux_rodada].rounds[aux_round].adversarios;
                

                for(var i = 0; i < p_adversarios.length; i++) {
                   //console.log(p_adversarios[i].id_usuario+' = '+data.id_adversario);
                   if(p_adversarios[i].id_usuario == data.id_adversario) {
                      var p_adversario = {
                          id_usuario: p_adversarios[i].id_usuario,
                          valor_total_adv: p_adversarios[i].valor_total_adv,
                          valor_oferta_adv: p_adversarios[i].valor_oferta_adv,
                          total_pontos: p_adversarios[i].total_pontos,
                          percent_ganho: p_adversarios[i].percent_ganho,
                          bt_aceite: true
                      };
                      painel.rodadas[aux_rodada].rounds[aux_round].adversarios[i] = p_adversario;
                      //estado painel////////////////////////////////////////////////////////////


                      painel.save(function() {
                      //jogo//////////////////////////////////////////////////////////////////////  
                          var query = data.id_partida;
                          Partida.findById(query).exec(function(err, partida) {
                             
                             //console.log(data);
                             if(partida) {
                               var rodadas = [];
                               rodadas = partida.rodadas;
                               var rodada = null;
                               var indiceRodada = 0;

                               for(var i = 0; i < rodadas.length; i++) {
                                 if(data.id_rodada == rodadas[i]._id) {
                                     rodada = rodadas[i];
                                     indiceRodada = i;
                                 }

                               }
                               
                               if(data.num_round == 1) {
                                 
                                 rodada.rounds[0].qtdeAtualJogadas++;
                                 var jogadores = [];
                                 jogadores = partida.jogadores;
                               

                                 for(var j = 0; j < jogadores.length; j++) {
                                   
                                   if(data.meu_id == jogadores[j].usuario._id) {
                                        
                                     var id_jogador = jogadores[j]._id;
                                     
                                      
                                    Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var ofertado = new Ofertado(data.id_partida, 
                                                                    data.id_rodada,
                                                                    data.num_round,
                                                                    data.valor_total,
                                                                    data.oferta,
                                                                    data.id_adversario,
                                                                    data.aceite);
                                         if(data.aceite == 'sim') {
                                           var a = Number(jogador.pontuacao_max);
                                           var b = Number(data.oferta);
                                           jogador.pontuacao_max = Number(a + b);
                                           jogador.num_ofertas_aceitou++;
                                         } else {
                                           jogador.num_ofertas_recusou++;
                                         }
                                         
                                         jogador.ofertas_recebidas.push(ofertado);

                                         jogador.save();
                                         
                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();

                                        } else {

                                        }

                                     });
                                       

                                   }
                                    
                                    if(data.id_adversario == jogadores[j].usuario._id) {
                                        var id_jogador = jogadores[j]._id;
                                     
                                      Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var oferta = new Oferta(data.id_partida, 
                                                                data.id_rodada,
                                                                data.num_round,
                                                                data.valor_total,
                                                                data.oferta,
                                                                data.id_adversario,
                                                                data.aceite);
                                         
                                         if(data.aceite == 'sim') {
                                           var vr_parcial = Number(data.valor_total - data.oferta);
                                           jogador.pontuacao_max = Number(jogador.pontuacao_max
                                                                                      +vr_parcial);
                                         } 

                                         
                                         jogador.ofertas_realizadas.push(oferta);

                                         jogador.save();

                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();
                                        } else {

                                        }
                               
                                       });
                                    }
                          

                                }
                                 
                                 if(rodada.rounds[0].qtdeAtualJogadas == rodada
                                                               .rounds[0].qtdeTotalJogadas) {
                                     var finalizar_round = {
                                         id_partida: data.id_partida,
                                         id_rodada: data.id_rodada,
                                         id_round: data.id_round,
                                         num_round: data.num_round,
                                         num_rodada: data.num_rodada,
                                         indice_valor: data.indice_valor
                                     };
                                     
                                     socket.emit('final_round', finalizar_round);
                                     socket.broadcast.emit('final_round', finalizar_round);
                                     //jogo//////////////////////////////////////////////////////////////////////

                                     //estado painel////////////////////////////////////////////////////////////
                                     socket.emit('salvar_bt_novo_round_show');
                                     socket.broadcast.emit('salvar_bt_novo_round_show');
                                     //estado painel////////////////////////////////////////////////////////////
                                  }
                               
                               }
                               
                               //jogo//////////////////////////////////////////////////////////////////////
                               if(data.num_round == 2) {
                                   
                                 rodada.rounds[1].qtdeAtualJogadas++;
                                 var jogadores = [];
                                 jogadores = partida.jogadores;
                               

                                 for(var j = 0; j < jogadores.length; j++) {
                                   
                                   if(data.meu_id == jogadores[j].usuario._id) {
                                        
                                   var id_jogador = jogadores[j]._id;
                                     
                                      
                                    Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var ofertado = new Ofertado(data.id_partida, 
                                                                    data.id_rodada,
                                                                    data.num_round,
                                                                    data.valor_total,
                                                                    data.oferta,
                                                                    data.id_adversario,
                                                                    data.aceite);

                                         if(data.aceite == 'sim') {
                                           var a = Number(jogador.pontuacao_max);
                                           var b = Number(data.oferta);
                                           jogador.pontuacao_max = Number(a + b);

                                           jogador.num_ofertas_aceitou++;
                                         } else {
                                           jogador.num_ofertas_recusou++;
                                         }
                                         
                                         jogador.ofertas_recebidas.push(ofertado);

                                         jogador.save();
                                         
                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();

                                        } else {

                                        }

                                     });
                                       

                                   }
                                    
                                    if(data.id_adversario == jogadores[j].usuario._id) {
                                        var id_jogador = jogadores[j]._id;
                                     
                                      Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var oferta = new Oferta(data.id_partida, 
                                                                data.id_rodada,
                                                                data.num_round,
                                                                data.valor_total,
                                                                data.oferta,
                                                                data.id_adversario,
                                                                data.aceite);
                                         
                                         if(data.aceite == 'sim') {
                                           var vr_parcial = Number(data.valor_total - data.oferta);
                                           jogador.pontuacao_max = Number(jogador.pontuacao_max
                                                                                      +vr_parcial);
                                         } 

                                         
                                         jogador.ofertas_realizadas.push(oferta);

                                         jogador.save();

                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();
                                        } else {

                                        }
                               
                                       });
                                    }
                          
                                }
                                 
                                 if(rodada.rounds[1].qtdeAtualJogadas == rodada
                                                               .rounds[1].qtdeTotalJogadas) {
                                     var finalizar_round = {
                                         id_partida: data.id_partida,
                                         id_rodada: data.id_rodada,
                                         id_round: data.id_round,
                                         num_round: data.num_round,
                                         num_rodada: data.num_rodada,
                                         indice_valor: data.indice_valor
                                     };
                                                            
                                     socket.emit('final_round', finalizar_round);
                                     socket.broadcast.emit('final_round', finalizar_round);
                                     //jogo////////////////////////////////////////////////////////////////////// 

                                     //estado painel//////////////////////////////////////////////////////////// 
                                     socket.emit('salvar_bt_novo_round_show');
                                     socket.broadcast.emit('salvar_bt_novo_round_show');
                                     //estado painel////////////////////////////////////////////////////////////
                                  }

                               }

                               //jogo////////////////////////////////////////////////////////////////////// 
                               if(data.num_round == 3) {
                                   
                                 rodada.rounds[2].qtdeAtualJogadas++;
                                 var jogadores = [];
                                 jogadores = partida.jogadores;
                               

                                 for(var j = 0; j < jogadores.length; j++) {
                                   
                                   if(data.meu_id == jogadores[j].usuario._id) {
                                        
                                   var id_jogador = jogadores[j]._id;
                                     
                                      
                                    Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var ofertado = new Ofertado(data.id_partida, 
                                                                    data.id_rodada,
                                                                    data.num_round,
                                                                    data.valor_total,
                                                                    data.oferta,
                                                                    data.id_adversario,
                                                                    data.aceite);

                                         if(data.aceite == 'sim') {
                                           var a = Number(jogador.pontuacao_max);
                                           var b = Number(data.oferta);
                                           jogador.pontuacao_max = Number(a + b);

                                           jogador.num_ofertas_aceitou++;
                                         } else {
                                           jogador.num_ofertas_recusou++;
                                         }
                                         
                                         jogador.ofertas_recebidas.push(ofertado);

                                         jogador.save();
                                         
                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();

                                        } else {

                                        }

                                     });
                                       

                                   }
                                    
                                    if(data.id_adversario == jogadores[j].usuario._id) {
                                        var id_jogador = jogadores[j]._id;
                                     
                                      Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var oferta = new Oferta(data.id_partida, 
                                                                data.id_rodada,
                                                                data.num_round,
                                                                data.valor_total,
                                                                data.oferta,
                                                                data.id_adversario,
                                                                data.aceite);
                                         
                                         if(data.aceite == 'sim') {
                                           var vr_parcial = Number(data.valor_total - data.oferta);
                                           jogador.pontuacao_max = Number(jogador.pontuacao_max
                                                                                      +vr_parcial);
                                         } 

                                         
                                         jogador.ofertas_realizadas.push(oferta);

                                         jogador.save();

                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();
                                        } else {

                                        }
                               
                                       });
                                    }
                          
                                }
                                 
                                 if(rodada.rounds[2].qtdeAtualJogadas == rodada
                                                               .rounds[2].qtdeTotalJogadas) {
                                     var finalizar_round = {
                                         id_partida: data.id_partida,
                                         id_rodada: data.id_rodada,
                                         id_round: data.id_round,
                                         num_round: data.num_round,
                                         num_rodada: data.num_rodada,
                                         indice_valor: data.indice_valor
                                     };
                                                            
                                     socket.emit('final_round', finalizar_round);
                                     socket.broadcast.emit('final_round', finalizar_round);
                                     //jogo////////////////////////////////////////////////////////////////////// 

                                     //estado painel////////////////////////////////////////////////////////////  
                                     socket.emit('salvar_bt_novo_round_show');
                                     socket.broadcast.emit('salvar_bt_novo_round_show');
                                     //estado painel////////////////////////////////////////////////////////////
                                  }

                               }

                               //jogo//////////////////////////////////////////////////////////////////////
                               if(data.num_round == 4) {
                                   
                                 rodada.rounds[3].qtdeAtualJogadas++;
                                 var jogadores = [];
                                 jogadores = partida.jogadores;
                               

                                 for(var j = 0; j < jogadores.length; j++) {
                                   
                                   if(data.meu_id == jogadores[j].usuario._id) {
                                        
                                   var id_jogador = jogadores[j]._id;
                                     
                                      
                                    Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var ofertado = new Ofertado(data.id_partida, 
                                                                    data.id_rodada,
                                                                    data.num_round,
                                                                    data.valor_total,
                                                                    data.oferta,
                                                                    data.id_adversario,
                                                                    data.aceite);

                                         if(data.aceite == 'sim') {
                                           var a = Number(jogador.pontuacao_max);
                                           var b = Number(data.oferta);
                                           jogador.pontuacao_max = Number(a + b);

                                           jogador.num_ofertas_aceitou++;
                                         } else {
                                           jogador.num_ofertas_recusou++;
                                         }
                                         
                                         jogador.ofertas_recebidas.push(ofertado);

                                         jogador.save();
                                         
                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();

                                        } else {

                                        }

                                     });
                                       

                                   }
                                    
                                    if(data.id_adversario == jogadores[j].usuario._id) {
                                        var id_jogador = jogadores[j]._id;
                                     
                                      Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var oferta = new Oferta(data.id_partida, 
                                                                data.id_rodada,
                                                                data.num_round,
                                                                data.valor_total,
                                                                data.oferta,
                                                                data.id_adversario,
                                                                data.aceite);
                                         
                                         if(data.aceite == 'sim') {
                                           var vr_parcial = Number(data.valor_total - data.oferta);
                                           jogador.pontuacao_max = Number(jogador.pontuacao_max
                                                                                      +vr_parcial);
                                         } 

                                         
                                         jogador.ofertas_realizadas.push(oferta);

                                         jogador.save();

                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();
                                        } else {

                                        }
                               
                                       });
                                    }
                          
                                }
                                 
                                 if(rodada.rounds[3].qtdeAtualJogadas == rodada
                                                               .rounds[3].qtdeTotalJogadas) {
                                     var finalizar_round = {
                                         id_partida: data.id_partida,
                                         id_rodada: data.id_rodada,
                                         id_round: data.id_round,
                                         num_round: data.num_round,
                                         num_rodada: data.num_rodada,
                                         indice_valor: data.indice_valor
                                     };
                                                            
                                     socket.emit('final_round', finalizar_round);
                                     socket.broadcast.emit('final_round', finalizar_round);
                                     //jogo//////////////////////////////////////////////////////////////////////

                                     //estado painel////////////////////////////////////////////////////////////
                                     socket.emit('salvar_bt_novo_round_show');
                                     socket.broadcast.emit('salvar_bt_novo_round_show');
                                     //estado painel////////////////////////////////////////////////////////////
                                  }

                               }
                               
                              //jogo//////////////////////////////////////////////////////////////////////
                              if(data.num_round == 5) {
                                   
                                 rodada.rounds[4].qtdeAtualJogadas++;
                                 var jogadores = [];
                                 jogadores = partida.jogadores;
                               

                                 for(var j = 0; j < jogadores.length; j++) {
                                   
                                   if(data.meu_id == jogadores[j].usuario._id) {
                                        
                                   var id_jogador = jogadores[j]._id;
                                     
                                      
                                    Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var ofertado = new Ofertado(data.id_partida, 
                                                                    data.id_rodada,
                                                                    data.num_round,
                                                                    data.valor_total,
                                                                    data.oferta,
                                                                    data.id_adversario,
                                                                    data.aceite);

                                         if(data.aceite == 'sim') {
                                           var a = Number(jogador.pontuacao_max);
                                           var b = Number(data.oferta);
                                           jogador.pontuacao_max = Number(a + b);

                                           jogador.num_ofertas_aceitou++;
                                         } else {
                                           jogador.num_ofertas_recusou++;
                                         }
                                         
                                         jogador.ofertas_recebidas.push(ofertado);

                                         jogador.save();
                                         
                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();

                                        } else {

                                        }

                                     });
                                       

                                   }
                                    
                                    if(data.id_adversario == jogadores[j].usuario._id) {
                                        var id_jogador = jogadores[j]._id;
                                     
                                      Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var oferta = new Oferta(data.id_partida, 
                                                                data.id_rodada,
                                                                data.num_round,
                                                                data.valor_total,
                                                                data.oferta,
                                                                data.id_adversario,
                                                                data.aceite);
                                         
                                         if(data.aceite == 'sim') {
                                           var vr_parcial = Number(data.valor_total - data.oferta);
                                           jogador.pontuacao_max = Number(jogador.pontuacao_max
                                                                                      +vr_parcial);
                                         } 

                                         
                                         jogador.ofertas_realizadas.push(oferta);

                                         jogador.save();

                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();
                                        } else {

                                        }
                               
                                       });
                                    }
                          
                                }
                                 
                                 if(rodada.rounds[4].qtdeAtualJogadas == rodada
                                                               .rounds[4].qtdeTotalJogadas) {
                                     var finalizar_round = {
                                         id_partida: data.id_partida,
                                         id_rodada: data.id_rodada,
                                         id_round: data.id_round,
                                         num_round: data.num_round,
                                         num_rodada: data.num_rodada,
                                         indice_valor: data.indice_valor
                                     };
                                                            
                                     socket.emit('final_round', finalizar_round);
                                     socket.broadcast.emit('final_round', finalizar_round);
                                     //jogo////////////////////////////////////////////////////////////////////// 

                                     //estado painel////////////////////////////////////////////////////////////
                                     socket.emit('salvar_bt_novo_round_show');
                                     socket.broadcast.emit('salvar_bt_novo_round_show');
                                     //estado painel////////////////////////////////////////////////////////////
                                  }

                               }
                               
                                
                              //jogo//////////////////////////////////////////////////////////////////////
                               if(data.num_round == 6) {
                                   
                                 rodada.rounds[5].qtdeAtualJogadas++;
                                 var jogadores = [];
                                 jogadores = partida.jogadores;
                               

                                 for(var j = 0; j < jogadores.length; j++) {
                                   
                                   if(data.meu_id == jogadores[j].usuario._id) {
                                        
                                   var id_jogador = jogadores[j]._id;
                                     
                                      
                                    Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var ofertado = new Ofertado(data.id_partida, 
                                                                    data.id_rodada,
                                                                    data.num_round,
                                                                    data.valor_total,
                                                                    data.oferta,
                                                                    data.id_adversario,
                                                                    data.aceite);

                                         if(data.aceite == 'sim') {
                                           var a = Number(jogador.pontuacao_max);
                                           var b = Number(data.oferta);
                                           jogador.pontuacao_max = Number(a + b);
                                           
                                           jogador.num_ofertas_aceitou++;
                                         } else {
                                           jogador.num_ofertas_recusou++;
                                         }
                                         
                                         jogador.ofertas_recebidas.push(ofertado);

                                         jogador.save();
                                         
                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();

                                        } else {

                                        }

                                     });
                                       

                                   }
                                    
                                    if(data.id_adversario == jogadores[j].usuario._id) {
                                        var id_jogador = jogadores[j]._id;
                                     
                                      Jogador.findById(id_jogador).exec(function(err, jogador) {
                                       if(jogador) {
                          
                                        var oferta = new Oferta(data.id_partida, 
                                                                data.id_rodada,
                                                                data.num_round,
                                                                data.valor_total,
                                                                data.oferta,
                                                                data.id_adversario,
                                                                data.aceite);
                                         
                                         if(data.aceite == 'sim') {
                                           var vr_parcial = Number(data.valor_total - data.oferta);
                                           jogador.pontuacao_max = Number(jogador.pontuacao_max
                                                                                      +vr_parcial);
                                         } 

                                         
                                         jogador.ofertas_realizadas.push(oferta);

                                         jogador.save();

                                         partida.jogadores[j] = jogador; 
                                         
                                         partida.save();
                                        } else {

                                        }
                               
                                       });
                                    }
                          
                                }

                                if(rodada.rounds[5].qtdeAtualJogadas == rodada
                                                               .rounds[5].qtdeTotalJogadas) {
                                              
                                                                           
                                      var id_partida = 0;
                                      Partida.findById(query).exec(function(err, partida_) {
                                       if(partida_) { 
                                        if(partida_.rodadas.length < 6) {
                                         id_partida = partida_._id;
                                         var num_nova_rodada = rodada.numero_rodada;
                                         num_nova_rodada++;  
                                         var nova_rodada = new Rodada(num_nova_rodada);
                                         var qtde_total_jogadas = rodada.rounds[5].qtdeAtualJogadas;
                                         
                                         var round1 = new c_round(1, qtde_total_jogadas);
                                         var round2 = new c_round(2, qtde_total_jogadas);
                                         var round3 = new c_round(3, qtde_total_jogadas);
                                         var round4 = new c_round(4, qtde_total_jogadas);
                                         var round5 = new c_round(5, qtde_total_jogadas);
                                         var round6 = new c_round(6, qtde_total_jogadas);                    

                                          nova_rodada.rounds.push(round1);
                                          nova_rodada.rounds.push(round2);
                                          nova_rodada.rounds.push(round3);
                                          nova_rodada.rounds.push(round4);
                                          nova_rodada.rounds.push(round5);
                                          nova_rodada.rounds.push(round6);
                                          
                                          partida_.rodadas.push(nova_rodada)
                                          
                                          partida_.save(function() {
                                            var id_rodada = null;

                                            Partida.findById(query).exec(function(err, partida__) {
                                             if(partida__) {
                                             id_rodada = partida__.rodadas[partida__.rodadas
                                                                         .length-1]._id;
                                              var data = {
                                               nova_rodada: nova_rodada,
                                               id_partida: id_partida,
                                               id_rodada: id_rodada,
                                               num_round: 6,
                                              };
                                                
                                               socket.emit('final_rodada', data);
                                               socket.broadcast.emit('final_rodada', data);
                                               //jogo//////////////////////////////////////////////////////////////////////

                                               //estado painel////////////////////////////////////////////////////////////
                                               socket.emit('salvar_bt_nova_rodada_show');
                                               socket.broadcast.emit('salvar_bt_nova_rodada_show');                           
                                               //estado painel////////////////////////////////////////////////////////////
                                            } else {
                                              console.log(err);
                                            }
                                          });

                                          });
                                        //jogo//////////////////////////////////////////////////////////////////////
                                        } else {
                                              
                                           var data = {
                                               id_partida: query, 
                                               msg: 'Partida finalizada!',
                                               msg2: 'Obrigado por participar!'
                                           }
                                           //console.log(data);       
                                           socket.emit('fim_de_jogo', data);
                                           socket.broadcast.emit('fim_de_jogo', data);
                                           socket.emit('salvar_percentual_ganho', query);
                                           socket.broadcast.emit('salvar_percentual_ganho', query);
                                           finalizar_partida(query);
                                        }
                                        //jogo//////////////////////////////////////////////////////////////////////
                                        } else {
                                          console.log(err);     
                                        }

                                      });

                                }

                               }


                             } else {
                               console.log(err);
                             }
                          });
                      });
                   }
                }                
              }
          });

        });
    //jogo//////////////////////////////////////////////////////////////////////
    socket.on('save_percent', function(id_jogador) {
        salvar_percentual_ganho(id_jogador);
    });
    //jogo//////////////////////////////////////////////////////////////////////
  });
//socket.io



//initialize server
server.listen(process.env.PORT || 5000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});