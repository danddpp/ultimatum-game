var P_Adversario = function(id_usuario) {
  this.id_usuario = id_usuario;
  this.valor_total_adv = 0;
  this.valor_oferta_adv = 0;
  this.total_pontos = 0;
  this.percent_ganho = 0;
  this.bt_aceite = false;
};


module.exports = P_Adversario;