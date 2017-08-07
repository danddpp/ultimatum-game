var Round = function(numeroRound, qtdeTotalJogadas) {
  this.numero = Number(numeroRound);
  this.qtdeTotalJogadas = Number(qtdeTotalJogadas);
  this.qtdeAtualJogadas = 0;
  this.jogadores = [];
  this.count_change_round = 0;
  this.regras = [];
  this.bt_prox_round = false;
};

module.exports = Round;


