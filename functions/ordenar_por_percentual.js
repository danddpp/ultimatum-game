module.exports = function(jogadores) {
  
    for(var i = 1; i < jogadores.length; i++) {	
     	  var escolhido = jogadores[i];
     	  var j = i;
     	console.log(escolhido.percentual_ganho);		
     	while((j > 0) && (jogadores[j-1].percentual_ganho > escolhido.percentual_ganho)) {
     	  jogadores[j] = jogadores[j-1];
     	  j -= 1;
     	}
          jogadores[j] = escolhido;
    }

    var ranking = [];
    var aux = 0;
    for(var i = jogadores.length-1; i >= 0; i--) {
      ranking[aux] = jogadores[i];
      aux++;
    }

  return ranking;
};