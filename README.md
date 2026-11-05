<p align="center">
  <img src="docs/assets/cover.svg" alt="DataImpact — Entenda o impacto. Encontre a origem." width="100%">
</p>

<p align="center">
  <a href="https://github.com/alegarcinascimento/dataimpact/actions/workflows/ci.yml"><img src="https://github.com/alegarcinascimento/dataimpact/actions/workflows/ci.yml/badge.svg" alt="Validação automatizada"></a>
  <img src="https://img.shields.io/badge/Neo4j-Graph_Database-008C82?logo=neo4j&amp;logoColor=white" alt="Neo4j">
  <img src="https://img.shields.io/badge/Node.js-22%2B-233745?logo=nodedotjs" alt="Node.js 22 ou superior">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-233745" alt="Licença MIT"></a>
</p>

<p align="center"><strong>Uma aplicação de engenharia de dados que transforma relações de dependência em caminhos de investigação.</strong></p>

<p align="center">
  <a href="#experimente">Experimente</a> ·
  <a href="docs/ARCHITECTURE.md">Arquitetura</a> ·
  <a href="docs/CYPHER.md">Laboratório Cypher</a> ·
  <a href="docs/VALIDATION.md">Validação técnica</a> ·
  <a href="docs/INSTALLATION.md">Instalação e configuração</a>
</p>

## Demonstração em três passos

1. Abra **DataImpact_Demo.html** e clique em **Base saudável → Introduzir falha → Confirmar recuperação**.
2. Rastreie os relatórios afetados e confira o histórico de abertura e resolução dos alertas.
3. No **Laboratório de recuperação**, compare ocorrências recuperadas por palavras com a mesma busca contextualizada pelo grafo.

O laboratório usa 24 incidentes e oito perguntas sintéticas. O [relatório reproduzível](docs/RETRIEVAL_EXPERIMENT.md) apresenta o baseline executado e o código experimental de Semantic IDs. Os métodos vetoriais permanecem marcados como não avaliados até uma execução com embeddings.

## A pergunta que move o projeto

> **Se esta fonte de dados parar agora, quais processos, relatórios e equipes podem ser afetados — e por qual caminho?**

Um fechamento incompleto aparece no painel executivo. A origem pode estar várias transformações antes: uma captura parcial, um cadastro atrasado ou lançamentos inconsistentes. A investigação exige percorrer dependências, localizar responsáveis e consultar o histórico.

O DataImpact organiza esse contexto em um grafo navegável. Cada resultado de alcance pode ser explicado por um caminho entre ativos. O usuário explora as consequências potenciais de uma indisponibilidade e consulta incidentes anteriores para orientar a investigação.

**Público:** engenharia de dados, analytics engineering, governança e responsáveis por produtos de dados. A hipótese de valor é reduzir o trabalho manual de descobrir dependências e coordenar uma investigação; esse benefício ainda não foi medido em ambiente real.

## O que você encontra aqui

| Capacidade | Comportamento demonstrável |
| --- | --- |
| Análise de impacto | Descobre consumidores diretos e indiretos de um ativo |
| Rastreamento de origem | Percorre as dependências até as fontes |
| Explicabilidade | Mostra um caminho mínimo em número de relações para cada ativo alcançado |
| Simulação | Destaca o alcance potencial de uma indisponibilidade sem alterar processos |
| Contexto operacional | Identifica as equipes responsáveis pelos ativos alcançados |
| Verificações de dados | Detecta violações de volume e atualização a partir de métricas coletadas |
| Conectores | Importa JSON/CSV, mede arquivos CSV e coleta objetos PostgreSQL selecionados |
| Histórico de verificações | Registra abertura e resolução de violações em arquivo ou no Neo4j |
| Laboratório de recuperação | Compara métodos com gabarito, métricas e condições de execução explícitas |
| Memória de incidentes | Exibe ocorrência, evidência e solução histórica |
| Busca semântica opcional | Recupera incidentes por embeddings armazenados no Neo4j |
| Exportação | Gera JSON com ativo, direção, caminhos e identificação do modo de dados |

**Dados próprios:** importe catálogos JSON/CSV, meça arquivos CSV e conecte objetos PostgreSQL para coletar métricas e dependências de views. Consulte o [guia de conexão de dados](docs/DATA_SOURCES.md).

**Conjunto demonstrativo:** 28 ativos, 28 relações `FEEDS` e 4 incidentes fictícios. No Neo4j, a carga também cria 4 relações `OCCURRED_ON`, totalizando 32 nós e 32 relações. A visualização principal apresenta somente os ativos e as 28 relações de fluxo.

## Usar com seus próprios dados

```bash
git clone https://github.com/alegarcinascimento/dataimpact.git
cd dataimpact
npm ci
npm run import:catalog -- --input examples/catalog.json
npm run profile:csv -- --file examples/orders.csv --asset orders --timestamp updated_at
```

Copie `.env.example` para `.env`, defina `DATA_MODE=file` e execute `npm run dev`. O exemplo produz alertas de volume insuficiente e atualização atrasada com caminho até o relatório dependente.

Para uma fonte PostgreSQL, configure a conexão no ambiente e execute `npm run collect:postgres -- --config examples/postgres.json`. Para persistir o catálogo no Neo4j, use `npm run import:catalog -- --input .data/catalog.json --target neo4j` e ative `DATA_MODE=neo4j`.

[Contrato de entrada, configuração, regras e limites](docs/DATA_SOURCES.md).

## Experimente

### Sem instalar nada

[Baixe o projeto](https://github.com/alegarcinascimento/dataimpact/archive/refs/heads/main.zip), extraia e abra **`DataImpact_Demo.html`** no navegador. O arquivo contém interface e dados; a busca é lexical. As fontes externas são opcionais.

O GitHub exibe o código do HTML; para interagir, baixe e abra o arquivo. A capa acima é uma ilustração editorial, não uma captura da interface.

### Com a API local

```bash
git clone https://github.com/alegarcinascimento/dataimpact.git
cd dataimpact
npm ci
npm run dev
```

Abra **http://localhost:3000**. Sem `.env`, a aplicação inicia no modo demonstração. Requer Node.js 22 ou superior.

### Com Neo4j

```bash
cp .env.example .env
# Preencha NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD e NEO4J_DATABASE.
npm run seed
# Defina DATA_MODE=neo4j no .env.
npm run dev
```

O indicador **“Neo4j conectado”** identifica o modo real. Configuração, compatibilidade e embeddings estão no [guia de instalação](docs/INSTALLATION.md).

## Uma demonstração com respostas verificáveis

| Ponto de partida | Ativos dependentes | Relatórios alcançados | Equipes envolvidas |
| --- | ---: | ---: | ---: |
| `raw.vendas` | 13 | 5 | 7 |
| `raw.clientes` | 11 | 5 | 7 |
| `raw.lancamentos` | 7 | 3 | 4 |
| `raw.entregas` | 3 | 1 | 2 |

As contagens excluem o ativo selecionado e removem repetições. Dependência significa possibilidade de impacto; não confirma que o consumidor falhou.

**Experimento de dois minutos:**

1. Escolha **Fechamento incompleto**. Veja os cinco relatórios alcançados pela carga de vendas.
2. Confira o caminho até **Fechamento executivo** e as equipes associadas.
3. Observe que **Painel de fornecedores** permanece fora do alcance.
4. Selecione **Fechamento executivo** e alterne para **Origem a montante**: ERP, CRM e sistema contábil participam do resultado.
5. Pesquise **“fechamento com valores menores”** e consulte a evidência da ocorrência histórica.

O [guia de validação técnica](docs/VALIDATION.md) detalha resultados esperados, testes e perguntas de avaliação.

## Por que um grafo?

O problema central é uma rede de dependências com profundidade variável e caminhos compartilhados. Uma fonte pode alimentar vários relatórios; um relatório pode depender de várias fontes. A direção das relações determina a diferença entre investigar a origem e avaliar as consequências.

O Neo4j permite persistir essas relações explicitamente e expressar a exploração de caminhos em Cypher. Uma implementação relacional com consultas recursivas também é possível. A escolha pelo grafo favorece a correspondência entre o domínio, a consulta e a explicação apresentada ao usuário; o projeto não afirma superioridade de desempenho sem benchmark.

```mermaid
flowchart TD
  ERP["ERP comercial"] --> CAP["Captura e validação"]
  CAP --> V["Vendas validadas"]
  CRM["Cadastro de clientes"] --> CONS["Consolidação comercial"]
  V --> CONS
  CONS --> REC["Receita consolidada"]
  REC --> FECH["Cálculo de fechamento"]
  CONT["Lançamentos contábeis"] --> FECH
  FECH --> REL["Fechamento executivo"]
```

*Visão resumida de um trecho do domínio; algumas etapas do conjunto de dados foram agrupadas para facilitar a leitura.*

## Onde o Neo4j participa

| Componente | Papel no projeto | Implementação |
| --- | --- | --- |
| Property graph | Persiste ativos, incidentes e relações | [`scripts/seed.js`](scripts/seed.js) |
| Constraints e `MERGE` | Identidade e carga repetível sem duplicação do mesmo conjunto | [`scripts/seed.js`](scripts/seed.js) |
| Driver oficial | Consulta parametrizada, banco explícito e acesso de leitura | [`lib/db.js`](lib/db.js) |
| Índice vetorial | Recuperação de incidentes por similaridade de embeddings | [`scripts/embeddings.js`](scripts/embeddings.js) |
| Consulta vetorial | Recebe embedding da pergunta e retorna até quatro ocorrências | [`api/search.js`](api/search.js) |
| Travessia visual | Calcula alcance e um caminho por ativo no navegador | [`public/graph.js`](public/graph.js) |

**Decisão arquitetural explícita:** nesta versão, o Neo4j fornece o grafo e o navegador executa a travessia. O [laboratório Cypher](docs/CYPHER.md) apresenta consultas equivalentes para exploração no banco; elas não são chamadas pela interface atual. A evolução para catálogos maiores é mover a expansão para a API e devolver apenas o subgrafo solicitado.

## Embeddings com propósito

A busca de incidentes complementa a exploração de dependências. Com Neo4j e o provedor configurados, a pergunta é convertida em embedding e comparada aos vetores dos incidentes.

| Configuração | Recuperação | Identificação na interface |
| --- | --- | --- |
| Demonstração | Correspondência de palavras | Busca por palavras |
| Neo4j sem chave de embeddings | Correspondência de palavras sobre incidentes do banco | Busca por palavras |
| Neo4j com chave e índice populado | Similaridade vetorial | Busca semântica por embeddings |

A solução não gera respostas com LLM e não implementa GraphRAG completo. Similaridade textual e topologia são exploradas em etapas separadas; reranking por proximidade no grafo faz parte do roadmap. A [arquitetura](docs/ARCHITECTURE.md) explica o fluxo, as decisões e os limites.

## Qualidade e evidências

```bash
npm test
```

A suíte contém **24 testes automatizados**, incluindo cenários, ciclos, validação de catálogo, coleta CSV, regras, protocolo PostgreSQL simulado, API com dados próprios histórico, quantização residual e interações da interface em DOM simulado. A [pipeline do GitHub Actions](https://github.com/alegarcinascimento/dataimpact/actions/workflows/ci.yml) apresenta o resultado de cada execução.

Há um experimento de recuperação sintético publicado; os resultados vetoriais e de Semantic IDs ainda dependem de execução com embeddings. Não há benchmark de desempenho em produção. A validação integrada de PostgreSQL, Neo4j e provedor de embeddings precisa ser executada na instância utilizada. Testes de DOM não comprovam o layout visual em navegador.

## Decisões, limites e evolução

| Hoje | Próxima evolução proposta | Critério de conclusão |
| --- | --- | --- |
| Catálogo importável e dependências de views PostgreSQL | Linhagem por coluna e novos conectores | Validar extração com instância real e contratos de origem |
| Grafo pequeno carregado na interface | Expansão no servidor e orçamento de travessia | Comparar respostas e medir latência em conjuntos maiores |
| Busca vetorial independente da topologia | Reranking de incidentes por conexão com o ativo | Comparar Recall@k e relevância com baseline lexical |
| Equipe como propriedade | Equipes como nós quando o caso justificar | Consultar responsabilidades compartilhadas sem duplicação |
| API pública com dados fictícios | Controle de acesso e limitação de uso | Testes de autorização e limites antes de dados internos |

O escopo atual é um **MVP de portfólio com integração Neo4j implementada**, ainda sem validação externa documentada. As verificações atuais seguem regras explícitas de volume e atualização; não há previsão de prejuízo, detecção estatística de anomalias, causalidade confirmada ou integração AWS nesta versão.

## Documentação

| Leitura | O que você vai encontrar |
| --- | --- |
| [Conectar dados próprios](docs/DATA_SOURCES.md) | JSON, CSV, PostgreSQL, regras e rastreamento dos alertas |
| [Arquitetura e modelo](docs/ARCHITECTURE.md) | Schema, contratos, modos, decisões e escalabilidade |
| [Laboratório Cypher](docs/CYPHER.md) | Consultas de exploração, resultados esperados e cuidados |
| [Validação técnica](docs/VALIDATION.md) | Cenários de teste, evidências e critérios de validação |
| [Instalação e configuração](docs/INSTALLATION.md) | Execução local, Neo4j, embeddings e diagnóstico |
| [Monitoramento e histórico](docs/MONITORING.md) | Execuções, transições e persistência dos achados |
| [Experimento de recuperação](docs/RETRIEVAL_EXPERIMENT.md) | Baselines, contexto do grafo, embeddings e códigos residuais |
| [Padrão visual](docs/VISUAL_STANDARDS.md) | Capturas, diagramas, fotografias e revisão técnica |
| [Contribuição](CONTRIBUTING.md) | Como propor melhorias com resultados reproduzíveis |

## Referências e autoria

[Neo4j JavaScript Driver](https://neo4j.com/docs/javascript-manual/current/) · [Cypher](https://neo4j.com/docs/cypher-manual/current/) · [Índices vetoriais](https://neo4j.com/docs/cypher-manual/current/indexes/search-indexes/vector-indexes/)

Desenvolvido no contexto de um portfólio de engenharia de dados, com apoio de IA na implementação e documentação. O repositório concentra código, decisões e testes para revisão e reprodução pela comunidade.

[Licença MIT](LICENSE). Dados inteiramente fictícios. Projeto independente, sem vínculo ou endosso oficial da Neo4j.
