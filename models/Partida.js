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
	tipo_sala: Sala,
	num_jogadores: Number,
  jogadores: Array,
  rodadas: [Rodada],
  persuasoes_padrao: Array,
  contador_iniciar_partida: Number,
  num_rodada_atual: Number,
  num_round_atual: Number,
  indice_valor: Number
});




module.exports = mongoose.model('Partida', Partida);