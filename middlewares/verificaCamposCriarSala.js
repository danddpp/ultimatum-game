var Partida = require('./../models/Partida');

module.exports = function(req, res, next) {
   
   var qtde = Number(req.body.partida.capacidade);
   var cursoPartida = req.body.partida.curso;
   var moduloPartida = req.body.partida.modulo;
   //console.log(qtde);
    if(qtde < 2) {
        
       var nome_jogador = req.user.nome;
       var curso = req.user.curso;
       var modulo = req.user.modulo;
       var nivel = req.user.nivel;
       var id_usuario = req.user._id;
       
       var query = 'Em andamento';
      
    Partida.find(query).exec(function(err, partidas) {
       if(partidas) {
        res.render('menu-partida/index', { nome_jogador: nome_jogador,
        	                                 curso: curso,
        	                                 modulo: modulo,
                                           mensagem: 'A qtde de jogadores deve ser maior ou igual a dois!',
                                           partidas: partidas,
                                           nivel_usuario: nivel,
                                           id_usuario: id_usuario,
                                           flag_bt_entrar: false });
       } else {
        res.render('menu-partida/index', { nome_jogador: nome_jogador,
        	                                 curso: curso,
        	                                 modulo: modulo,
                                           mensagem: 'A qtde de jogadores deve ser maior ou igual a dois!',
                                           partidas: null,
                                           nivel_usuario: nivel,
                                           id_usuario: id_usuario,
                                           flag_bt_entrar: false }); 
       }
    });

   } else if((cursoPartida != 'Livre') && (moduloPartida == undefined)) {
       Partida.find(query).exec(function(err, partidas) {
       if(partidas) {

        var nome_jogador = req.user.nome;
        var curso = req.user.curso;
        var modulo = req.user.modulo;
        var nivel = req.user.nivel;
        var id_usuario = req.user._id;

        res.render('menu-partida/index', { nome_jogador: nome_jogador,
        	                                 curso: curso,
        	                                 modulo: modulo,
                                           mensagem: 'É necessário informar qual o modulo que vc está cursando!',
                                           partidas: partidas,
                                           nivel_usuario: nivel,
                                           id_usuario: id_usuario,
                                           flag_bt_entrar: false });
       } else {
        res.render('menu-partida/index', { nome_jogador: nome_jogador,
        	                                 curso: curso,
        	                                 modulo: modulo,
                                           mensagem: 'É necessário informar qual o modulo que vc está cursando!',
                                           partidas: null,
                                           nivel_usuario: nivel,
                                           id_usuario: id_usuario,
                                           flag_bt_entrar: false }); 
       }
    });
 
   } else {
   	 next();
   }
};

