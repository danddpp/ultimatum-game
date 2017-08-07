var Partida = function(tipo_sala, id_dono) {
   this.id_dono = id_dono;
   this.data = new Date();
   this.status = 'Em andamento';
   this.tipo_sala = tipo_sala;
   this.num_jogadores = 0;
   this.jogadores = [];
   this.rodadas = [];
   this.persuasoes_padrao = null;
   this.contador_iniciar_partida = 0;
   this.num_rodada_atual = 1;
   this.num_round_atual = 1;
   this.indice_valor = 0;
};


module.exports = Partida;