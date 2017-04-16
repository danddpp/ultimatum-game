var Jogador = function(usuario) {
  this.flag_rodada_round1 = false;
  this.usuario = usuario;
  this.id_partida = null; 
  this.valores_sorteados = [];
  this.ofertas_realizadas = [];
  this.ofertas_recebidas = [];
  this.num_ofertas_aceitou = 0;
  this.num_ofertas_recusou = 0;
  this.pontuacao_max = 0;
  this.percentual_ganho = 0;
};


module.exports = Jogador;