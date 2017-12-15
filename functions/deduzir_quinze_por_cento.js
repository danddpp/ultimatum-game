var Jogador = require('.././models/Jogador');

module.exports = function(id_jogador_deduzir) {
      
  Jogador.findById(id_jogador_deduzir).exec(function(err, jogador) {
     if (Jogador) {
         var pontuacao = jogador.pontuacao_max;
         if(pontuacao > 0) {
           pontuacao = Math.floor((pontuacao * 0.85));
         }
         jogador.pontuacao_max = pontuacao;
         jogador.save();
     } else {
          console.log(err);
     }
   });    
};