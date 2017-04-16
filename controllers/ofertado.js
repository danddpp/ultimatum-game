var Ofertado = function(id_partida, id_rodada, round, vrTotal,
                       ofertaRecebida, id_adversario, aceitei) {
   this.id_partida = id_partida.toString();
   this.id_rodada = id_rodada.toString();
   this.round = Number(round);
   this.vrTotal = Number(vrTotal);
   this.ofertaRecebida = Number(ofertaRecebida);
   this.id_adversario = id_adversario.toString();
   this.aceitei = aceitei.toString();
};



module.exports = Ofertado;