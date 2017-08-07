var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//dados de cadastro
var usuario = {
  _id: String,
  nome: String,
  sobrenome: String,
  email: String,
  curso: String,
  modulo: Number,
  login: String,
  senha: String,
  nivel: [String]
};


var oferta = {
       id_partida: String,
       id_rodada: String,
       round: Number,
       vrTotal: Number,
       ofertaEnviada: Number,//valor ofertado pelo adversario  
       id_adversario: String,//identificador do jogador que fez a oferta
       aceitou: String//se o jogador aceitou ou não
};

var ofertado = {
       id_partida: String,
       id_rodada: String,
       round: Number,
       vrTotal: Number,
       ofertaRecebida: Number,//valor ofertado pelo adversario  
       id_adversario: String,//identificador do jogador que fez a oferta
       aceitei: String//se o jogador aceitou ou não
};


//dados do jogador
var Jogador = new Schema({
    flag_rodada_round1: Boolean,
    usuario: usuario,
    id_partida: String,
    id_sala: String, 
    valores_sorteados: Array,
    ofertas_realizadas: [oferta],
    ofertas_recebidas: [ofertado],
    num_ofertas_aceitou: Number,
    num_ofertas_recusou: Number,
    pontuacao_max: Number,
    percentual_ganho: Number
});
  

module.exports = mongoose.model('Jogador', Jogador);
