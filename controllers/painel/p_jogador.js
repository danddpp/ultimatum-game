var P_Jogador = function(id_usuario) {
   this.id_usuario = id_usuario;
   this.valor_ofertado = 0;
   this.nome_adversario = null;
   this.bt_enviar_oferta = false;
   this.subtotal = 0;
};

module.exports = P_Jogador;

