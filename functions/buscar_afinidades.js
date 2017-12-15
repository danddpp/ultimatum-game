var Partida = require('.././models/Partida');
var Usuario = require('.././models/Usuario');
var Jogador = require('.././models/Jogador');
var Chat = require('.././models/Chat');

module.exports = function(id_usuario_manipulador, partidas,req, res) {
   var jogadores = buscar_id_partida(id_usuario_manipulador, partidas);
   var temp = [];
   //var usuarios = [];
   var temp2 = [];
   var data = [];

   var response = res;
   var request = req;
   buscar_usuarios(jogadores, temp, request, response);
};


var buscar_id_partida = function(id_usuario_manipulador, partidas) {
    for(var i = 0; i < partidas.length; i++) {
       var jogadores = [];
       jogadores = partidas[i].jogadores;

       for(var j = 0; j < jogadores.length; j++) {
          if(jogadores[j].usuario._id == id_usuario_manipulador) {
          	return jogadores;
          }
       }

    }
};


var buscar_usuarios = function(jogadores, temp, request, response) {
      var request_ = request;
      var response_ = response;
       var x = Usuario.find().exec(function(err, usuarios) {
          if(usuarios) {
             for(var i = 0; i < jogadores.length; i++) {
               for(var j = 0; j < usuarios.length; j++) {
                  if(jogadores[i].usuario._id == usuarios[j]._id) {
                     temp.push(usuarios[j]);            	     	
            	  }
               } 
            }           
              estruturarAfinidades(temp, request_, response_);
          }
        });  
 
};


var estruturarAfinidades = function(usuarios, request_, response_) {
	var request = request_;
	var response = response_;
	Chat.find().exec(function(err, chats) {
       if(chats) {
       var temp2 = [];  
        for(var i = 0; i < usuarios.length; i++) {
          var user = usuarios[i];
          var aux_chats = []; 
          
           for(var j = 0; j < user.ids_de_chats_salvos.length; j++) { 
            var id_chat = user.ids_de_chats_salvos[j];
             for(var k = 0; k < chats.length; k++) {
                 var aux = chats[k]._id.toString();      
                 id_chat = id_chat.toString();
                 if(id_chat == aux) {   
                   console.log('4');
                   aux_chats.push(chats[k]);
                 }

             }
           }

           	var meus_chats = {
                id_usuario: user._id,
                nome: user.nome + ' ' + user.sobrenome,
                chats: aux_chats  
           	};

           	temp2.push(meus_chats);
	    }
	       estruturarAfinidades_2(temp2, request, response);
       }
	});
};


var estruturarAfinidades_2 = function(temp2, request, response) {
     var nome_jogador = request.user.nome;
     var nivel = request.user.nivel;
     var id_ = request.user._id;
     var afinidades = [];
     for(var i = 0; i < temp2.length; i++) {

        var chats_usuario_emissor = temp2[i].chats;
        var id_usuario_emissor = chats_usuario_emissor[0].id_emissor;
           	 for(var k = 0; k < temp2.length; k++) {

                var chats_usuario_receptor = temp2[k].chats;
        
                for(var l = 0; l < chats_usuario_receptor.length; l++) {
                      if(id_usuario_emissor == chats_usuario_receptor[l].id_receptor) {
                      console.log(temp2[i].nome+' enviou '+ chats_usuario_receptor[l].qtde_msg_rec+
                      	                               ' mensagens para '+temp2[k].nome);
                      
                      console.log(temp2[i].nome+' recebeu '+ chats_usuario_receptor[l].qtde_msg_env+
                      	' mensagens de '+temp2[k].nome);
                      console.log('\n');
                        
                        var message = ""; 
                         
                         for(var m = 0; m < chats_usuario_receptor[l].historico.length; m++) {
                               message += chats_usuario_receptor[l].historico[m].msg+'ص';
                         }

                        var afinidade = {
                        	id_chat: chats_usuario_receptor[l]._id,
                        	af1: temp2[i].nome+' enviou '+ chats_usuario_receptor[l].qtde_msg_rec+
                          ' mensagens para '+temp2[k].nome,
                            af2: temp2[i].nome+' recebeu '+ chats_usuario_receptor[l].qtde_msg_env+
                      	  ' mensagens de '+temp2[k].nome,
                      	    messages: message 
                          };
                           afinidades.push(afinidade); 

                      }
                }
           	 
           	 }
           	}      
        
        response.render('painel-persuasoes/afinidades', { nome_jogador: nome_jogador,
                                                          id_usuario: id_, 
                                                          mensagem:'',
                                                          nivel_usuario: nivel,
                                                          afinidades: afinidades
                                                        });

};
   