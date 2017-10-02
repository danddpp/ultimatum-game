Partida = require('./../models/Partida');
Jogador =  require('./../models/Jogador');

module.exports = function(req, res, next) {
   if(req.isAuthenticated()) {
      var id_partida = null;
      Jogador.find().exec(function(err, jogadores) {
      	 if(jogadores) {
           console.log('id partida');
           for(var i = 0; i < jogadores.length; i++) {
              if(req.user._id == jogadores[i].usuario._id) {
                id_partida = jogadores[i].id_partida;
                console.log('id part '+id_partida);
              }
           }

           Partida.findById(id_partida).exec(function(err, partida) {
           	   if(partida) {
                 if(partida.iniciada == true && partida.status == 'Em andamento') {
                 	req.user.id_partida = id_partida;
                 	console.log(req.user.id_partida);
                 	res.redirect('/retornar_ao_jogo');
                 } else {
                 	next();
                 }

           	   } else {
           	   	next();
           	   }
           });


      	 } else {
      	 	next();
      	 }
      });
   }
}