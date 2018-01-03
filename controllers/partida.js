var Partida = function(tipo_sala, id_dono, num_rodadas) {
   this.id_dono = id_dono;
   this.data = new Date();
   this.status = 'Em andamento';
   this.num_rodadas = num_rodadas;
   this.tipo_sala = tipo_sala;
   this.num_jogadores = 0;
   this.jogadores = [];
   this.rodadas = [];
   this.persuasoes_padrao = null;
   this.contador_iniciar_partida = 0;
   this.iniciada = false;
   this.num_rodada_atual = 1;
   this.num_round_atual = 1;
   this.indice_valor = 0;
   this.versao = 0;
   this.contador_aceite = 0;
   this.contador_prox_round = 0;
   this.id_resultados = '';
   this.reciprocidade_pergunta1 = false;
   this.coerencia_pergunta1 = false;
   this.coerencia_pergunta2 = false;
   this.ap_social_pergunta = false;
   this.afinidade_pergunta1 = false;
   this.afinidade_pergunta2 = false;
   this.afinidade_pergunta3 = false;
   };



module.exports = Partida;