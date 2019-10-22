const 
  events = require("events"),
  fs = require("fs"),
  dataIn = "./data/in",
  dataOut = "./data/out";
  dados = {
    output: {
      numClientes: 0,
      numVendedores: 0,
      idMaiorVenda: "",
      piorVendedor: ""
    },
    vendedores: [],
    vendas: [],
    clientes: []
  };  
  
class Watcher extends events.EventEmitter {
  constructor(dataIn, dataOut, dados) {
    super();
    this.dataIn = dataIn;
    this.dataOut = dataOut;
    this.dados = dados;
  }

  watch() {
    const watcher = this;
    fs.readdir(this.dataIn, function(err, files) {
      if (err) throw err;
      for (let index in files) {
        watcher.emit("process", files[index]); //chama evento que processa arquivo
      }
    });
  }

  start() { //inicia o watcher
    var watcher = this;
    fs.watchFile(dataIn, function() {
      watcher.watch();
    });
  }
}
 
let watcher = new Watcher(dataIn, dataOut, dados);

watcher.on("process", function process(file) {
  const watchFile = this.dataIn + "/" + file;
  fs.readFile(watchFile, 'utf8', function(err, content) {
    processarArquivo(content);
    fs.unlinkSync(watchFile);
  });
});

watcher.start();

function processarArquivo(content){
  var lines = content.split("\r\n");
  lines.forEach(line => {
    processarLinha(line);
  });
  salvarOutput();
}

function processarLinha(line){
  if(line){
    var cells = line.split("ç");
    switch(cells[0]){
      case "001": //vendedor
        processarVendedor(cells);
      break;
      case "002": //cliente
        processarCliente(cells);
      break;
      case "003": //venda
        processarVenda(cells);
      break;
    }
  }
}

function processarVendedor(cells){
  if(cells.length == 4){
    var vendedor = {
      CPF: cells[1],
      name: cells[2],
      salary: cells[3]
    };
    var found = this.dados.vendedores.find(function(elem){ return elem.CPF == vendedor.CPF });
    if(!found)
      this.dados.vendedores.push(vendedor);
  }
}

function processarCliente(cells){
  if(cells.length == 4){
    var cliente = {
      CNPJ: cells[1],
      name: cells[2],
      businessArea: cells[3]
    }
    var found = this.dados.clientes.find(function(elem){ return elem.CNPJ == cliente.CNPJ });
    if(!found)
      this.dados.clientes.push(cliente);
  }
}

function processarVenda(cells){
  if(cells.length == 4){
    var items = cells[2];
    items = items.substr(1, items.length - 2);
    items = items.split(",");
    var venda = {
      saleId: cells[1],
      salesmanName: cells[3],
      saleTotal: 0
    }
    venda.saleTotal = items.map(element => {
      element = element.split("-");
      return element[1] * element[2];
    }).reduce(function(a,b){return a+b});

    var found = this.dados.vendas.find(function(elem){ return elem.saleId == venda.saleId });
    if(!found)
      this.dados.vendas.push(venda);
  }
}

function atualizarOutput(){
  var nClientes = this.dados.clientes.length;
  var nVendedorees = this.dados.vendedores.length; 
  var mVenda = this.dados.vendas.reduce((max,p) => p.saleTotal > max ? p.saleTotal : max, this.dados.vendas[0]).saleId;

  var group = groupBy(this.dados.vendas, "salesmanName");
  var pVendedor = Object.keys(group).sort(function(a,b){return group[a]-group[b]})[0];

  this.dados.output = {
    numClientes: nClientes,
    numVendedores: nVendedorees,
    idMaiorVenda: mVenda,
    piorVendedor: pVendedor
  };
}

function salvarOutput(){
  atualizarOutput();
  var outputPath = "./data/out/result.json";
  fs.writeFile(outputPath, JSON.stringify(this.dados.output), function(err) {
    if(err) {
        return console.log(err);
    }
  }); 
}

function groupBy(array, prop) {
  return array.reduce(function(groups, item) {
    const val = item[prop];
    groups[val] = groups[val] || 0;
    groups[val] += item.saleTotal;
    return groups;
  }, {})
};