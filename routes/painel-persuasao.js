var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');
var buscar_afinidades = require('./../functions/buscar_afinidades');

router.get('/painel_persuasao', function(req, res) {
    if(req.isAuthenticated()) {
       var nome_jogador = req.user.nome;
       var nivel = req.user.nivel;
       var id_ = req.user._id;

    Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
       if(err) {
        req.next(err);
       } else { 

         var partida = [];
         var jogadores_ = [];
         var flag = false;


           if(partidas.length > 0) {
            
             for(var i = 0; i < partidas.length; i++) {
                
                var jogadores = partidas[i].jogadores;
                
                for(var j = 0; j < jogadores.length; j++) {
                  
                   if(jogadores[j].usuario._id == id_) {
                     flag = true;
                     jogadores_ = jogadores;
                     partida = partidas[i];
                   }

                }
             }


             if(flag == true) {
               
               var adversarios = [];
               var temp = [];
               temp = jogadores_;

               for(var k = 0; k < temp.length; k++) {
                  
                 if (temp[k].usuario._id != id_) {
                    var user = {
                       id_usuario: temp[k].usuario._id,
                       nome_usuario: temp[k].usuario.nome+" "+temp[k].usuario.sobrenome 
                    };
                     
                    adversarios.push(user);
                 } 
                  
               }
                   res.render('painel-persuasoes/index', 
                                             {nome_jogador: nome_jogador,
                                              id_usuario: id_, 
                                              mensagem:'',
                                              nivel_usuario: nivel,
                                              partida: partida,
                                              jogadores: adversarios
                                          });
             } else {

                res.render('painel-persuasoes/index',{nome_jogador: nome_jogador,
                                                      id_usuario: id_, 
                                                      mensagem:'Você não está participando de nenhuma partida',
                                                      nivel_usuario: nivel,
                                                      partida: partida,
                                                      jogadores: jogadores_
                                                     });
             
             }


           } else {

                 res.render('painel-persuasoes/index', 
                                          {nome_jogador: nome_jogador,
                                           id_usuario: id_, 
                                           mensagem:'Não há partidas em andamento',
                                           nivel_usuario: nivel,
                                           partida: partida,
                                           jogadores: jogadores_
                                       });                 
           }
         
       }
    });

    } else {
      res.redirect('/');
    }
});


router.get('/painel_afinidades', function(req, res) {
   if(req.isAuthenticated()) {

    var id_usuario_manipulador = req.user._id;

    Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
       if (partidas) {
           
         buscar_afinidades(id_usuario_manipulador, partidas, req, res);

       } else {
        res.redirect('/painel_persuasao');
       }      
    });
   } else {
    res.redirect('/');
   }
});


module.exports = router;