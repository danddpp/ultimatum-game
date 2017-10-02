var app = require('../index.js')
var should = require('should');
var request = require('supertest')(app);
//var session = require('pass')

describe('teste 1', function() {
	 
	 it('deve retornar status 200 ao fazer get', function(done) {
         request.get('/').end(function(err, res) {
           res.status.should.eql(200);
           done();
         });
	 });


	 it('login post', function(done) {
	 	 //request.connect('/login');
	 	 //request.session.user.login = 'danddpp';
         request.connect('login').get('/menu_partida').end(function(err, res) {
           res.status.should.eql(200);
           done();
         });
	 	 //request.session.user.senha = '123';
	 });

});