var mongoose = require('mongoose');
var Schema = mongoose.Schema;


 

var reciprocidade_resultado = {
    id_partida: String,
    id_jogador: String,
    num_rodada: Number,
    num_round: Number,
    tipo: String,
    nome_jogador_manipulado: String,
    success: Boolean,
    status: String
};


var coerencia_resultado = {
    id_partida: String,
    id_jogador: String,
    num_rodada1: Number,
    num_round1: Number,
    num_rodada2: Number,
    num_round2: Number,
    tipo: String,
    nome_jogador_manipulado: String,
    resposta_quiz1: String,
    resposta_quiz2: String,
    success: Boolean,
    status: String
};



var aprovacao_social_resultado = {};

var afinidade_resultado = {};

var autoridade_resultado = {};

var escassez_resultado = {};

                               

var Persuasoes_Padrao_Resultados = new Schema({
	id_partida: String,
    reciprocidade_resultado: [reciprocidade_resultado],
    coerencia_resultado: [coerencia_resultado],
    aprovacao_social_resultado: [aprovacao_social_resultado],
    afinidade_resultado: [afinidade_resultado],
    autoridade_resultado: [autoridade_resultado],
    escassez_resultado: [escassez_resultado]
});




module.exports = mongoose.model('Persuasoes_Padrao_Resultados', Persuasoes_Padrao_Resultados);