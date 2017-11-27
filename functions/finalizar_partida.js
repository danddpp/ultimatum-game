var Partida = require('.././models/Partida');

module.exports = function(id_partida) {
    
  var query = id_partida;
  
  Partida.findById(query).exec(function(err, partida) {
     if (partida) {
         partida.status = 'Finalizada';
         partida.save();
     } else {
          console.log(err);
     }
   });    
 
};


