var P_Round = function(numero, p_jogador) {
   this.numero = Number(numero);
   this.jogador = p_jogador;
   this.bt_prox_round_click = false;
   this.bt_prox_round_show =  false;
   this.bt_prox_rodada_click = false;
   this.bt_prox_rodada_show = false;
   this.adversarios = [];
};

module.exports = P_Round;