var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//definir a personalidade do jogador por meio de dados que definam esquemas sociais, prconceitos
//cogniçoes e


//aqui pode se ter dois adversrios e uma situação 2³ possibilidades
//onde 2 (base) ser a favor ou contra uma das opçoes abaixo
// e 3 (expoente) são os dois jogadores mais a opção que está sendo analisada entre os dois 
// exempolo
// expoente -> j1, j2, religião x

// j1/j2  j1/x  j2/x    equilibrio
//   -      -     -         N
//   -      -     +         S
//   -      +     -         S
//   -      +     +         N
//   +      -     -         S
//   +      -     +         N
//   +      +     -         N
//   +      +     +         S


//time de futebol (a,b,...,n, nenhum, nao gosto de futebol)
//orientação politica (centro, esq ou dir, nao tenho preferencia)
//religião


//questoes 
// classifique de 0 a 10 o seu nivel para cada atributo
// 1 Generosidade
// 2 Confiável
// 


//verificar se os atitudes do usuario ()

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
  //caracteristicas: 
});
  

module.exports = mongoose.model('Usuario', Usuario);
