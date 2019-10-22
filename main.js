const 
  events = require("events"),
  fs = require("fs"),
  dataIn = "./data/in",
  dataOut = "./data/out/result.json";
  
class Watcher extends events.EventEmitter {
  constructor(dataIn, dataOut) {
    super();
    this.dataIn = dataIn;
    this.dataOut = dataOut;
    this.dados = {
      output: {
        numClientes: 0,
        numVendedores: 0,
        idMaiorVenda: "",
        piorVendedor: ""
      },
      vendedores: [],
      vendas: [],
      clientes: []
    }
  }

  watch() {
    const watcher = this;
    fs.readdir(this.dataIn, function(err, files) {
      if (err) throw err;
      
      if(files.length > 0){
        console.log(files.length + " arquivo(s) adicionado(s)");
        for (let index in files) {
          console.log("#Iniciando processamento do arquivo " + files[index]);
          watcher.emit("process", files[index]); //chama evento que processa arquivo
        }
      }
    });
  }

  start() { //inicia o watcher
    console.log("#IWatcher for Ilegra iniciado!");
    var watcher = this;
    fs.watchFile(dataIn, function() {
      watcher.watch();
    });
  }

  processarArquivo(content){
    if(content){
      var lines = content.split("\r\n");
      lines.forEach(line => {
        this.processarLinha(line);
      });
    }
    else {
      console.log("Foi encontrado um erro no arquivo. Dessa forma, o mesmo não será processado.");
    }
  }

  processarLinha(line){
    if(line){
      var cells = line.split("ç");
      switch(cells[0]){
        case "001": //vendedor
          this.processarVendedor(cells);
        break;
        case "002": //cliente
          this.processarCliente(cells);
        break;
        case "003": //venda
          this.processarVenda(cells);
        break;
      }
    }
  }

  processarVendedor(cells){
    if(cells.length == 4){
      var vendedor = {
        CPF: cells[1],
        name: cells[2],
        salary: cells[3]
      };
      var found = this.dados.vendedores.find(function(elem){ return elem.CPF == vendedor.CPF });
      if(!found){
        console.log("Adicionando novo vendedor - " + vendedor.name + " (CPF: " + vendedor.CPF + ")");
        this.dados.vendedores.push(vendedor);
      }
      else {
        console.log("Vendedor " + vendedor.name + " (CPF: " + vendedor.CPF + ") já existe e não será adicionado.");
      }
    }
  }

  processarCliente(cells){
    if(cells.length == 4){
      var cliente = {
        CNPJ: cells[1],
        name: cells[2],
        businessArea: cells[3]
      }
      var found = this.dados.clientes.find(function(elem){ return elem.CNPJ == cliente.CNPJ });
      if(!found) {
        console.log("Adicionando novo cliente - " + cliente.name + " (CNPJ: " + cliente.CNPJ + ")");
        this.dados.clientes.push(cliente);
      }
      else {
        console.log("Cliente " + cliente.name + " (CNPJ: " + cliente.CNPJ + ") já existe e não será adicionado.");
      }
    }
  }

  processarVenda(cells){
    if(cells.length == 4){
      var items = cells[2].substr(1, cells[2].length - 2).split(",");
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
      if(!found){
        console.log("Adicionando nova venda - ID: " + venda.saleId + " (Total: R$ " + venda.saleTotal + ")");
        this.dados.vendas.push(venda);
      }
      else {
        console.log("Venda ID: " + venda.saleId + " (Total: R$ " + venda.saleTotal + ") já existe e não será adicionada.");
      }
    }
  }

  atualizarOutput(){
    var nClientes = this.dados.clientes.length;
    var nVendedorees = this.dados.vendedores.length; 
    var mVenda = this.getTopSale(this.dados.vendas);
    var pVendedor = this.getWorstSalesman(this.dados.vendas);

    this.dados.output = {
      numClientes: nClientes,
      numVendedores: nVendedorees,
      idMaiorVenda: mVenda,
      piorVendedor: pVendedor
    };
  }

  salvarOutput(){
    console.log("Atualizando dados do arquivo de output");
    this.atualizarOutput();
    var outputPath = this.dataOut;
    fs.writeFile(outputPath, JSON.stringify(this.dados.output), function(err) {
      if(err) {
          return console.log(err);
      }
    }); 
    console.log("Arquivo de output atualizado");
  }

  getTopSale(vendas){
    return vendas.reduce((max,p) => p.saleTotal > max ? p.saleTotal : max, vendas[0]).saleId
  }

  getWorstSalesman(vendas){
    var group = this.groupBy(vendas, "salesmanName");
    return Object.keys(group).sort(function(a,b){return group[a]-group[b]})[0];
  }

  groupBy(array, prop) {
    return array.reduce(function(groups, item) {
      const val = item[prop];
      groups[val] = groups[val] || 0;
      groups[val] += item.saleTotal;
      return groups;
    }, {})
  }
}
 
let watcher = new Watcher(dataIn, dataOut);

watcher.on("process", function process(file) {
  var self = this;
  const watchFile = this.dataIn + "/" + file;
  fs.readFile(watchFile, 'utf8', function(err, content) {
    self.processarArquivo(content);
    self.salvarOutput();
    fs.unlinkSync(watchFile);
  });
});

watcher.start();