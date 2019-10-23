# IWatcher
## What for?
O IWatcher foi desenvolvido para realizar a varredura de arquivos de um diretório de leitura.
Como resultado, será gerado um arquivo contendo os totalizadores esperados em um arquivo de output

## How to?
1. Faça o download do repositório no github!;
2. Dentro da pasta raiz do IWatcher, crie as pastas "data/in/" e "data/out/";
3. Execute o IWatcher com o node executando o comando "node main.js" na pasta raiz do IWatcher;
4. Adicione os arquivos de leitura na pasta "data/in";
5. Veja o resultado no arquivo "result.json" na pasta "data/out";

## Condições de uso e validações
1. Qualquer extensão de arquivo será válida;
2. Vendedores duplicados não serão inseridos (CPF é utilizado como critério);
3. Clientes duplicados não serão inseridos (CNPJ é utilizado como critério);
4. Vendas duplicados não serão inseridos (ID da venda é utilizada como critério);
5. As linhas que estiverem fora do padrão do arquivo base não serão inseridas;

## Exemplo de arquivo base
```
001ç1234567891234çPedroç50000  
001ç3245678865434çPauloç40000.99  
002ç2345675434544345çJose da SilvaçRural  
002ç2345675433444345çEduardo PereiraçRural  
003ç10ç[1-10-100,2-30-2.50,3-40-3.10]çPedro  
003ç08ç[1-34-10,2-33-1.50,3-40-0.10]çPaulo  
```

## Enjoy!!
Em caso de qualquer dúvida, entrar em contato através do e-mail eduardo_gindri@hotmail.com.
Obs.: Não nos responsabilizamos pelo desligamento de vendedores após uso do IWatcher.

## TO DO
1. Processar arquivos em branco ;D