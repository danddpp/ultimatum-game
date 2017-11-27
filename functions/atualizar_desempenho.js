var Partida = require('.././models/Partida');
var Usuario = require('.././models/Usuario');
var Jogador = require('.././models/Jogador');
//var ordenar_por_percentual = require('./ordenar_por_percentual');


module.exports = function(jogador) {
  setTimeout(function() {

   var id_partida = jogador.id_partida;

   Jogador.find().where('id_partida').equals(id_partida).exec(function(err, jogadores) {
      if(jogadores) {
        var percentuais = [];

          for(var i = 0; i < jogadores.length; i++) {
             percentuais.push(jogadores[i].percentual_ganho);
          }


       var percentual_vencedor = percentuais[0];
       
       for(var j = 0; j < percentuais.length; j++) {
          if(percentuais[j] > percentual_vencedor) {
               percentual_vencedor = percentuais[j];
          }
       }

       var percentual = jogador.percentual_ganho;
       var id_usuario = jogador.usuario._id;

       Usuario.findById(id_usuario).exec(function(err, usuario) {
           if(usuario) {
              
              if(percentual == percentual_vencedor) {
                usuario.desempenho_geral.numero_de_vitorias++;                  	
              }
               
              usuario.desempenho_geral.num_de_partidas++;
              usuario.desempenho_geral.pontuacao_geral += jogador.pontuacao_max;
              
              if(usuario.desempenho_geral.num_de_partidas != 0) {
                if(usuario.desempenho_geral.num_de_partidas % 5 == 0) {
                  usuario.desempenho_geral.nivel_de_experiencia++;
                    if(usuario.desempenho_geral.nivel_de_experiencia % 15 == 0) {
                      //usuario ganha benefício
                    }                           
                }	
              }
              
              if(usuario.desempenho_geral.nivel_de_experiencia <= 1) {
                 usuario.nivel_perfil = 'Filhote de gafanhoto nível 0';
              }


              if(usuario.desempenho_geral.nivel_de_experiencia > 1 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 2) {
                 usuario.nivel_perfil = 'Filhote de gafanhoto nivel 1';
              }

              
              if(usuario.desempenho_geral.nivel_de_experiencia > 2 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <=3) {
                 usuario.nivel_perfil = 'Filhote de gafanhoto nivel 2';
              }


              if(usuario.desempenho_geral.nivel_de_experiencia > 3 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 4) {
                 usuario.nivel_perfil = 'Filhote de gafanhoto nivel 3';
              }

              
              if(usuario.desempenho_geral.nivel_de_experiencia > 4 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 6) {
                 usuario.nivel_perfil = 'Gafanhoto nivel 1';
              }

              if(usuario.desempenho_geral.nivel_de_experiencia > 6 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 8) {
                 usuario.nivel_perfil = 'Gafanhoto nivel 2';
              }

              if(usuario.desempenho_geral.nivel_de_experiencia > 8 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 15) {
                 usuario.nivel_perfil = 'Mestre';
              }

              if(usuario.desempenho_geral.nivel_de_experiencia > 15 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 25) {
                 usuario.nivel_perfil = 'Mestre	 nível 1';
              }

              if(usuario.desempenho_geral.nivel_de_experiencia > 25 &&
              	  usuario.desempenho_geral.nivel_de_experiencia <= 35) {
                 usuario.nivel_perfil = 'Mestre nível 3';
              }

              if(usuario.desempenho_geral.nivel_de_experiencia > 35) {
                 usuario.nivel_perfil = 'Nível Chuck Norris';
              } 

              
              usuario.save();

           } else {
           	console.log(err);
           }  
       }); 
 
          

      } else {
      	console.log(err);
      }
   });
               
   }, 20000);    
};
