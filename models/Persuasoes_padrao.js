var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Persuasoes_Padrao = new Schema({
    reciprocidade: {habilitado: Boolean, message: String},
    coerencia: {habilitado: Boolean, message: String},
    aprovacaoSocial: {habilitado: Boolean, message: String},
    afinidade: {habilitado: Boolean, message: String},
    autoridade: {habilitado: Boolean, message: String},
    escassez: {habilitado: Boolean, message: String}
});




module.exports = mongoose.model('Persuasoes_Padrao', Persuasoes_Padrao);