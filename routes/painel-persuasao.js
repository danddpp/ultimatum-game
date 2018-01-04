var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');
var buscar_afinidades = require('./../functions/buscar_afinidades');
var Persuasoes_Padrao_Resultados = require('./../models/Persuasoes_Padrao_Resultados');
const co = require('co');
const generate = require('node-chartist');


router.get('/painel_persuasao', function(req, res) {
    if(req.isAuthenticated()) {
       var nome_jogador = req.user.nome;
       var nivel = req.user.nivel;
       var id_ = req.user._id;

    Partida.find().where('status').equals('Em andamento').exec(function(err, partidas) {
       if(err) {
        req.next(err);
       } else { 

         var partida = null;
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


router.get('/resultados_persuasao', function(req, res) {
   if(req.isAuthenticated()) {
      var nome_jogador = req.user.nome;
      var nivel = req.user.nivel;
      var id_ = req.user._id;

        Persuasoes_Padrao_Resultados.find().exec(function(err, data) {
          if(data) {

           var rec_s = 0;
           var rec_f = 0;
           var coe_s = 0;
           var coe_f = 0;
           var ap_s = 0;
           var ap_f = 0;
           var af_s = 0;
           var af_f = 0;

           for(var i = 0; i < data.length; i++) {
              var reciprocidade_resultado = data[i].reciprocidade_resultado;

              for(var j = 0; j < reciprocidade_resultado.length; j++) {
                  if(reciprocidade_resultado[j].success == true) {
                        rec_s++;                     
                  }

                  if(reciprocidade_resultado[j].success == false) {
                        rec_f++;
                  }
              }



               
              var coerencia_resultado = data[i].coerencia_resultado;  
   
              for(var j = 0; j < coerencia_resultado.length; j++) {
                  if(coerencia_resultado[j].success == true) {
                        coe_s++;                     
                  }

                  if(coerencia_resultado[j].success == false) {
                        coe_f++;
                  }
              }




              var aprovacao_social_resultado = data[i].aprovacao_social_resultado;  
   
              for(var j = 0; j < aprovacao_social_resultado.length; j++) {
                  if(aprovacao_social_resultado[j].success == true) {
                       ap_s++;                     
                  }

                  if(aprovacao_social_resultado[j].success == false) {
                        ap_f++;
                  }
              }




              var afinidade_resultado = data[i].afinidade_resultado;  
   
              for(var j = 0; j < afinidade_resultado.length; j++) {
                  if(afinidade_resultado[j].success == true) {
                       af_s++;                     
                  }

                  if(afinidade_resultado[j].success == false) {
                        af_f++;
                  }
              }



           }
 
           console.log(rec_s);
           console.log(rec_f);
           console.log(coe_s);
           console.log(coe_f);
           console.log(ap_s);
           console.log(ap_f);
           console.log(af_s);
           console.log(af_f);
           res.render('painel-persuasoes/resultados_persuasao', { nome_jogador: nome_jogador,
                                                                  id_usuario: id_, 
                                                                  mensagem:'',
                                                                  nivel_usuario: nivel,
                                                                  reciprocidade_s: rec_s,
                                                                  reciprocidade_f: rec_f,
                                                                  coerencia_s: coe_s,
                                                                  coerencia_f: coe_f,
                                                                  ap_social_s: ap_s,
                                                                  ap_social_f: ap_f,
                                                                  afinidade_s: af_s,
                                                                  afinidade_f: af_f});

          } else {
            res.render('home/index', {mensagem: ''});
          }    
        });

   } else {
    res.redirect('/');
   }
});


module.exports = router;