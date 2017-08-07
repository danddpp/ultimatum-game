var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var persuasao_broadcast = {
    num_rodada_execucao: Number,
    num_round_execucao: Number,
    mensagem: String
}

var persuasao_dirigida = {
    num_rodada_execucao: Number,
    num_round_execucao: Number,
    jogadores_alvo_id: [String],
    mensagem: String
}


var Persuasoes_Personalizadas = new Schema({
	id_partida: String,
  rodada_atual: Number,
  round_atual: Number,
	persuasoes_broadcast: [persuasao_broadcast],
  persuasaos_dirigidas: [persuasao_dirigida]
});




module.exports = mongoose.model('Persuasoes_Personalizadas', Persuasoes_Personalizadas);