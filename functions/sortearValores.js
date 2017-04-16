module.exports = function() {
  var valores = [100,100,100,100,100,100,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
                           ,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];

var i = 1
var j = 6; 
  
  return sortear(valores, i, j);    
};

function sortear(valores, i, j) {
  if(i > 5) {
  
    return valores;
  
  } else {
    
  var total = 0;
  while(valores[j] <= 0) {
     valores[j] = Math.floor((Math.random() * 100) + 1);
     total = valores[j];  
  } 
  j++;
   while(valores[j] <= 0) {
     valores[j] = Math.floor((Math.random() * 100) + 1);
     if(valores[j] > 0) {
      total += valores[j];
     }  
  }
  j++;
   while(valores[j] <= 0) {
     valores[j] = Math.floor((Math.random() * 100) + 1);
     if(valores[j] > 0) {
      total += valores[j];
     }  
  }
  j++;
  while(valores[j] <= 0) {
     valores[j] = Math.floor((Math.random() * 100) + 1);
     if(valores[j] > 0) {
      total += valores[j];
     }  
  }
  j++;
  while(valores[j] <= 0) {
     valores[j] = Math.floor((Math.random() * 100) + 1);
     if(valores[j] > 0) {
      total += valores[j];
     }  
  }
  j++;
  while(total != 600) {
    valores[j]++;
    total++;
  }
   
  if(valores[j] > 10){
 
     if(valores[j] % 2 == 0) {
       var temp = valores[j] / 2;
       valores[j-1] += temp;
       valores[j] = temp; 
     }

    else if(valores[j] % 3 == 0) {
            var temp = valores[j] / 3;
            valores[j-2] += temp;
            valores[j-1] += temp;
            valores[j] = temp;  
     } 
  }

    j++;
    i++;
    return sortear(valores, i, j);
  }
}


