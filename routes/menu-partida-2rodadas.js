var router = require('express').Router();
var Partida = require('./../models/Partida');
var Jogador = require('./../models/Jogador');
var c_jogador = require('./../controllers/jogador');
var c_partida = require('./../controllers/partida');
var c_rodada = require('./../controllers/rodada');
var c_round = require('./../controllers/round');
var sortearValores = require('./../functions/sortearValores');
var verificarQtdeJogadoresSala = require('./../middlewares/verificaCamposCriarSala');









module.exports = router;