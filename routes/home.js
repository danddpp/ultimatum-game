var router = require('express').Router();
var verificarCampos = require('./../middlewares/autenticacao_usuario');
var Usuario = require('./../models/Usuario');


router.get('/', function(req, res) {
	res.render('home/index', {mensagem: ''});
});

router.get('/criar_conta', function(req, res) {
    res.render('home/criar_conta',{mensagem: ''});
});


router.post('/cadastrar_usuario', verificarCampos, function(req, res) { 
    var query = {nome: req.body.usuario.email};

    Usuario.findOne(query).select('nome').exec(function(err, jogador) {
       if(jogador) {  
         res.render('home/criar_conta', {mensagem: 'Login já cadastrado'});
       } else {
         var usuario = req.body.usuario;
         
         var novoUsuario = {}; 
          
          if(usuario.email == 'danddpp@gmail.com' || 
             usuario.email == 'nelsonalvespinto@gmail.com' || 
             usuario.email == 'ifsp.ederson@gmail.com') {
             

                 var desempenho_geral = {
                        num_de_partidas: 0,
                        pontuacao_geral: 0,
                        numero_de_vitorias: 0,
                        nivel_de_experiencia: 0
                 }; 

             var usuario = new Usuario({
                       nome: usuario.nome,
                       sobrenome: usuario.sobrenome,
                       email: usuario.email,
                       curso: usuario.curso,
                       modulo: usuario.modulo,
                       login: usuario.login,
                       senha: usuario.senha,
                       nivel: ['admin'],
                       desempenho_geral: desempenho_geral,
                       nivel_perfil: 'Filhote de gafanhoto nível 0',
                       foto: null,
                       ids_de_chats_salvos: []
             });            
          } else {
              
              var desempenho_geral = {
                     num_de_partidas: 0,
                     pontuacao_geral: 0,
                     numero_de_vitorias: 0,
                     nivel_de_experiencia: 0
              };


            var usuario = new Usuario({
                      nome: usuario.nome,
                      sobrenome: usuario.sobrenome,
                      email: usuario.email,
                      curso: usuario.curso,
                      modulo: usuario.modulo,
                      login: usuario.login,
                      senha: usuario.senha,
                      nivel: ['usuario'],
                      desempenho_geral: desempenho_geral,
                      nivel_perfil: 'Filhote de gafanhoto nível 0',
                      foto: null,
                      ids_de_chats_salvos: []
            });  
          }

                  
                       
         Usuario.create(usuario, function(err, usuario) {
            if(err) {
              return req.next(err);
            } else {
              res.render('home/criar_conta', {mensagem: 'cadastrado'});    
            }        
         });

        }

    });
});

module.exports = router;
