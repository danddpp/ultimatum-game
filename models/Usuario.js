var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var desempenho_geral = {
  	num_de_partidas: Number,
    pontuacao_geral: Number,
    numero_de_vitorias: Number,
    nivel_de_experiencia: Number// a cada 5 partidas um usuário ganha um ponto no nível de exp
};



//dados do usuario
var Usuario = new Schema({
  nome: String,
  sobrenome: String,
  email: String,
  curso: String,
  modulo: Number,
  login: String,
  senha: String,
  nivel: [String],
  desempenho_geral: desempenho_geral,
  nivel_perfil: String,
  foto: Buffer,
  ids_de_chats_salvos: Array 
});
  

module.exports = mongoose.model('Usuario', Usuario);
