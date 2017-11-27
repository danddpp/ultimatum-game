var Jogador = require('.././models/Jogador'); 
var atualizar_desempenho = require('./atualizar_desempenho');

module.exports = function(id_jogador) {
    
  var query = id_jogador;
  
 Jogador.findById(query).exec(function(err, jogador) {
   if(jogador) {
    
       var vr_total_ofertas_receb = 0;
       var vr_total_ofertas_receb_aceitas = 0;
       var vr_total_ofertas_env = 0;
       var subtotal_ofertas_env_aceitas = 0;
       var aux_a = 0;
       var aux_b = 0;
       var subtotal = 0;
       var ganho_possivel = 0;
       var ganho_obtido = 0;
       var percentual_ganho = 0;
       

       for(var j = 0; j < jogador.ofertas_recebidas.length; j++) {
        vr_total_ofertas_receb += Number
                               (jogador.ofertas_recebidas[j].ofertaRecebida);
        if(jogador.ofertas_recebidas[j].aceitei == 'sim') {
         vr_total_ofertas_receb_aceitas += Number
                               (jogador.ofertas_recebidas[j].ofertaRecebida);
        }
       }

       for(var k = 0; k < jogador.ofertas_realizadas.length; k++) {
         aux_a = Number(jogador.ofertas_realizadas[k].vrTotal);
         aux_b = Number(jogador.ofertas_realizadas[k].ofertaEnviada);
         subtotal = Number(aux_a - aux_b);

         vr_total_ofertas_env += subtotal;

         if(jogador.ofertas_realizadas[k].aceitou == 'sim') {
           subtotal_ofertas_env_aceitas += Number(subtotal);
         }
       }
        
        ganho_possivel =  vr_total_ofertas_receb + 
                              vr_total_ofertas_env;

        ganho_obtido = vr_total_ofertas_receb_aceitas + subtotal_ofertas_env_aceitas;
        
        percentual_ganho = Number((ganho_obtido*100)/ganho_possivel);
        
        jogador.percentual_ganho = percentual_ganho.toFixed(2);
        
        jogador.save().then(function() {
            
            Jogador.findById(query).exec(function(err, jogador) {
              if (jogador) {
                atualizar_desempenho(jogador);
              }
            });

        });
        

   } else {
     console.log(err);
   }
 });

}