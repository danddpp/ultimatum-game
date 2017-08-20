var mongoose = require('mongoose');
var Schema = mongoose.Schema;


 

var resultado = {
    id_partida: String,
    id_jogador: String,
    num_rodada: Number,
    num_round: Number,
    tipo: String,
    nome_jogador_manipulado: String,
    success: Boolean,
    status: String
};


var Persuasoes_Padrao_Resultados = new Schema({
    resultado: resultado
});




module.exports = mongoose.model('Persuasoes_Padrao_Resultados', Persuasoes_Padrao_Resultados);