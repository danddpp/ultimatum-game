var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var P_Jogador = {
    id_usuario: String,
    valor_ofertado: Number,
    nome_adversario: String,//combobox adversarios
    bt_enviar_oferta: Boolean,//verificar se bt foi clicado ou nao
    subtotal: Number//caso oferta tenha sido enviada valor do subtotal deve ser salvo
};


var P_Adversario = {
    id_usuario: String,
    valor_total_adv: Number,
    valor_oferta_adv: Number,
    total_pontos: Number,
    percent_ganho: Number,
    bt_aceite: Boolean//vale p sim e nao/ apenas mara marcar botoes como habilitados ou nao
};



var P_Round = {
  numero: Number,
  jogador: P_Jogador,
  bt_prox_round_click: Boolean,
  bt_prox_round_show: Boolean,
  bt_prox_rodada_click: Boolean,
  bt_prox_rodada_show: Boolean,
  adversarios: [P_Adversario],
};


var P_Rodada = {
    id_rodada: String,
    numero_rodada: Number,
    rounds: [P_Round]
};


var Estado_Painel = new Schema({
	id_partida: String,
  id_jogador: String,
  rodadas: [P_Rodada],
  aux_id_partida: String,
  aux_num_round: Number,
  aux_num_rodada: Number,
  aux_indice_valor: Number
});



module.exports = mongoose.model('Estado_painel', Estado_Painel);