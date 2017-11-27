var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');
var OrdenarPorPercentual = require('./../functions/ordenar_por_percentual');

router.get('/pesquisar_filtros', function(req, res) {
	if(req.isAuthenticated()) {
		var nome_jogador = req.user.nome;
    var nivel = req.user.nivel;

       Partida.find().where('status').equals('Finalizada').exec(function(err, partidas) {
       	 if(err) {
       	 	req.next(err);
       	 } else {
            res.render('painel-resultados/pesquisar-filtros', 
        	                            {nome_jogador: nome_jogador, 
        	                             mensagem:'',
        	                             nivel_usuario: nivel,
        	                             partidas: partidas});
       	 }
       });  
	} else {
		res.redirect('/');
	}
});


router.post('/pesquisar', function(req, res) {
    if(req.isAuthenticated()) {
      var nome_jogador = req.user.nome;
      var nivel = req.user.nivel;      

      var curso = req.body.pesquisa.curso;
      var modulo = req.body.pesquisa.modulo;
      var data_partida = req.body.pesquisa.data_partida;
      var result_partidas = [];

      console.log(curso);
      console.log(modulo);
      console.log(data_partida);

      if(curso == "" && modulo == "" && data_partida == "") {        
        res.redirect('/pesquisar_filtros');
      } else {
          
          if(curso == "" && modulo == "" && data_partida != "") {
             Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                 //console.log(data_partida);
                 
           for(var i = 0; i < partidas.length; i++) {
              var str = partidas[i].data.toString();
              str = str.substring(4,15)
              str = str.replace(' ', '-');
              str = str.replace(' ', '-');
              console.log(str);
              var temp = str.split('-'); 
              
              switch(temp[0]) {
                  case 'Jan':
                      str = '01-' + str.substring(4,11);
                      break;
                  case 'Feb':
                      str = '02-' + str.substring(4,11);
                      break;
                  case 'Mar':
                      str = '03-' + str.substring(4,11);
                      break;
                  case 'Apr':
                      str = '04-' + str.substring(4,11);
                      break;
                  case 'May':
                      str = '05-' + str.substring(4,11);
                      break;
                  case 'Jun':
                      str = '06-' + str.substring(4,11);
                      break;
                  case 'Jul':
                      str = '07-' + str.substring(4,11);
                      break;
                  case 'Aug':
                      str = '08-' + str.substring(4,11);
                      break;
                  case 'Sep':
                      str = '09-' + str.substring(4,11);
                      break;s
                  case 'Oct':
                      str = '10-' + str.substring(4,11);
                      break;
                  case 'Nov':
                      str = '11-' + str.substring(4,11);
                      break;
                  case 'Dec':
                      str = '12-' + str.substring(4,11);
                      break;                                        
                  default:
                      break;
              }
              
              temp = [];
              temp = str.split('-');
              str = '';
              str = temp[2]+'-'+temp[0]+'-'+temp[1];

              if(data_partida == str) {
                result_partidas.push(partidas[i]);
              }



           }
                  

                  res.render('painel-resultados/pesquisar-filtros', 
                                            {nome_jogador: nome_jogador, 
                                             mensagem:'',
                                             nivel_usuario: nivel,
                                             partidas: result_partidas});
                  }
             });                
          }

          if(curso == "" && modulo != "" && data_partida == "") {
             Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                var result_partidas = [];
                for(var i = 0; i < partidas.length; i++) {
                   if(partidas[i].modulo == modulo) {
                     console.log('hey there!');
                     result_partidas.push(partidas[i]);
                   }
                }
              }
               console.log('here now');
               res.render('painel-resultados/pesquisar-filtros', 
                                         {nome_jogador: nome_jogador, 
                                          mensagem:'',
                                          nivel_usuario: nivel,
                                          partidas: result_partidas});
                
             }); 
          }

          if(curso == "" && modulo != "" && data_partida != "") {
             Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                 console.log('data_partida');
                 
           for(var i = 0; i < partidas.length; i++) {
              var str = partidas[i].data.toString();
              str = str.substring(4,15)
              str = str.replace(' ', '-');
              str = str.replace(' ', '-');

              var temp = str.split('-'); 
              
              switch(temp[0]) {
                  case 'Jan':
                      str = '01-' + str.substring(4,11);
                      break;
                  case 'Feb':
                      str = '02-' + str.substring(4,11);
                      break;
                  case 'Mar':
                      str = '03-' + str.substring(4,11);
                      break;
                  case 'Apr':
                      str = '04-' + str.substring(4,11);
                      break;
                  case 'May':
                      str = '05-' + str.substring(4,11);
                      break;
                  case 'Jun':
                      str = '06-' + str.substring(4,11);
                      break;
                  case 'Jul':
                      str = '07-' + str.substring(4,11);
                      break;
                  case 'Aug':
                      str = '08-' + str.substring(4,11);
                      break;
                  case 'Sep':
                      str = '09-' + str.substring(4,11);
                      break;s
                  case 'Oct':
                      str = '10-' + str.substring(4,11);
                      break;
                  case 'Nov':
                      str = '11-' + str.substring(4,11);
                      break;
                  case 'Dec':
                      str = '12-' + str.substring(4,11);
                      break;                                        
                  default:
                      break;
              }
              
              temp = [];
              temp = str.split('-');
              str = '';
              str = temp[2]+'-'+temp[0]+'-'+temp[1];

              if(data_partida == str && partidas[i].modulo == modulo) {
                console.log('data_partida');
                result_partidas.push(partidas[i]);
              }



           }
                  

                  res.render('painel-resultados/pesquisar-filtros', 
                                            {nome_jogador: nome_jogador, 
                                             mensagem:'',
                                             nivel_usuario: nivel,
                                             partidas: result_partidas});
                  }
             });
          }

          if(curso != "" && modulo == "" && data_partida == "") {
             Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                 console.log('data_partida');
                 
              for(var i = 0; i < partidas.length; i++) {
               if(partidas[i].tipo_sala.curso == curso) {
                result_partidas.push(partidas[i]);
               }
              }
           
                  res.render('painel-resultados/pesquisar-filtros', 
                                            {nome_jogador: nome_jogador, 
                                             mensagem:'',
                                             nivel_usuario: nivel,
                                             partidas: result_partidas});
              }
             });
          }

          if(curso != "" && modulo == "" && data_partida != "") {
             Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                 console.log('data_partida');
                 
           for(var i = 0; i < partidas.length; i++) {
              var str = partidas[i].data.toString();
              str = str.substring(4,15)
              str = str.replace(' ', '-');
              str = str.replace(' ', '-');

              var temp = str.split('-'); 
              
              switch(temp[0]) {
                  case 'Jan':
                      str = '01-' + str.substring(4,11);
                      break;
                  case 'Feb':
                      str = '02-' + str.substring(4,11);
                      break;
                  case 'Mar':
                      str = '03-' + str.substring(4,11);
                      break;
                  case 'Apr':
                      str = '04-' + str.substring(4,11);
                      break;
                  case 'May':
                      str = '05-' + str.substring(4,11);
                      break;
                  case 'Jun':
                      str = '06-' + str.substring(4,11);
                      break;
                  case 'Jul':
                      str = '07-' + str.substring(4,11);
                      break;
                  case 'Aug':
                      str = '08-' + str.substring(4,11);
                      break;
                  case 'Sep':
                      str = '09-' + str.substring(4,11);
                      break;s
                  case 'Oct':
                      str = '10-' + str.substring(4,11);
                      break;
                  case 'Nov':
                      str = '11-' + str.substring(4,11);
                      break;
                  case 'Dec':
                      str = '12-' + str.substring(4,11);
                      break;                                        
                  default:
                      break;
              }
              
              temp = [];
              temp = str.split('-');
              str = '';
              str = temp[2]+'-'+temp[0]+'-'+temp[1];

              if(data_partida == str && partidas[i].tipo_sala.curso == curso) { 
                result_partidas.push(partidas[i]);
              }
           }
                  res.render('painel-resultados/pesquisar-filtros', 
                                            {nome_jogador: nome_jogador, 
                                             mensagem:'',
                                             nivel_usuario: nivel,
                                             partidas: result_partidas});
                  }
             });
          }

          if(curso != "" && modulo != "" && data_partida == "") {
            Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                 console.log('data_partida');
                 
           for(var i = 0; i < partidas.length; i++) {
              var str = partidas[i].data.toString();
              str = str.substring(4,15)
              str = str.replace(' ', '-');
              str = str.replace(' ', '-');

              var temp = str.split('-'); 
              
              switch(temp[0]) {
                  case 'Jan':
                      str = '01-' + str.substring(4,11);
                      break;
                  case 'Feb':
                      str = '02-' + str.substring(4,11);
                      break;
                  case 'Mar':
                      str = '03-' + str.substring(4,11);
                      break;
                  case 'Apr':
                      str = '04-' + str.substring(4,11);
                      break;
                  case 'May':
                      str = '05-' + str.substring(4,11);
                      break;
                  case 'Jun':
                      str = '06-' + str.substring(4,11);
                      break;
                  case 'Jul':
                      str = '07-' + str.substring(4,11);
                      break;
                  case 'Aug':
                      str = '08-' + str.substring(4,11);
                      break;
                  case 'Sep':
                      str = '09-' + str.substring(4,11);
                      break;s
                  case 'Oct':
                      str = '10-' + str.substring(4,11);
                      break;
                  case 'Nov':
                      str = '11-' + str.substring(4,11);
                      break;
                  case 'Dec':
                      str = '12-' + str.substring(4,11);
                      break;                                        
                  default:
                      break;
              }
              
              temp = [];
              temp = str.split('-');
              str = '';
              str = temp[2]+'-'+temp[0]+'-'+temp[1];

              if(data_partida == str && partidas[i].tipo_sala.modulo == modulo) { 
                result_partidas.push(partidas[i]);
              }
           }
                  res.render('painel-resultados/pesquisar-filtros', 
                                            {nome_jogador: nome_jogador, 
                                             mensagem:'',
                                             nivel_usuario: nivel,
                                             partidas: result_partidas});
                  }
             });
          }

          if(curso != "" && modulo != "" && data_partida != "") {
             Partida.find().where('status').equals('Finalizada')
                                             .exec(function(err, partidas) {
              if(err) {
               req.next(err);
              } else {
                 console.log('data_partida');
                 
           for(var i = 0; i < partidas.length; i++) {
              var str = partidas[i].data.toString();
              str = str.substring(4,15)
              str = str.replace(' ', '-');
              str = str.replace(' ', '-');

              var temp = str.split('-'); 
              
              switch(temp[0]) {
                  case 'Jan':
                      str = '01-' + str.substring(4,11);
                      break;
                  case 'Feb':
                      str = '02-' + str.substring(4,11);
                      break;
                  case 'Mar':
                      str = '03-' + str.substring(4,11);
                      break;
                  case 'Apr':
                      str = '04-' + str.substring(4,11);
                      break;
                  case 'May':
                      str = '05-' + str.substring(4,11);
                      break;
                  case 'Jun':
                      str = '06-' + str.substring(4,11);
                      break;
                  case 'Jul':
                      str = '07-' + str.substring(4,11);
                      break;
                  case 'Aug':
                      str = '08-' + str.substring(4,11);
                      break;
                  case 'Sep':
                      str = '09-' + str.substring(4,11);
                      break;s
                  case 'Oct':
                      str = '10-' + str.substring(4,11);
                      break;
                  case 'Nov':
                      str = '11-' + str.substring(4,11);
                      break;
                  case 'Dec':
                      str = '12-' + str.substring(4,11);
                      break;                                        
                  default:
                      break;
              }
              
              temp = [];
              temp = str.split('-');
              str = '';
              str = temp[2]+'-'+temp[0]+'-'+temp[1];

              if(data_partida == str && partidas[i].tipo_sala.curso == curso 
                && partidas[i].tipo_sala.modulo == modulo) { 
                result_partidas.push(partidas[i]);
              }
           }
                  res.render('painel-resultados/pesquisar-filtros', 
                                            {nome_jogador: nome_jogador, 
                                             mensagem:'',
                                             nivel_usuario: nivel,
                                             partidas: result_partidas});
                  }
             });
          }
      }    

    } else {
      res.redirect('/');
    }
});

  

router.post('/visualizar_resultados_por_partida', function(req, res) {
   if(req.isAuthenticated()) {
    var query = req.body.params.idPartida;
    var nome_jogador = req.user.nome;
    var nivel = req.user.nivel;   


    Partida.findById(query).exec(function(err, partida_) {
      if (err) {
      	req.next(err);
      } else {
        var dados_partida = {
          data: partida_.data,
          num_rodadas: partida_.num_rodadas
        }

        Jogador.find().where('id_partida').equals(query).exec(function(err, jogadores) {
            if(err) {
            	req.next(err);
            } else {
            	var ranking_jogadores = [];
            	ranking_jogadores = OrdenarPorPercentual(jogadores);
                
            	res.render('painel-resultados/ranking-por-percentual', {nome_jogador: nome_jogador,
            	                                                        mensagem: '',
            	                                                        nivel_usuario: nivel,
            	                                                        jogadores: ranking_jogadores,
                                                                      dados_partida: dados_partida}); 
            }
        });
      }
    });

  
   } else {
   	 res.redirect('/');
   }
});


module.exports = router;