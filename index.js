const KEY = 'UltimatumGame.sid';
const SECRET = 'UltimatumGame';
var routesHome = require('./routes/home');
var routesLogin = require('./routes/autenticacao');
var routesMenuJogador = require('./routes/menu-jogador');
var routesMenuPartida = require('./routes/menu-partida');
var routesPesquisar = require('./routes/pesquisar');
var routesPersuasao = require('./routes/painel-persuasao');
var routesPerfilUsuario = require('./routes/perfil_usuario');
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
app.get('/menu-jogador', routesMenuJogador);//<--- para não fazer chamada à rota menu_partida 
app.get('/menu_partida', routesMenuPartida); //ao acessar menu jogador pela primeira vez 
app.post('/criar_partida', routesMenuPartida);


//config rotas menu-jogador
app.get('/jogo_do_ultimato', routesMenuJogador);
app.post('/iniciar_partida', routesMenuJogador);
app.get('/retornar_ao_jogo', routesMenuJogador);
app.post('/iniciar_novoRound', routesMenuJogador);
app.post('/iniciar_novaRodada', routesMenuJogador);


//config rotas pesquisar
app.get('/pesquisar_filtros', routesPesquisar);
app.post('/pesquisar', routesPesquisar);
app.post('/visualizar_resultados_por_partida', routesPesquisar);


//config rotas persuasao
app.get('/painel_persuasao', routesPersuasao);
app.get('/painel_afinidades', routesPersuasao);
app.get('/resultados_persuasao', routesPersuasao);

//rotas perfil usuario
app.get('/perfil_usuario', routesPerfilUsuario);
app.get('/editar_perfil', routesPerfilUsuario);
app.post('/salvar_alteracoes', routesPerfilUsuario);
app.post('/visitar_perfil', routesPerfilUsuario);

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
                  usuario.id_partida = null;
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
        store.get(sessionID, function(err, session) {
           if(err || !session) {
              return next(new Error('Acesso negado!'));
           } else {
            socket.handshake.session = session;
            return next();
           }
        });
     });
  });



  var crypto = require('crypto');
  var Partida = require('./models/Partida');
  var Jogador = require('./models/Jogador');
  var c_jogador = require('./controllers/jogador');
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
  var Estado_Painel = require('./models/Estado_painel');
  var Persuasoes_Padrao_Resultados = require('./models/Persuasoes_Padrao_Resultados');
  var Chat = require('./models/Chat');
  var sortearValores = require('./functions/sortearValores');
  var deduzir_quinze_por_cento = require('./functions/deduzir_quinze_por_cento');
  //config socket.io
  
  var onlines = {};//armazena jogadores online
  //var partida = null;
  

  io.sockets.on('connection', function(socket) {
     //console.log('notify-onlines');
     //armazena a sessao do usuario compartilhada com o socket
     var session = socket.handshake.session;
     //armazena os dados do jogador (vindos da sessao/socket )que acabou de se conectar ao socket
     var usuario = session.passport.user;
     
     //console.log(usuario.sala);
     
     //vetor que armazena os jogadores conectados ao socket
     onlines[usuario._id] = usuario._id;
       


       //laço executado sempre que um novo jogador se conecta ao socket  
       for(var id in onlines) {
         //eventos que emitem o id do jogador para que no cliente apareça como Online
         socket.emit('notify-onlines', id);
         socket.broadcast.emit('notify-onlines', id);
       }



       socket.on('disconnect', function() {
        //console.log('saindo');
         //evento que emite o id de um jogador para que no cliente apareça como Offline
        socket.broadcast.emit('notify-offlines', usuario._id);
        //deletando o jogador do vetor pois saiu da aplicação
        delete onlines[usuario._id];
       });
        
             
      //entrar no jogo I
      socket.on('verificar_se_jogador_esta_em_alguma_partida', function(id_partida_clicada) {
         var flag = false;
         var curso = '';
         var modulo = '';
         Partida.find().exec(function(err, partidas) {
          var idJogador = usuario._id;
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
           
            Partida.findById(id_partida_clicada).exec(function(err, partida) {
               if(partida) {
                curso = partida.tipo_sala.curso;
                modulo = partida.tipo_sala.modulo;

                var data = {
                 meu_id: usuario._id,
                 id_partida_clicada: id_partida_clicada,
                 curso: curso,
                 modulo: modulo,
                 flag: flag
                };
                //console.log(data);
                socket.emit('retorno_estou_numa_partida', data);
              }
            });
           
         });
      });





socket.on('entrar_na_sala', function(data) {
  //var flag = true;

  var time1 = Math.floor((Math.random() * 5000) + 1);
  var time2 = Math.floor((Math.random() * 100) + 1);
  var time3 = Math.floor((Math.random() * 100) + 1);
  
  var time = ((time1 - time2) + time3);


   setTimeout(function() {
     
     Partida.findById(data.id_partida_clicada).exec(function(err, partida) {
       if (partida) {
         
         if(partida.num_jogadores < partida.tipo_sala.capacidadeSala) {
          
          var versao_atual = partida.versao;
            

          var novoJogador = new c_jogador(usuario, data.id_partida_clicada);

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

                 tentar_entrar(jogador, partida, versao_atual);
          
              }
           });

           } else {
            //capacidade esgotada
           }
          } else {
            console.log(err);
          }
     }); 

   }, time);
   

});      




var tentar_entrar = function(jogador, partida, versao_atual) {
    
    var data_return = partida.salvar_entrada(partida, jogador, versao_atual);

    setTimeout(function() {

      if(data_return.save == true) {
               
        if(data_return.num_jogadores == partida.tipo_sala.capacidadeSala) {
            
            var data = {
               meu_id: usuario.meu_id,
               id_partida: partida._id
            };

             socket.emit('iniciar_jogo', data);
             socket.broadcast.emit('iniciar_jogo', data);
        }

        if(data_return.num_jogadores < partida.tipo_sala.capacidadeSala) {
             
             var data = {
                  meu_id: usuario._id,
                  id_partida: partida._id,
                  qtde_atual_de_jogadores: data_return.num_jogadores
             };

               socket.emit('qtde_jogadores_atual', data);
               socket.broadcast.emit('qtde_jogadores_atual',data);
        }


      } else {

        var id_partida = partida._id;

             setTimeout(function() {

               Partida.findById(id_partida).exec(function(err, partida) {
                   if(partida) {
                      
                      var versao_atualizada = partida.versao;

                      tentar_entrar(jogador, partida, versao_atualizada);

                   } else {

                   }
               });

             }, 3000);
          
      }  

    }, 3000);

};

     
      socket.on('qtde_atual_jogadores', function(data) {
         socket.emit('qtde_atual_jogadores_send', data);
         socket.broadcast.emit('qtde_atual_jogadores_send', data);
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
        
        
  socket.on('carregar_jogadores', function(data_) {
         
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
         


         //jogo//////////////////////////////////////////////////////////////////////
            var query = data_.id_partida;
            Partida.findById(query).exec(function(err, partida) {
         
              if(partida) {
                  var versao = partida.versao;
                  var retorno = partida.incrementarContadorCarregarJogadores(versao);

                  if(retorno == true) {
                     
                      if(partida.contador_prox_round == partida.num_jogadores) {
                        var data = {
                          id_partida: data_.id_partida,
                          next_round: true
                        };
                        
                        if(partida.num_round_atual < 6) {
                          partida.num_round_atual++;
                          partida.indice_valor++;
                          partida.save();
                        }
                        
                        socket.emit('iniciar_novo_round', data);
                        socket.broadcast.emit('iniciar_novo_round', data);
                      //jogo//////////////////////////////////////////////////////////////////////  
                      } else {
                         
                        var id_painel = data_.id_painel;
                        Estado_Painel.findById(id_painel).exec(function(err, painel) {
                            if(err) {
                             console.log(err);
                            } else {
                             //console.log('err');
                            var num_round = data_.num_round-1;
                            var num_rodada = data_.num_rodada-1;   
                            painel.rodadas[num_rodada].rounds[num_round].bt_prox_round_click = true;
                            //console.log(painel.rodadas[num_rodada].rounds[num_round]);
                            painel.save();
                            }
                        });

                      }

                  } else {
                     tentar_carregar_denovo(data_);
                  }   

              } else {
               console.log(err);
              }

            });

       }
     });
           
  });


var tentar_carregar_denovo = function(data_) {

     var time1 = Math.floor((Math.random() * 5000) + 1);
     var time2 = Math.floor((Math.random() * 100) + 1);
     var time3 = Math.floor((Math.random() * 100) + 1);
     
     var time = ((time1 - time2) + time3); 

    setTimeout(function() {
       var query = data_.id_partida;
       Partida.findById(query).exec(function(err, partida) {
    
         if(partida) {
             var versao = partida.versao;
             var retorno = partida.incrementarContadorCarregarJogadores(versao);

           setTimeout(function() {
             if(retorno == true) {
                 
               if(partida.contador_prox_round == partida.num_jogadores) {
                 var data = {
                   id_partida: data_.id_partida,
                   next_round: true
                 };
                 
                 if(partida.num_round_atual < 6) {
                   partida.num_round_atual++;
                   partida.indice_valor++;
                   partida.save();
                 }
                 
                 socket.emit('iniciar_novo_round', data);
                 socket.broadcast.emit('iniciar_novo_round', data);
               //jogo//////////////////////////////////////////////////////////////////////  
               } else {
                  
                 var id_painel = data_.id_painel;
                    Estado_Painel.findById(id_painel).exec(function(err, painel) {
                     if(err) {
                      console.log(err);
                     } else {
                      //console.log('err');
                     var num_round = data_.num_round-1;
                     var num_rodada = data_.num_rodada-1;   
                     painel.rodadas[num_rodada].rounds[num_round].bt_prox_round_click = true;
                     //console.log(painel.rodadas[num_rodada].rounds[num_round]);
                     painel.save();
                    }
                 });

               }

             } else {
               tentar_carregar_denovo(data_);
             }
           }, 2000);

         } else {
           console.log(err);
         }
       });
     }, time);    

};       
// *** Mudança de round *** //


// *** Mudança de rodada *** //
        //a cada mudança de rodada
        //estado painel////////////////////////////////////////////////////////////
        socket.on('salvar_flag_round1_ok', function(data_) {
           var query = data_.id_usuario;
           Jogador.find().where('usuario._id').equals(query).exec(function(err, jogador) {
            if(err) {
             console.log(err);
            } else {
             //console.log(jogador[0]);
             jogador[0].flag_rodada_round1 = false;
             jogador[0].save(function() {
             socket.emit('finalizar_rodada', data_);
            });
           }
          });
        });


        //estado painel////////////////////////////////////////////////////////////
    socket.on('carregar_jogadores_prox_rodada', function(data__) {
         //jogo//////////////////////////////////////////////////////////////////////
                      
             var query = data__.id_partida;
             Partida.findById(query).exec(function(err, partida) {
               if(partida) {

               var versao = partida.versao;
               var retorno = partida.incrementarContadorCarregarJogadores(versao);
                
                    if(retorno == true) {
                     
                     if(partida.contador_prox_round == partida.num_jogadores) {
                      var data = {
                       id_partida: data__.id_partida,
                       next_round: true
                      };

                     if(partida.num_rodada_atual < 6) {
                         partida.num_rodada_atual++;
                         partida.num_round_atual = 1;
                         partida.indice_valor++;
                         partida.save();
                     }

                      socket.emit('iniciar_nova_rodada', data);
                      socket.broadcast.emit('iniciar_nova_rodada', data);      
                   
                    } else {
                      socket.emit('loading');
                      socket.broadcast.emit('loading');
                    }                

                   } else {
                     tentar_carregar_final_rodada_denovo(data__);
                   }

               } else {
                console.log(err);
               }
             });            
        
        });


var tentar_carregar_final_rodada_denovo = function(data__) {
     var time1 = Math.floor((Math.random() * 5000) + 1);
     var time2 = Math.floor((Math.random() * 100) + 1);
     var time3 = Math.floor((Math.random() * 100) + 1);          
     
     var time = ((time1 - time2) + time3);

    setTimeout(function() {
        
        var query = data__.id_partida;
        Partida.findById(query).exec(function(err, partida) {
          if(partida) {

          var versao = partida.versao;
          var retorno = partida.incrementarContadorCarregarJogadores(versao);
           
            setTimeout(function() {
               if(retorno == true) {
                
                if(partida.contador_prox_round == partida.num_jogadores) {
                 var data = {
                  id_partida: data__.id_partida,
                  next_round: true
                 };

                if(partida.num_rodada_atual < 6) {
                    partida.num_rodada_atual++;
                    partida.num_round_atual = 1;
                    partida.indice_valor++;
                    partida.save();
                }

                 socket.emit('iniciar_nova_rodada', data);
                 socket.broadcast.emit('iniciar_nova_rodada', data);      
              
               } else {
                 socket.emit('loading');
                 socket.broadcast.emit('loading');
               }                

              } else {
                tentar_carregar_final_rodada_denovo(data__);
              }
            }, 2000);

          } else {
           console.log(err);
          }
        }); 
    }, time);
};
// *** Mudança de rodada *** //






//////////////////////////////////////////////////////// salvar aceites
socket.on('enviar_aceite', function(data) {          
     var query = data.id_partida;
     var temp = data;
     var id_painel = data.id_painel;
     Estado_Painel.findById(id_painel).exec(function(err, painel) {
         
         if(err) {
          console.log(err);
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
             }
            
            } 
            painel.save(function() {
          
              var time1 = Math.floor((Math.random() * 5000) + 1);
              var time2 = Math.floor((Math.random() * 100) + 1);
              var time3 = Math.floor((Math.random() * 100) + 1);
                         
              var time = ((time1 - time2) + time3);

              setTimeout(function() {    
 
                Partida.findById(data.id_partida).exec(function(err, partida) {
                 if(partida) {
                   
                   var versao = partida.versao;
                   
                   var retorno = partida.incrementarAceite(versao);
                 
                     setTimeout(function() {
                        if(retorno == true) {
                          salvar_aceite_db(data);
                        } else {
                          tentar_salvar_aceite_novamente(data); 
                        }
                     }, 2000);            

                 }

                });

              }, time);     
            
            });
         }
                 
     });        
});


var tentar_salvar_aceite_novamente = function(data) {
  var id_partida = data.id_partida;

    Partida.findById(id_partida).exec(function(err, partida) {
       if(partida) {
          var versao = partida.versao;

          var retorno = partida.incrementarAceite(versao);
        
          setTimeout(function() {
             if(retorno == true) {
               salvar_aceite_db(data);
             } else {
               tentar_salvar_aceite_novamente(data);
             }
          }, 2000);
           
       } else {
          console.log(err);
       }
    });

};

var salvar_aceite_db = function(data) {
  var query = data.id_partida;

  setTimeout(function() {
    
    Partida.findById(query).exec(function(err, partida) {
      if(partida) {

        var rodadas = [];
        rodadas = partida.rodadas;
        var rodada = null;
        var query = partida._id;
        
        for(var i = 0; i < rodadas.length; i++) {
           if(data.id_rodada == rodadas[i]._id) {
             rodada = rodadas[i];
           }
        }

        var jogadores = [];
        jogadores = partida.jogadores;


        if(data.num_round == 1) {
           
           for(var j = 0; j < jogadores.length; j++) {
        
             if(data.meu_id == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_ofertado(data, id_jogador, partida);
             }

             if(data.id_adversario == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_oferta(data, id_jogador, partida); 
             }  

           }

           if(partida.contador_aceite == partida.num_jogadores) {
              finalizar_round(data, partida);  
           }

        }

        if(data.num_round == 2) {
            
           for(var j = 0; j < jogadores.length; j++) {
           
             if(data.meu_id == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_ofertado(data, id_jogador, partida);
             }

             if(data.id_adversario == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_oferta(data, id_jogador, partida); 
             }

           }

           if(partida.contador_aceite == partida.num_jogadores) {
              finalizar_round(data, partida);  
           }   

        }

        if(data.num_round == 3) {
           
           for(var j = 0; j < jogadores.length; j++) {
           
             if(data.meu_id == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_ofertado(data, id_jogador, partida);
             }

             if(data.id_adversario == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_oferta(data, id_jogador, partida); 
             }

           }

           if(partida.contador_aceite == partida.num_jogadores) {
                finalizar_round(data, partida);  
           }

        }

        if(data.num_round == 4) {
           
           for(var j = 0; j < jogadores.length; j++) {
           
             if(data.meu_id == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_ofertado(data, id_jogador, partida);
             }

             if(data.id_adversario == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_oferta(data, id_jogador, partida); 
             }

           }

           if(partida.contador_aceite == partida.num_jogadores) {
              finalizar_round(data, partida);  
           }

        }

        if(data.num_round == 5) {
           
           for(var j = 0; j < jogadores.length; j++) {
           
             if(data.meu_id == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_ofertado(data, id_jogador, partida);
             }

             if(data.id_adversario == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_oferta(data, id_jogador, partida); 
             }  

           }

           if(partida.contador_aceite == partida.num_jogadores) {
              finalizar_round(data, partida);  
           }

        }

        if(data.num_round == 6) {
           
           for(var j = 0; j < jogadores.length; j++) {
           
             if(data.meu_id == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_ofertado(data, id_jogador, partida);
             }

             if(data.id_adversario == jogadores[j].usuario._id) {
               var id_jogador = jogadores[j]._id;
               salvar_valor_oferta(data, id_jogador, partida); 
             }

           }
          
           if(partida.contador_aceite == partida.num_jogadores) {
              
              if(partida.num_rodadas == 1 && partida.status != 'Finalizada') {
                 fim_de_jogo(data, partida);
              }

              if(partida.num_rodadas == 2) {
                if(partida.rodadas.length < 2) {

                   id_partida = partida._id;
                   
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
                                                     

                   setTimeout(function() {
                        partida.rodadas.push(nova_rodada);
                        partida.contador_aceite = 0;
                                                                       
                        partida.save(function() {
                          //console.log(partida.rodadas);  
                          var id_rodada = null;
                          var id_partida = partida._id;
                          
                          id_rodada = partida.rodadas[partida.rodadas.length-1]._id;
                             
                          var data = {
                                  nova_rodada: nova_rodada,
                                  id_partida: id_partida,
                                  id_rodada: id_rodada,
                                  num_round: 6,
                              };
                                                                             
                         
                          //estado painel////////////////////////////////////////////////////////////
                          socket.emit('salvar_flag_round1', data);
                          socket.broadcast.emit('salvar_flag_round1', data);                           
                          //estado painel////////////////////////////////////////////////////////////
                        });
                   }, 1500);   


                } else {
                  if (partida.status != 'Finalizada') {
                     fim_de_jogo(data, partida);
                  }
                }
              }///


              if(partida.num_rodadas == 3) {
                if(partida.rodadas.length < 3) {

                   id_partida = partida._id;
                   
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
                                                     

                   setTimeout(function() {
                        partida.rodadas.push(nova_rodada);
                        partida.contador_aceite = 0;

                        partida.save(function() {
                         // console.log(partida.rodadas);  
                          var id_rodada = null;
                          var id_partida = partida._id;
                          
                          id_rodada = partida.rodadas[partida.rodadas.length-1]._id;
                             
                          var data = {
                                  nova_rodada: nova_rodada,
                                  id_partida: id_partida,
                                  id_rodada: id_rodada,
                                  num_round: 6,
                              };
                                                                             
                         
                          socket.emit('salvar_flag_round1', data);
                          socket.broadcast.emit('salvar_flag_round1', data);                           
                        });
                   }, 1500);   


                } else {
                   if (partida.status != 'Finalizada') {
                     fim_de_jogo(data, partida);
                  }
                }
              }///


              if(partida.num_rodadas == 4) {
                if(partida.rodadas.length < 4) {

                   id_partida = partida._id;
                   
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
                                                     

                   setTimeout(function() {
                        partida.rodadas.push(nova_rodada);
                        partida.contador_aceite = 0;
                                                                       
                        partida.save(function() {
                          //console.log(partida.rodadas);  
                          var id_rodada = null;
                          var id_partida = partida._id;
                          
                          id_rodada = partida.rodadas[partida.rodadas.length-1]._id;
                             
                          var data = {
                                  nova_rodada: nova_rodada,
                                  id_partida: id_partida,
                                  id_rodada: id_rodada,
                                  num_round: 6,
                              };
                                                                             
                         
                          socket.emit('salvar_flag_round1', data);
                          socket.broadcast.emit('salvar_flag_round1', data);                           

                        });
                   }, 1500);   


                } else {
                   if (partida.status != 'Finalizada') {
                     fim_de_jogo(data, partida);
                  }
                }
              }///

             if(partida.num_rodadas == 5) {
                if(partida.rodadas.length < 5) {

                   id_partida = partida._id;
                   
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
                                                     

                   setTimeout(function() {
                        partida.rodadas.push(nova_rodada);
                        partida.contador_aceite = 0;
                                                                       
                        partida.save(function() {
                          //console.log(partida.rodadas);  
                          var id_rodada = null;
                          var id_partida = partida._id;
                          
                          id_rodada = partida.rodadas[partida.rodadas.length-1]._id;
                             
                          var data = {
                                  nova_rodada: nova_rodada,
                                  id_partida: id_partida,
                                  id_rodada: id_rodada,
                                  num_round: 6,
                              };
                                                                             
                         
                          socket.emit('salvar_flag_round1', data);
                          socket.broadcast.emit('salvar_flag_round1', data);                           

                        });
                   }, 1500);   


                } else {
                   if (partida.status != 'Finalizada') {
                     fim_de_jogo(data, partida);
                  }
                }
              }///


               if(partida.num_rodadas == 6) {
                if(partida.rodadas.length < 6) {

                   id_partida = partida._id;
                   
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
                                                     

                   setTimeout(function() {
                        partida.rodadas.push(nova_rodada);
                        partida.contador_aceite = 0;
                                                                       
                        partida.save(function() {
                          //console.log(partida.rodadas);  
                          var id_rodada = null;
                          var id_partida = partida._id;
                          
                          id_rodada = partida.rodadas[partida.rodadas.length-1]._id;
                             
                          var data = {
                                  nova_rodada: nova_rodada,
                                  id_partida: id_partida,
                                  id_rodada: id_rodada,
                                  num_round: 6,
                              };
                                                                             
                         
                          socket.emit('salvar_flag_round1', data);
                          socket.broadcast.emit('salvar_flag_round1', data);                           
                        });
                   }, 1500);   


                } else {
                   if (partida.status != 'Finalizada') {
                     fim_de_jogo(data, partida);
                  }
                }
              }///


           }  
           
        }

      } else {
        console.log(err);
      }
    });      
  }, 1500); 
};





var salvar_valor_ofertado = function(data, id_jogador, partida) {
 
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
                                                                                               
    partida.save();

  } else {
    console.log(err);
  }

 });

};





var salvar_valor_oferta = function(data, id_jogador, partida) {
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
       jogador.pontuacao_max = Number(jogador.pontuacao_max + vr_parcial);
     } 

                                            
     jogador.ofertas_realizadas.push(oferta);

     jogador.save();
                                            
     partida.save();
  
   } else {
     console.log(err);
   }

  });
};




var finalizar_round = function(data, partida) {
    
    partida.contador_aceite = 0;

    partida.save(function() {
      
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
      
      socket.emit('salvar_bt_novo_round_show');
      socket.broadcast.emit('salvar_bt_novo_round_show');

    });

};




var fim_de_jogo = function(data, partida) {
   
   var id_partida = partida._id;

   var final_data = {
          id_partida: id_partida, 
          msg: 'Partida finalizada!',
          msg2: 'Obrigado por participar!'
       }

   usuario.id_partida = null;                                                       
   socket.emit('fim_de_jogo', final_data);
   socket.broadcast.emit('fim_de_jogo', final_data);
   socket.emit('salvar_percentual_ganho', id_partida);
   socket.broadcast.emit('salvar_percentual_ganho', id_partida);
   finalizar_partida(id_partida);
};
//////////////////////////////////////////////////////// salvar aceites



    //jogo//////////////////////////////////////////////////////////////////////
    socket.on('save_percent', function(id_jogador) {
        salvar_percentual_ganho(id_jogador);
    });
    //jogo//////////////////////////////////////////////////////////////////////




     //persuasao//////////////////////////////////////////////////////////////////////
       socket.on('salvar_persuasoes_padrao', function(data) {
          var id_partida = data.id_partida;
          Partida.findById(id_partida).exec(function(err, partida) {
              if (err) {
                console.log(err);
              } else {
                partida.persuasoes_padrao = data.configuracoes;
                partida.reciprocidade_pergunta1 = false;
                partida.coerencia_pergunta1 = false;
                partida.coerencia_pergunta2 = false;
                partida.ap_soacial_pergunta = false;
                partida.afinidade_pergunta1 = false;
                partida.afinidade_pergunta2 = false;
                partida.afinidade_pergunta3 = false;
                partida.save();
              }
          });
       });

        

       socket.on('salvar_reciprocidade_pergunta1_sim', function(id_partida) {
            var query = id_partida;
            Partida.findById(query).exec(function(err, partida) {
              if(err) {
                 console.log(err);
              } else {
                   console.log('ioupy');
                   partida.reciprocidade_pergunta1 = true;
                   partida.save();
              }
            });  
       });  




       socket.on('salvar_reciprocidade_pergunta1_nao', function(id_partida) {
            var query = id_partida;

            Partida.findById(query).exec(function(err, partida) {
              if(err) {
                 console.log(err);
              } else {   
                partida.reciprocidade_pergunta1 = true;
                partida.save();
              }
            });  
       });


       socket.on('salvar_reciprocidade_ok', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
            if(err) {
               console.log(err);
            } else {
                                           
               var resultado = {
                        id_partida: data.id_partida,
                        id_jogador: data.id_jogador,
                        num_rodada: data.num_rodada,
                        num_round: data.num_round,
                        tipo: 'reciprocidade',
                        nome_jogador: data.nome_jogador,
                        success: true,
                        status: 'aceitou após manipulador baixar oferta',
                        realizado: true
                   };
                      
               var id_resultados = partida.id_resultados;

               Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                 if(err) {
                   console.log(err);
                 } else {
                    resultados.reciprocidade_resultado.push(resultado);
                    resultados.save();
                   } 
               });
                                 
            }
          });

       });


       socket.on('salvar_reciprocidade_no', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
            if(err) {
               console.log(err);
            } else {
                           
               var resultado = {
                    id_partida: data.id_partida,
                    id_jogador: data.id_jogador,
                    num_rodada: data.num_rodada,
                    num_round: data.num_round,
                    tipo: 'reciprocidade',
                    nome_jogador: data.nome_jogador,
                    success: false,
                    status: 'não aceitou após manipulador baixar oferta',
                    realizado: true
                   };

                var id_resultados = partida.id_resultados;

                  Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                    if(err) {
                      console.log(err);
                    } else {
                      resultados.reciprocidade_resultado.push(resultado);
                      resultados.save();
                    } 
                  });
            }
          });

       });  


       socket.on('salvar_coerencia_1', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
              if(partida) {
               
                 var resultado = {
                      id_partida: data.id_partida,
                      id_jogador: data.id_jogador,
                      num_rodada1: data.num_rodada,
                      num_round1: data.num_round,
                      num_rodada2: null,
                      num_round2: null,
                      tipo: 'coerencia',
                      nome_jogador_manipulado: data.nome_jogador,
                      resposta_quiz1: data.resposta,
                      resposta_quiz2:null,
                      success: null,
                      status: null
                    };
                       

                      var id_resultados = partida.id_resultados;
                      
                      partida.coerencia_pergunta1 = true;

                      partida.save();

                      Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                         if(err) {
                           console.log(err);
                         } else {
                           resultados.coerencia_resultado.push(resultado);
                           resultados.save();
                         } 
                      });

              } else {
                 console.log(err);
              }
          });

       });


       socket.on('salvar_coerencia_2', function(data) {
          var query = data.id_partida;
          var id_jogador_deduzir = data.id_jogador_deduzir;

          Partida.findById(query).exec(function(err, partida) {
              if(partida) {
      
                var id_resultados = partida.id_resultados;

                partida.coerencia_pergunta2 = true;

                partida.save();
                      
                Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                  if(err) {
                   console.log(err);
                  } else {
                  var rC = resultados.coerencia_resultado;
                    for(var i = 0; i < rC.length; i++) {
                      if(data.id_jogador == rC[i].id_jogador) {
                          
                        if(rC[i].resposta_quiz1 == 'individualista' &&
                           data.resposta2 == 'aceito') {
                           
                           var success = false;
                           var status = 'Jogador manipulado é individualista mas aceitou doar 15% dos seus ganhos';
                           deduzir_quinze_por_cento(id_jogador_deduzir); 
                        }

                        if(rC[i].resposta_quiz1 == 'individualista' &&
                           data.resposta2 == 'nao_aceito') {
                            
                           var success = false;
                           var status = 'Jogador manipulado é individualista e negou doar 15% dos seus ganhos'; 

                        }

                        if(rC[i].resposta_quiz1 == 'cooperativo' &&
                           data.resposta2 == 'aceito') {
                           
                           var success = true;
                           var status = 'Jogador manipulado é cooperativo e aceitou doar 15% dos seus ganhos';
                           deduzir_quinze_por_cento(id_jogador_deduzir);
                        }

                        if(rC[i].resposta_quiz1 == 'cooperativo' &&
                           data.resposta2 == 'nao_aceito') {
                           
                           var success = false;
                           var status = 'Jogador manipulado é cooperativo mas negou doar 15% dos seus ganhos';

                        }                           
                        //console.log(rC[i]);   
                        var resultado = {
                             id_partida: rC[i].id_partida,
                             id_jogador: rC[i].id_jogador,
                             num_rodada1: rC[i].num_rodada1,
                             num_round1: rC[i].num_round1,
                             num_rodada2: data.num_rodada2,
                             num_round2: data.num_round2,
                             tipo: rC[i].tipo,
                             nome_jogador_manipulado: rC[i].nome_jogador,
                             resposta_quiz1: rC[i].resposta_quiz1,
                             resposta_quiz2: data.resposta2,
                             success: success,
                             status: status
                        };   
                        resultados.coerencia_resultado[i] = resultado;
                        resultados.save();   
                      }
                    }
                    
                  } 
                });

              } else {
                 console.log(err);
              }
          });

       });
 



       socket.on('salvar_ap_social', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
              if(partida) {

               var id_resultados = partida.id_resultados;
               partida.ap_social_pergunta = true;
               partida.save();

               Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                  if(err) {
                    console.log(err);
                  } else {

                  var aux_success = '';
                  var aux_status = '';

                  if(data.resposta == 'sim') {
                     aux_success = true;
                     aux_status = 'Jogador aceitou a oferta para doar parte de sua pontuação para um suposto' + 
                     'sorteio mediante a a informação de que a maioria havia aceitado';
                  }


                  if(data.resposta == 'nao') {
                     aux_success = false;
                     aux_status = 'Jogador nao aceitou a oferta para doar parte de sua pontuação para um suposto ' + 
                     'sorteio mediante a informação de que a maioria havia aceitado';
                  }

                      var resultado = {
                        id_partida: data.id_partida,
                        nome_jogador_manipulado: data.nome_jogador_manipulado,
                        resposta_ap_social: data.resposta,
                        tipo: 'afinidade',
                        success: aux_success,
                        status: aux_status
                      };

                    resultados.aprovacao_social_resultado.push(resultado);
                    resultados.save();

                  } 
               });

              } else {
                 console.log(err);
              }
          });

       });


       socket.on('salvar_opcao_afinidade1', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
              if(partida) {

                 var resultado = {
                      id_partida: data.id_partida,
                      nome_jogador_manipulado: data.nome_jogador_manipulado,
                      resposta_afinidade: null,
                      resposta_controle1: null,
                      resposta_controle2: data.resposta_controle2,
                      tipo: 'afinidade',
                      success: null,
                      status: null
                    };

                      var id_resultados = partida.id_resultados;
                      partida.afinidade_pergunta1 = true;
                      partida.save();

                      Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                         if(err) {
                           console.log(err);
                         } else {

                           resultados.afinidade_resultado.push(resultado);
                           resultados.save();
                         } 
                      });

              } else {
                 console.log(err);
              }
          });          
       });
       

       socket.on('salvar_opcao_afinidade2', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
              if(partida) {

               var id_resultados = partida.id_resultados;
               partida.afinidade_pergunta2 = true;
               partida.save();

               Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                  if(err) {
                    console.log(err);
                  } else {

                    for(var i = 0; i < resultados.afinidade_resultado.length; i++) {
                     //  console.log('erroooooooooooooooooooooooooooooooooooooooooo');
                       if(resultados.afinidade_resultado[i].id_partida == data.id_partida) {
                         console.log('err');
                         var resultado = {
                              id_partida: resultados.afinidade_resultado[i].id_partida,
                              nome_jogador_manipulado: resultados.afinidade_resultado[i].nome_jogador_manipulado,
                              resposta_afinidade: null,
                              resposta_controle1: data.resposta_controle1,
                              resposta_controle2: resultados.afinidade_resultado[i].resposta_controle2,
                              tipo: 'afinidade',
                              success: null,
                              status: null
                            };

                         resultados.afinidade_resultado[i] = resultado;
                         resultados.save();
                       }
                    }

                  } 
               });

              } else {
                 console.log(err);
              }
          });          
       });


       socket.on('salvar_opcao_afinidade3', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
              if(partida) {

               var id_resultados = partida.id_resultados;
               partida.afinidade_pergunta3 = true;
               partida.save();
               
               Persuasoes_Padrao_Resultados.findById(id_resultados).exec(function(err, resultados) {
                  if(err) {
                    console.log(err);
                  } else {

                    for(var i = 0; i < resultados.afinidade_resultado.length; i++) {
                     //  console.log('erroooooooooooooooooooooooooooooooooooooooooo');
                       if(resultados.afinidade_resultado[i].id_partida == data.id_partida) {
                         var aux_success = '';
                         var aux_status = '';
                         if(data.resposta_afinidade == 'sim' &&
                            resultados.afinidade_resultado[i].resposta_controle1 == 'nao' &&
                              resultados.afinidade_resultado[i].resposta_controle2 == 'nao') {
                                aux_success = true;
                                aux_status = 'Jogador manipulado aceitou proposta da afinidade e recusou ofertas do' +
                                'controle 1 e controle 2';

                         } else {
                             aux_success = false;
                             aux_status = 'Método afinidade falhou';
                         }


                         var resultado = {
                              id_partida: resultados.afinidade_resultado[i].id_partida,
                              nome_jogador_manipulado: resultados.afinidade_resultado[i].nome_jogador_manipulado,
                              resposta_afinidade: data.resposta_afinidade,
                              resposta_controle1: resultados.afinidade_resultado[i].resposta_controle1,
                              resposta_controle2: resultados.afinidade_resultado[i].resposta_controle2,
                              tipo: 'afinidade',
                              success: aux_success,
                              status: aux_status
                            };

                         resultados.afinidade_resultado[i] = resultado;
                         resultados.save();
                       }
                    }

                  } 
               });

              } else {
                 console.log(err);
              }
          });          
       });

     //persuasao//////////////////////////////////////////////////////////////////////
  




//chat perfil
socket.on('buscar_chat', function(data) {
     
    var data_ = {
         flag: false,
         id_outro: data.id_outro,
         data_chat: null   
    };

    Usuario.findById(data.meu_id).exec(function(err, usuario) {
       if (usuario) {
        var length = usuario.ids_de_chats_salvos.length;
        
         console.log('1');
        
          for(var i = 0; i < length; i++) {
             
             var id_chat = usuario.ids_de_chats_salvos[i];
             
             Chat.findById(id_chat).exec(function(err, chat) {
                if(chat) {
                   
                   if(data.meu_id == chat.id_emissor && data.id_outro == chat.id_receptor) {
                    
                    var messages = "";
                                        
                     for(var m = 0; m < chat.historico.length; m++) {
                        messages += chat.historico[m].msg+'ص';
                     }

                      data_.flag = true;
                      data_.data_chat = messages;

                   }

                } else {
                  console.log(err);
                }
             });
              
          }

          setTimeout(function() {
             socket.emit('historico_chat', data_);
          }, 2000);


       } else {
        console.log(err);
       }
    });
});



socket.on('buscar_chat2', function(data) {
     
    var data_ = {
         flag: false,
         data_chat: null   
    };

    Usuario.findById(data.meu_id).exec(function(err, usuario) {
       if (usuario) {
        var length = usuario.ids_de_chats_salvos.length;
        
          for(var i = 0; i < length; i++) {
             
             var id_chat = usuario.ids_de_chats_salvos[i];
             
             Chat.findById(id_chat).exec(function(err, chat) {
                if(chat) {
                   
                   if(data.meu_id == chat.id_emissor && data.id_outro == chat.id_receptor) {
                                
                    var messages = "";
                                        
                     for(var m = 0; m < chat.historico.length; m++) {
                        messages += chat.historico[m].msg+'ص';
                     }

                      data_.flag = true;
                      data_.data_chat = messages;

                   }

                   setTimeout(function() {
                      socket.emit('historico_chat2', data_);
                   }, 2000);

                } else {
                  console.log(err);
                }
             });
              
          }

       } else {
        console.log(err);
       }
    });
});




 socket.on('send-server-perfil', function(data) {
   
   var id_emissor = data.meu_id_painel_adversario;
   var id_receptor = data.id_destinatario; 
   var chat_existe_emissor = false;
   var chat_existe_receptor = false;

   var message = "<li id="+"'del'" +"class="+"'left clearfix'"+"><span class="+
                       "'chat-img pull-left'"+">"+
                 "<div class="+"'chat-body clearfix'"+">"+
                   "<div class="+"'header'"+">"+
                    "<strong class="+"'primary-font'"+">"+data.nome+"</strong>"+
                     "<small class="+"'pull-left text-muted'"+">"+
                   "</div>"+
                     "<p>"+"<strong>"+data.msg+"</strong>"+"</p>"+
                  "</div>"+
                 "</li>";

    Usuario.findById(id_emissor).exec(function(err, usuario) {
      if(usuario) {
        
        var length = usuario.ids_de_chats_salvos.length;
        
          for(var i = 0; i < length; i++) {
             
             var id_chat = usuario.ids_de_chats_salvos[i];
             
             Chat.findById(id_chat).exec(function(err, chat) {
                if(chat) {
                  
                 if(chat.id_emissor == id_emissor && chat.id_receptor == id_receptor) {
                  
                  chat_existe_emissor = true;

                  
                  var msg =  "<li id="+"'del'" +"class="+"'right clearfix'"+"><span class="+"'chat-img pull-right'"+"style="+"'position:'"+"'right'"+"';'"+">"+
                      "<div class="+"'chat-body clearfix'"+">"+
                       "<div class="+"'header'"+">"+
                        "<strong class="+"'primary-font'"+">"+data.nome+"</strong>"+
                         "<small class="+"'pull-right text-muted'"+">"+
                       "</div>"+
                         "<p id="+"'texto_chat'"+">"+"<strong>"+data.msg+"</strong>"+"</p>"+
                      "</div>"+''
                     "</li>";
                  
                  var message_emissor = {
                       data: new Date(),
                       msg: msg
                  };

                  chat.qtde_msg_env++;


                   chat.historico.push(message_emissor);
                   chat.save();

                 }
                 
                } else {
                  console.log(err);
                }
             });
          }

      } else {
        console.log(err);
      }
    }); 

  //verificar se existe historico em caso exista busar e incrementar msg nova
  //caso nao criar historico inserir primeira msg
  
  Usuario.findById(id_receptor).exec(function(err, usuario) {
       
      if(usuario) {
        
        var length = usuario.ids_de_chats_salvos.length;
        
        var data_ = {
             flag: false,
             data_chat: null   
        };  
          

          for(var i = 0; i < length; i++) {
             
             var id_chat = usuario.ids_de_chats_salvos[i];
             
             Chat.findById(id_chat).exec(function(err, chat) {
                if(chat) {
                  
              if(chat.id_emissor == id_receptor && chat.id_receptor == id_emissor) {
                  // console.log('2');
                  
               chat_existe_receptor = true;
               


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


               var message_receptor = {
                            data: new Date(),
                            msg: msg
               };

                chat.qtde_msg_rec++;


                chat.historico.push(message_receptor);
                chat.save();
                message = ""; 
                for(var m = 0; m < chat.historico.length; m++) {
                      message += chat.historico[m];
                   }
               }
                 
                } else {
                  console.log(err);
                }
             });
          }

      } else {
        console.log(err);
      }
    });

    setTimeout(function() {
       if(chat_existe_emissor == false) {        
                 
                 var msg =  "<li id="+"'del'" +"class="+"'right clearfix'"+"><span class="+"'chat-img pull-right'"+"style="+"'position:'"+"'right'"+"';'"+">"+
                     "<div class="+"'chat-body clearfix'"+">"+
                      "<div class="+"'header'"+">"+
                       "<strong class="+"'primary-font'"+">"+data.nome+"</strong>"+
                        "<small class="+"'pull-right text-muted'"+">"+
                      "</div>"+
                        "<p id="+"'texto_chat'"+">"+"<strong>"+data.msg+"</strong>"+"</p>"+
                     "</div>"+''
                    "</li>"; 

                 criar_historico_no_emissor(id_emissor, id_receptor, msg);
       }
    }, 5000);

    setTimeout(function() {
      if(chat_existe_receptor == false) {
          
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

          criar_historico_no_receptor(id_receptor, id_emissor, msg);
      }
    }, 5000);


      var message_ = {
         id_destinatario: data.id_destinatario,
         nome: data.nome,
         meu_id_painel_adversario: data.meu_id_painel_adversario,     
         msg: message
      };


      socket.emit('send-client-perfil', message_);
      socket.broadcast.emit('send-client-perfil', message_);

 });







 var criar_historico_no_emissor = function(id_emissor, id_receptor, msg) {
  
  var historico = [];

  var message = {
      data: new Date(),
      msg: msg
  };

  historico.push(message);
  
  var chat = new Chat({
            id_emissor: id_emissor,
            id_receptor: id_receptor,
            historico: historico,
            qtde_msg_env: 1,
            qtde_msg_rec: 0 
  });
  
  Chat.create(chat, function(err, chat) {
    if (err) {
      console.log(err);
    } else {
      Usuario.findById(id_emissor).exec(function(err, usuario) {
        if(usuario) {
           usuario.ids_de_chats_salvos.push(chat._id);
           usuario.save();  
        } else {
          console.log(err);
        }
      });
    }
  });

 };


var criar_historico_no_receptor = function(id_receptor, id_emissor, msg) {

  var historico = [];

  var message = {
      data: new Date(),
      msg: msg
  };

  historico.push(message);


  var chat = new Chat({
            id_emissor: id_receptor,
            id_receptor: id_emissor,
            historico: historico,
            qtde_msg_env: 0,
            qtde_msg_rec: 1
  });
  
  Chat.create(chat, function(err, chat) {
    if (err) {
      console.log(err);
    } else {
      Usuario.findById(id_receptor).exec(function(err, usuario) {
        if(usuario) {
           usuario.ids_de_chats_salvos.push(chat._id);
           usuario.save();  
        } else {
          console.log(err);
        }
      });
    }
  });

 };
//chat perfil



socket.on('pesquisar_perfil', function(nome) {
    Usuario.find().exec(function(err, usuarios) {
      if(usuarios) {
        var users = [];
       
        for (var i = 0; i < usuarios.length; i++) {
          if(usuarios[i].nome == nome) {
           var data = { 
               nome: usuarios[i].nome+' '+usuarios[i].sobrenome,
               id_usuario: usuarios[i]._id            
           }; 
           
            users.push(data);

          }
        }

        socket.emit('retorno_perfil_pesquisado', users);
      } else {
        console.log(err);
      }
    });
});


});
//socket.io








//chatbot
/*let MessagingHub = require('messaginghub-client');
let WebSocketTransport = require('lime-transport-websocket');
let Lime = require('lime-js');

let client = new MessagingHub.ClientBuilder()
    .withIdentifier('nodesampleultimatum')
    .withAccessKey('WXJDV2s0ekFEUHhHeHIwWnVmUHQ=')
    .withTransportFactory(() => new WebSocketTransport())
    .build();


client.addMessageReceiver(function (message) {
  
  var session = expressSession.Cookie();
  console.log(session);


  return message.content == 'Olá' || message.content == 'olá' || message.content == 'Ola' || message.content == 'ola'
  || message.content == 'Oi' || message.content == 'oi' || message.content == 'Hello' || message.content == 'hello'
  || message.content == 'Oie' || message.content == 'oie';
}, function(message) {
   // send a "received" notification to some user
   var resposta = "Olá!";
   var msg = { type: "text/plain", content: resposta, to: message.from, id: Lime.Guid() };
   client.sendNotification(msg);
});


      

client.connect()
    .then(function (session) {
        console.log('Connectado');
    })
    .catch(function (err) {
        console.log(err);
    });*/
//chatbot


//initialize server
server.listen(process.env.PORT || 5000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});


module.exports = server;