var Partida = function(tipo_sala, id_dono) {
   this.id_dono = id_dono;
   this.data = new Date();
   this.status = 'Em andamento';
   this.tipo_sala = tipo_sala;
   this.num_jogadores = 0;
   this.jogadores = [];
   this.rodadas = [];
};


module.exports = Partida;