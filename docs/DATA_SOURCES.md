# Conectar dados e investigar problemas

[README](../README.md) · [Instalação](INSTALLATION.md) · [Arquitetura](ARCHITECTURE.md)

O sistema aceita catálogos próprios em JSON/CSV, mede arquivos CSV reais e coleta métricas de objetos PostgreSQL explicitamente selecionados. Os registros de negócio permanecem na origem; são persistidos metadados, dependências, regras e métricas agregadas.

## Escolher a entrada

| Entrada | O que é coletado | Como obter dependências |
| --- | --- | --- |
| Catálogo JSON | Ativos, relações, incidentes, regras e métricas fornecidas | Relações declaradas pelo usuário |
| Catálogo em dois CSVs | Ativos, relações e regras | `dependencies.csv` |
| CSV de dados | Número de registros e maior timestamp da coluna selecionada | Catálogo declarado previamente |
| PostgreSQL | Contagem exata e maior timestamp dos objetos selecionados | Dependências de views/materialized views registradas no catálogo PostgreSQL, entre os objetos selecionados |

O coletor PostgreSQL não interpreta SQL arbitrário, não descobre pipelines externos, relatórios de BI, funções com SQL dinâmico ou dependências de aplicações. Complemente o catálogo quando essas relações forem necessárias.

## Fluxo completo com um arquivo CSV

Clone o projeto e instale com `npm ci`. Valide e importe o exemplo:

```bash
npm run import:catalog -- --input examples/catalog.json --validate
npm run import:catalog -- --input examples/catalog.json
npm run profile:csv -- --file examples/orders.csv --asset orders --timestamp updated_at
```

O catálogo resultante fica em `.data/catalog.json`, ignorado pelo Git. Copie `.env.example` para `.env` e defina:

```dotenv
DATA_MODE=file
GRAPH_FILE=.data/catalog.json
```

Inicie com `npm run dev` e abra http://localhost:3000. O catálogo contém três ativos conectados; o CSV contém dois registros e timestamps antigos. As regras exigem três registros e atualização em até 60 minutos. O painel apresenta **baixo volume** e **atraso**, com caminho de Pedidos até o relatório comercial.

Clique em **Rastrear dependências** para selecionar a origem do alerta e ver consumidores e caminhos. Atualize a página após uma nova coleta; a aplicação não executa polling ou agendamento automático.

Para medir outro CSV, cadastre seu ativo, configure as regras e troque `--file`, `--asset` e `--timestamp`. Para separador ponto e vírgula:

```bash
npm run profile:csv -- --file dados.csv --asset orders --timestamp updated_at --delimiter ";"
```

O parser suporta aspas, campos com delimitadores e BOM UTF-8. A entrada é limitada a 10 MiB por arquivo; usa leitura em memória. Timestamps devem ser ISO 8601 com timezone. A maior data representa a última atualização observada nos registros; **não é a data de modificação do arquivo**.

## Catálogo JSON

Use [`examples/catalog.json`](../examples/catalog.json) como contrato mínimo. Cada ativo requer `id`, `label`, `kind`, `owner` e `description`. Categorias: `source`, `job`, `table` e `report`.

| Campo opcional do ativo | Tipo | Significado |
| --- | --- | --- |
| `rowCount` | Inteiro não negativo | Quantidade observada de registros |
| `minRows` | Inteiro não negativo | Mínimo aceitável de registros |
| `updatedAt` | Data ISO 8601 com timezone ou null | Última atualização dos dados |
| `maxAgeMinutes` | Número não negativo | Idade máxima aceitável da atualização |
| `observedAt` | Data ISO 8601 com timezone | Momento da coleta das métricas |

As relações usam `source` e `target`, com IDs existentes. Não são aceitos IDs repetidos, relações duplicadas, autorrelações ou referências inexistentes. Ciclos entre ativos distintos são aceitos; a travessia usa visita única. Incidentes opcionais devem seguir o contrato de `lib/catalog.js`.

Os IDs reservados `__proto__`, `constructor` e `prototype` são recusados. Propriedades fora do contrato são descartadas; isso evita carregar colunas de negócio acidentalmente como metadados.

## Catálogo em CSV

Use [`examples/csv-catalog`](../examples/csv-catalog):

- `assets.csv`: cabeçalho `id,label,kind,owner,description`, com métricas e regras opcionais.
- `dependencies.csv`: cabeçalho `source,target`.

```bash
npm run import:catalog -- --input examples/csv-catalog
```

Nesse formato, a lista de incidentes começa vazia. O CSV de metadados usa vírgula e UTF-8. O separador configurável de `profile:csv` aplica-se ao arquivo de dados, não aos CSVs do catálogo.

## PostgreSQL

### Configuração

Use [`examples/postgres.json`](../examples/postgres.json). Escolha um namespace estável e liste de 1 a 50 tabelas/views. O conector consulta somente esses objetos. Informe `schema`, `table` e, para monitorar atualização, `timestampColumn`. Defina `kind: report` para views que representem um produto de consumo.

Configure a credencial apenas no ambiente:

```dotenv
SOURCE_DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

Use um usuário com permissões de leitura nos objetos selecionados e configure TLS conforme o servidor. Não desative a validação de certificado para contornar erros. Não versione credenciais nem cole a URL em issues.

```bash
npm run collect:postgres -- --config examples/postgres.json
```

O comando:

1. Abre uma transação `REPEATABLE READ READ ONLY`.
2. Confere a existência dos objetos explicitamente selecionados.
3. Executa `count(*)` e, se configurado, `max(timestampColumn)`.
4. Consulta `pg_depend` e `pg_rewrite` para relações entre os objetos selecionados.
5. Valida o catálogo completo, encerra a transação e grava o arquivo local atomicamente.

Em falha de coleta, executa rollback e não grava um catálogo parcial. O arquivo anterior permanece disponível; isso pode significar que a interface continua mostrando uma coleta anterior. Confira `observedAt` e o resultado do comando. Uma falha de conexão ainda não é convertida em alerta persistido pelo painel.

Os identificadores são delimitados e escapados; a seleção de schemas e OIDs usa parâmetros. Há timeout de 10 segundos por statement. `count(*)` é exato e pode ser caro em tabelas grandes; escolha objetos adequados, execute fora de horários críticos e avalie o custo antes de automatizar. Não há contagem aproximada nem execução incremental nesta versão.

Prefira `timestamptz` na coluna de atualização. O coletor exige um valor temporal retornado pelo driver; uma coluna textual de data não é convertida silenciosamente. Para `timestamp without time zone`, a interpretação depende do timezone do processo e deve ser validada no seu ambiente.

### Exercício em banco de desenvolvimento

[`examples/postgres-fixture.sql`](../examples/postgres-fixture.sql) cria uma tabela e uma view para verificar contagem, atraso e relação de dependência. Execute somente em banco de desenvolvimento próprio, usando seu cliente PostgreSQL. Depois rode o coletor com o arquivo de configuração de exemplo.

Não foi realizada execução integrada contra um servidor PostgreSQL nesta entrega. Os testes verificam o protocolo do conector com cliente simulado, enquanto CSV, API e catálogo próprio têm testes locais executados. Valide as permissões, consultas e tipos na sua instância antes de usar operacionalmente.

## Persistir o catálogo no Neo4j

Depois de coletar ou importar, configure as variáveis Neo4j no `.env` e execute:

```bash
npm run import:catalog -- --input .data/catalog.json --target neo4j
```

Defina `DATA_MODE=neo4j` e reinicie a aplicação. Ativos, regras e métricas são gravados em `DIAsset`; dependências em `FEEDS`; ocorrências em `DIIncident` e `OCCURRED_ON`.

A operação usa upsert e não apaga ativos ou relações ausentes da importação. Use um banco dedicado para separar seu catálogo do seed fictício e revise mudanças de linhagem que exijam remoção. Para os ativos enviados, os campos de métricas e regras são substituídos pelo novo snapshot; campos omitidos dessas categorias são removidos, evitando manter medições antigas como atuais.

Se cadastrar incidentes próprios no Neo4j, `npm run embeddings` gera vetores a partir dos incidentes existentes nesse banco, limitado a 200 ocorrências. A coleta de métricas não cria incidentes históricos ou soluções automaticamente.

## Regras e interpretação

| Código | Disparo |
| --- | --- |
| `low_volume` | `rowCount < minRows` |
| `stale` | Idade de `updatedAt` maior que `maxAgeMinutes` |
| `missing_volume` | Regra de volume existe, mas a métrica não foi coletada |
| `missing_freshness` | Regra de atualização existe, mas não há data válida |
| `future_timestamp` | Atualização está mais de cinco minutos no futuro |

O painel recalcula a idade ao carregar o catálogo. `observedAt` indica quando a medição foi feita; não transforma uma medição antiga em nova. Uma contagem registrada continua sendo um snapshot até a próxima coleta. A ferramenta ainda não aplica um SLA separado de idade da coleta.

Um alerta mostra a violação observada/configurada e os consumidores potencialmente afetados. Ele não confirma erro financeiro, fraude, causa raiz ou falha efetiva de cada consumidor. Ausência de violação não comprova qualidade fora das regras cadastradas.

## Fronteiras de segurança e operação

Importação e coleta são comandos administrativos locais, sem endpoint público de escrita ou envio de credenciais pelo navegador. A API de leitura não possui autenticação: use dados autorizados e adicione controle de acesso antes de disponibilizar o catálogo interno a outras pessoas.

O coletor não agenda execuções. Integre-o ao seu orquestrador com credenciais gerenciadas, registro de sucesso/falha e política de atualização. CSV/JSON são limitados a 10 MiB por arquivo; o catálogo aceita até 500 ativos, 2.000 relações e 200 incidentes. A gravação local é atômica em um filesystem local, mas não há coordenação entre coletores concorrentes: serialize as execuções por arquivo de destino.

## Referências

- [node-postgres: consultas e parâmetros](https://node-postgres.com/features/queries)
- [PostgreSQL: catálogo de dependências](https://www.postgresql.org/docs/current/catalog-pg-depend.html)
- [CSV Parse](https://csv.js.org/parse/api/sync/)
