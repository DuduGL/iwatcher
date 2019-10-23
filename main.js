const 
  events = require('events'),
  fs = require('fs'),
  dataIn = './data/in',
  dataOut = './data/out/result.json';
  
class Watcher extends events.EventEmitter {
  constructor(dataIn, dataOut) {
    super();
    this.dataIn = dataIn;
    this.dataOut = dataOut;
    this.dados = {
      output: {
        numClientes: 0,
        numVendedores: 0,
        idMaiorVenda: '',
        piorVendedor: ''
      },
      vendedores: [],
      vendas: [],
      clientes: []
    }
  }

  watch() { //Chamado no momento que o watcher encontra alguma alteração no diretório de leitura
    const watcher = this;
    fs.readdir(this.dataIn, function(err, files) { //Faz varredura no diretório
      if (err) throw err;
      if(files.length > 0){ //Apenas faz processamento se existirem arquivos
        console.log(`${files.length} arquivo(s) adicionado(s)`);
        for (let index in files) {
          console.log(`#Iniciando processamento do arquivo ${files[index]}`);
          watcher.emit('process', files[index]); //chama evento que processa arquivo
        }
      }
    });
  }

  start() { //inicia o watcher
    console.log('#IWatcher for Ilegra iniciado!');
    var watcher = this;
    fs.watchFile(dataIn, function() { //Aguarda por alterações no diretório/arquivo selecionado (datasIn)
      watcher.watch();
    });
  }

  processFile(content){ //Processa um arquivo
    if(content){
      var lines = content.split('\r\n');
      lines.forEach(line => {
        this.processLine(line);
      });
    }
    else {
      console.log('Foi encontrado um erro no arquivo. Dessa forma, o mesmo não será processado.');
    }
  }

  processLine(line){ //Processa linha de um arquivo
    if(line && line != ''){
      var cells = line.split('ç');
      if(cells.length == 4)
        if(this.validateCells(cells)){
          switch(cells[0]){
            case '001': //vendedor
              this.processSalesman(cells);
            break;
            case '002': //cliente
              this.processCustomer(cells);
            break;
            case '003': //venda
              this.processSale(cells);
            break;
            default:
                console.log('Identificador inválido encontrado.');
            break;
          }
        }
      else 
        console.log('Linha do arquivo no formato incorreto. Portanto não será processado.');
    }
    else 
      console.log('Linha do arquivo em branco. Portanto não será processado.');
    
  }

  validateCells(cells){ //Valida a linha que está sendo processada em busca de inconsistências
    if(this.containsEmptyCell(cells)){
      return true;
    }
    else {
      console.log('Existem registros inválidos na linha do arquivo. Portanto não serão processados.');
      return false;
    }
  }

  containsEmptyCell(cells){ //Verifica se cada registro da linha é válido
    if(cells[0] && cells[1] && cells[2] && cells[3] && cells[0] != '' && cells[1] != '' && cells[2] != '' && cells[3] != ''){
      return true;
    }
  }

  processSalesman(cells){ //Adiciona vendedor a memória e processa linha do vendedor
    if(cells.length == 4){
      var vendedor = {
        CPF: cells[1],
        name: cells[2],
        salary: cells[3]
      };
      var found = this.dados.vendedores.find(function(elem){ return elem.CPF == vendedor.CPF });
      if(!found){
        console.log(`Adicionando novo vendedor - ${vendedor.name} (CPF: ${vendedor.CPF})`);
        this.dados.vendedores.push(vendedor);
      }
      else { //Se encontrou o vendedor em memória não adiciona novamente
        console.log(`Vendedor ${vendedor.name} (CPF: ${vendedor.CPF}) já existe e não será adicionado.`);
      }
    }
  }

  processCustomer(cells){ //Adiciona cliente a memória e processa linha do cliente
    if(cells.length == 4){
      var cliente = {
        CNPJ: cells[1],
        name: cells[2],
        businessArea: cells[3]
      }
      var found = this.dados.clientes.find(function(elem){ return elem.CNPJ == cliente.CNPJ });
      if(!found) {
        console.log(`Adicionando novo cliente - ${cliente.name} (CNPJ: ${cliente.CNPJ})`);
        this.dados.clientes.push(cliente);
      }
      else { //Se encontrou o cliente em memória não adiciona novamente
        console.log(`Cliente ${cliente.name} (CNPJ: ${cliente.CNPJ}) já existe e não será adicionado.`);
      }
    }
  }

  processSale(cells){ //Adiciona venda com totalizador a memória e processa linha da venda
    if(cells.length == 4){
      var items = cells[2].substr(1, cells[2].length - 2).split(",");
      var venda = {
        saleId: cells[1],
        salesmanName: cells[3],
        saleTotal: 0
      }
      venda.saleTotal = items.map(element => {
        element = element.split('-');
        return element[1] * element[2];
      }).reduce(function(a,b){return a+b});

      var found = this.dados.vendas.find(function(elem){ return elem.saleId == venda.saleId });
      if(!found){
        console.log(`Adicionando nova venda - ID: ${venda.saleId} (Total: R$ ${venda.saleTotal})`);
        this.dados.vendas.push(venda);
      }
      else { //Se já encontrou a venda em memória não adiciona novamente
        console.log(`Venda ID: ${venda.saleId} (Total: R$ ${venda.saleTotal}) já existe e não será adicionada.`);
      }
    }
  }

  updateOutput(){ //Atualiza os dados que serão salvo no arquivo de output
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

  saveOutput(){ //salva output
    console.log('Atualizando dados do arquivo de output');
    this.updateOutput(); //Atualiza variável que contém os dados que serão salvos no arquivo de output
    var outputPath = this.dataOut;
    fs.writeFile(outputPath, JSON.stringify(this.dados.output), function(err) { //Faz rewrite no arquivo de output
      if(err) {
          return console.log(err);
      }
    }); 
    console.log('Arquivo de output atualizado');
  }

  getTopSale(vendas){ //Busca maior venda
    return vendas.reduce((max,p) => p.saleTotal > max ? p.saleTotal : max, vendas[0]).saleId
  }

  getWorstSalesman(vendas){ //Faz agrupamento das vendas por vendedor, depois pega a menor para saaber quem é o pior vendedor
    var group = this.groupBy(vendas, 'salesmanName'); //Agrupamento
    return Object.keys(group).sort(function(a,b){return group[a]-group[b]})[0]; //Sort pelo valor
  }

  groupBy(array, prop) { //Faz group by dos vendedores com o valor vendido por cada
    return array.reduce(function(groups, item) {
      const val = item[prop];
      groups[val] = groups[val] || 0;
      groups[val] += item.saleTotal;
      return groups;
    }, {})
  }
}
 
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