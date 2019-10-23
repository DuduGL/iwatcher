const 
  //events = require('events'),
  fs = require('fs'),
  dataIn = './data/in',
  dataOut = './data/out/result.json',
  Watcher = require('./watcher.js')
 
let watcher = new Watcher(dataIn, dataOut); //Iniciar classe watcher

watcher.on('process', function process(file) { //Evento de process chamado quando acontece uma alteração no diretório de leitura
  var self = this;
  const watchFile = `${this.dataIn}/${file}`;
  fs.readFile(watchFile, 'utf8', function(err, content) {
    self.processFile(content);
    self.saveOutput();
    fs.unlinkSync(watchFile);
  });
});

watcher.start(); //Inicia watcher