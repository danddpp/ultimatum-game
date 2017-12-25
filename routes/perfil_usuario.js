var router = require('express').Router();
var Usuario = require('./../models/Usuario');
var formidable = require('formidable');
var fs = require('fs');
var buscar_posicao_ranking = require('.././functions/buscar_posicao_ranking');
var buscar_posicao_ranking_outro_perfil = require('.././functions/buscar_posicao_ranking_outro_perfil');

router.get('/perfil_usuario', function(req, res) {
  if(req.isAuthenticated()) {

    var nome_jogador = req.user.nome;
    var nivel = req.user.nivel;

    Usuario.findById(req.user._id).exec(function(err, usuario) {
     	if(usuario) {
     	 
     	   var foto = usuario.foto;
         var num_vitorias = usuario.desempenho_geral.numero_de_vitorias;
         var pontuacao_total = usuario.desempenho_geral.pontuacao_geral;

         if(foto != null) {
           foto = 'data:image/jpeg;base64,'+foto.toString('base64');
         }

          Usuario.find().exec(function(err, usuarios) {
            if(usuarios) {
             
             var users = [];

             for(var i = 0; i < usuarios.length; i++) {
                  if(usuarios[i]._id != req.user._id) {
                     
                    if(usuarios[i].foto != null) {
                     var foto_users = 'data:image/jpeg;base64,'+usuarios[i].foto.toString('base64');
                    } else {
                      var foto_users = null; 	
                    }
                     var user = {
                     	id_usuario: usuarios[i]._id, 
                     	nome: usuarios[i].nome,
                     	foto: foto_users  
                     }
                     users.push(user);
                  }
             }  

             var num_vitorias = usuario.desempenho_geral.numero_de_vitorias;
             var pontuacao_total = usuario.desempenho_geral.pontuacao_geral;
             var nome_perfil = nome_jogador + ' ' + req.user.sobrenome;            

             var temp = { meu_id: req.user._id, 
                          nome_jogador: nome_jogador,
                          nivel_usuario: nivel,
                          nivel_perfil: req.user.nivel_perfil,
                          foto: foto,
                          usuarios: users,
                          num_vitorias: num_vitorias,
                          posicao_ranking: '',
                          pontuacao_total: pontuacao_total,
                          nome_perfil: nome_perfil
                        }; 

             
            buscar_posicao_ranking(req, res, temp);
               

            } else {
            	console.log(err);
            }
          });
         
         }

     });
                                                    
  } else {
  	res.redirect('/');
  }
});

router.get('/editar_perfil', function(req, res) {
  if(req.isAuthenticated()) {
    var nome_jogador = req.user.nome;
    var nivel = req.user.nivel;
 
    

     Usuario.findById(req.user._id).exec(function(err, usuario) {
     	if(usuario) {
     	 var foto = usuario.foto;
         
         if(foto != null) {
           foto = 'data:image/jpeg;base64,'+foto.toString('base64');
         }
        
         res.render('perfil_usuario/editar_perfil', { nome_jogador: nome_jogador,
                                                      sobrenome: req.user.sobrenome,
                                                      email: req.user.email,
                                                      curso: req.user.curso,
                                                      modulo: req.user.modulo,
                                                      login: req.user.login,
                                                      senha: req.user.senha,
    	                                              nivel_usuario: nivel,
    	                                              foto: foto } ); 
         }

     });
  } else {

  }
});


router.post('/salvar_alteracoes', function(req, res) {
   if(req.isAuthenticated()) {
   
   var id_usuario = req.user._id;

   var form = new formidable.IncomingForm();

   form.parse(req, function(err, fields, files) {
      var img = files.foto;
      
      fs.readFile(img.path, function(err, data) {
         
         Usuario.findById(id_usuario).exec(function(err, usuario) {
         	if(usuario) {

             usuario.nome = fields.nome;
             usuario.sobrenome = fields.sobrenome;
             usuario.email = fields.email;
             usuario.curso = fields.curso;
             usuario.modulo = fields.modulo;
             usuario.login = fields.login;
             usuario.senha = fields.senha;
             usuario.foto = data;

             usuario.save(function() {
             	res.redirect('/editar_perfil');
             });

         	} else {
         		console.log(err);
         	}
         });

      });

   });	  


   } else {
   	 res.redirect('/');
   }
});

router.post('/visitar_perfil', function(req, res) {
   var id_user = req.body.id_usuario;
   
   if(req.isAuthenticated()) {

      Usuario.findById(id_user).exec(function(err, usuario) {
       	if(usuario) {
       	 //dados do perfil visitado
       	 var foto = usuario.foto;
         var num_vitorias = usuario.desempenho_geral.numero_de_vitorias;
         var pontuacao_total = usuario.desempenho_geral.pontuacao_geral; 
         var nome_perfil = usuario.nome + ' ' + usuario.sobrenome;

         //dado do visitante
         var nivel = usuario.nivel_perfil;
         var nome_jogador = "";

           if(foto != null) {
             foto = 'data:image/jpeg;base64,'+foto.toString('base64');
           }

            Usuario.find().exec(function(err, usuarios) {
              if(usuarios) {
               
               var users = [];

               for(var i = 0; i < usuarios.length; i++) {
                    if(usuarios[i]._id != req.user._id) {
                       
                      if(usuarios[i].foto != null) {
                       var foto_users = 'data:image/jpeg;base64,'+usuarios[i].foto.toString('base64');
                      } else {
                        var foto_users = null; 	
                      }
                       var user = {
                       	id_usuario: usuarios[i]._id, 
                       	nome: usuarios[i].nome,
                       	foto: foto_users  
                       }
                       users.push(user);
                    } else {
                       nome_jogador = usuarios[i].nome; 
                    }
               }

                var temp = { meu_id: req.user._id, 
                             nome_jogador: nome_jogador,
                             nivel_usuario: req.user.nivel,
                             nivel_perfil: nivel,
                             foto: foto,
                             usuarios: users,
                             num_vitorias: num_vitorias,
                             posicao_ranking: '',
                             pontuacao_total: pontuacao_total,
                             nome_perfil: nome_perfil
                           }; 

                
               buscar_posicao_ranking_outro_perfil(req, res, temp, id_user);  
               
              } else {
              	console.log(err);
              }
            
        });

        } else {
          console.log(err);
        } 

     });   

   } else {
   	 res.redirect('/');
   }
});







module.exports = router;
