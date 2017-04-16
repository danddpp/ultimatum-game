var mongoose = require('mongoose');
var Schema = mongoose.Schema;



//dados do usuario
var Usuario = new Schema({
  nome: String,
  sobrenome: String,
  email: String,
  curso: String,
  modulo: Number,
  login: String,
  senha: String,
  nivel: [String]
});
  

module.exports = mongoose.model('Usuario', Usuario);
