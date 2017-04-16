var Round = function(numeroRound, qtdeTotalJogadas) {
  this.numero = Number(numeroRound);
  this.qtdeTotalJogadas = Number(qtdeTotalJogadas);
  this.qtdeAtualJogadas = 0;
  this.jogadores = [];
  this.count_change_round = 0;
  this.regras = [];
};

module.exports = Round;


