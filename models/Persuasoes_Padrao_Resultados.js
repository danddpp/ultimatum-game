var mongoose = require('mongoose');
var Schema = mongoose.Schema;


 

var reciprocidade = {
    id_partida: String,
    id_jogador: String,
    nome_jogador_manipulado: String,
    status: String
};


var Persuasoes_Padrao_Resultados = new Schema({
    reciprocidade: [reciprocidade]
});




module.exports = mongoose.model('Persuasoes_Padrao_Resultados', Persuasoes_Padrao_Resultados);