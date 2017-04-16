var Oferta = function(id_partida, id_rodada, round, vrTotal,
                       ofertaEnviada, id_adversario, aceitou) {
   this.id_partida = id_partida.toString();
   this.id_rodada = id_rodada.toString();
   this.round = Number(round);
   this.vrTotal = Number(vrTotal);
   this.ofertaEnviada = Number(ofertaEnviada);
   this.id_adversario = id_adversario.toString();
   this.aceitou = aceitou.toString();
};



module.exports = Oferta;