var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var message = {
      data: Date,
      msg: String
};



var Chat = new Schema({
  id_emissor: String,
  id_receptor: String,
  historico: [message] 
});


  

module.exports = mongoose.model('Chat', Chat);
