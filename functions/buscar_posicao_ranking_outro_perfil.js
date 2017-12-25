var Usuario = require('.././models/Usuario');

module.exports = function(req, res, temp_, id_perfil_a_visitar) {
 
  var id_usuario = temp_.meu_id;

  Usuario.find().exec(function(err, usuarios) {
     if (usuarios) {
         
        for(var i = 0; i < usuarios.length-1; i++) {
            for(var j = i+1; j < usuarios.length; j++ ) {
                if(usuarios[j].desempenho_geral.numero_de_vitorias > 
                                        usuarios[j].desempenho_geral.numero_de_vitorias) {
                   var temp = usuarios[j];
                   usuarios[j] = usuarios[i];
                   usuarios[i] = temp;
                }
            }          
        }
           
         var ranking = [];
         for(var k = 0; k < usuarios.length; k++) {
            if(k == 0) {
              var posicao = {
                p_ranking: k+1,
                id_usuario: usuarios[k]._id
              }
              ranking.push(posicao);
            } else {
              
              if(usuarios[k].desempenho_geral.numero_de_vitorias == usuarios[k-1].desempenho_geral.numero_de_vitorias ) {
                 var posicao = {
                     p_ranking: ranking[k-1].p_ranking,
                     id_usuario: usuarios[k]._id
                 }
                 ranking.push(posicao);
              } else {
                var posicao = {
                     p_ranking: ranking[k-1].p_ranking+1,
                     id_usuario: usuarios[k]._id
                 }
                 ranking.push(posicao);
              }

            }
         }
          
         for(var l = 0; l < ranking.length; l++) {
            if(id_perfil_a_visitar == ranking[l].id_usuario) {
               usuario_retorno = ranking[l];
            }
         }

         
         res.render('perfil_usuario/index', { meu_id: temp_.meu_id, 
                                              nome_jogador: temp_.nome_jogador,
                                              nivel_usuario: temp_.nivel_usuario,
                                              nivel_perfil: temp_.nivel_perfil,
                                              foto: temp_.foto,
                                              usuarios: temp_.usuarios,
                                              num_vitorias: temp_.num_vitorias,
                                              posicao_ranking: usuario_retorno.p_ranking,
                                              pontuacao_total: temp_.pontuacao_total,
                                              nome_perfil: temp_.nome_perfil });
      
     } else {
        console.log(err);
     }
   });
};