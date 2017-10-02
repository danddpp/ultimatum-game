var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Sala = {
   id_sala: String,	
   curso: String,
   modulo: String,
   capacidadeSala: Number
};



var Round = {
  numero: Number,
  qtdeTotalJogadas: Number,
  qtdeAtualJogadas: Number,
  count_change_round: Number
}


var Rodada = {
    numero_rodada: Number,
    rounds: [Round],
};


var Partida = new Schema({
	id_dono: String,
	data: Date,
	status: String,
  num_rodadas: Number,
	tipo_sala: Sala,
	num_jogadores: Number,
  jogadores: Array,
  rodadas: [Rodada],
  persuasoes_padrao: Array,
  contador_iniciar_partida: Number,
  iniciada: Boolean,
  num_rodada_atual: Number,
  num_round_atual: Number,
  indice_valor: Number,
  versao: Number,
  contador_aceite: Number,
  contador_prox_round: Number
});



Partida.methods.incrementarAceite = function aceite(versao_atual) {
    
    if(this.versao == versao_atual) {
      
      this.versao++;
      
      if(this.contador_aceite < this.num_jogadores) {
         this.contador_aceite++;
      }
      
      this.save();
      
      return true;
    
    } else {
      
      return  false;
    }
};



Partida.methods.incrementarContadorCarregarJogadores = function next(versao_atual) {
    
    if(this.versao == versao_atual) {
      
      this.versao++;
      
      if(this.contador_prox_round < this.num_jogadores) {
         this.contador_prox_round++;
      }
      
      this.save();
      
      return true;
    
    } else {
      
      return  false;
    }
};



Partida.methods.salvar_entrada = function save(partida, jogador, versao_atual) {
      
      if(this.versao == versao_atual) {
         
         this.versao++;
         this.num_jogadores++;
         this.jogadores.push(jogador);
         
         if(this.num_jogadores == this.tipo_sala.capacidadeSala) {

          this.iniciada = true;
         
         }

         partida.save();
              
              data = {
                 save: true,
                 versao_atual: null,
                 num_jogadores: this.num_jogadores
              };

              return data;

      } else {
      
         data = {
            save: false,
            versao_atual: this.versao,
            num_jogadores: null
         };
      
        return data;
      }
      
};

module.exports = mongoose.model('Partida', Partida);