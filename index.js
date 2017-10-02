const KEY = 'UltimatumGame.sid';
const SECRET = 'UltimatumGame';
var routesHome = require('./routes/home');
var routesLogin = require('./routes/autenticacao');
var routesMenuJogador = require('./routes/menu-jogador');
var routesMenuPartida = require('./routes/menu-partida');
var routesPesquisar = require('./routes/pesquisar');
var routesPersuasao = require('./routes/painel-persuasao');
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
  var sortearValores = require('./functions/sortearValores');
  //config socket.io
  
  var onlines = {};//armazena jogadores online
  //var partida = null;


  var aleatorios_entrar_partida = [];//vetor de numeros alestorios para entrada na partida
  var aleatorios_entrar_partida2 = [];//vetor de numeros alestorios para entrada na partida
  
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

             }, 5000);
          
      }

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
         }, time);
           
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
         }, time);           
        
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
                    
                   if(retorno == true) {
                     salvar_aceite_db(data);
                   } else {
                     tentar_salvar_aceite_novamente(data); 
                   }


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

          if(retorno == true) {
            salvar_aceite_db(data);
          } else {
            tentar_salvar_aceite_novamente(data);
          } 

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
              
              if(partida.num_rodadas == 1) { 
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
                          console.log(partida.rodadas);  
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
                   }, 6000);   


                } else {
                   fim_de_jogo(data, partida);
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
                          console.log(partida.rodadas);  
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
                   }, 6000);   


                } else {
                   fim_de_jogo(data, partida);
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
                          console.log(partida.rodadas);  
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
                   }, 6000);   


                } else {
                   fim_de_jogo(data, partida);
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
                          console.log(partida.rodadas);  
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
                   }, 6000);   


                } else {
                   fim_de_jogo(data, partida);
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
                          console.log(partida.rodadas);  
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
                   }, 6000);   


                } else {
                   fim_de_jogo(data, partida);
                }
              }///


           }  
           
        }

      } else {
        console.log(err);
      }
    });      
  }, 1000); 
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
               var persuasoes_padrao = partida.persuasoes_padrao;

                for(var i = 0; i < persuasoes_padrao.length; i++) {
                   if(persuasoes_padrao[i].tipo == 'Reciprocidade') {
                                                  
                           var resultado = {
                              id_partida: data.id_partida,
                              id_jogador: data.id_jogador,
                              num_rodada: data.num_rodada,
                              num_round: data.num_round,
                              tipo: 'reciprocidade',
                              nome_jogador: data.nome_jogador,
                              success: true,
                              status: 'aceitou após manipulador baixar oferta'
                           };

                           var ppr = new Persuasoes_Padrao_Resultados({
                               resultado: resultado
                           }); 
                           
                           Persuasoes_Padrao_Resultados.create(ppr);
                                 
                   }              
                }
            }
          });

       });


       socket.on('salvar_reciprocidade_no', function(data) {
          var query = data.id_partida;

          Partida.findById(query).exec(function(err, partida) {
            if(err) {
               console.log(err);
            } else {
               var persuasoes_padrao = partida.persuasoes_padrao;

                for(var i = 0; i < persuasoes_padrao.length; i++) {
                   if(persuasoes_padrao[i].tipo == 'Reciprocidade') {
                           
                           var resultado = {
                              id_partida: data.id_partida,
                              id_jogador: data.id_jogador,
                              num_rodada: data.num_rodada,
                              num_round: data.num_round,
                              tipo: 'reciprocidade',
                              nome_jogador: data.nome_jogador,
                              success: false,
                              status: 'não aceitou após manipulador baixar oferta'
                           };

                           var ppr = new Persuasoes_Padrao_Resultados({
                               resultado: resultado
                           }); 
                           
                           Persuasoes_Padrao_Resultados.create(ppr);
                   }              
                }
            }
          });

       });  
     //persuasao//////////////////////////////////////////////////////////////////////

  });
//socket.io



//initialize server
server.listen(process.env.PORT || 5000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});


module.exports = server;