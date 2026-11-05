# Instalação, configuração e deploy

[Voltar ao README](../README.md) · [Arquitetura](ARCHITECTURE.md)

Este guia operacional explica como executar a demonstração e ativar as integrações. Os caminhos de comandos são relativos à raiz do repositório.

## Experimente em um minuto

Abra [`DataImpact_Demo.html`](../DataImpact_Demo.html) no navegador: o arquivo é uma demonstração autônoma, sem instalação. Use os cenários, clique nos nós, alterne a direção, arraste o fundo para mover o grafo e use os controles de zoom. A demonstração contém somente dados fictícios e busca lexical.

Para executar o projeto com API:

```bash
npm install
cp .env.example .env
npm run dev
```

Abra http://localhost:3000. Node.js 22 ou superior. `DATA_MODE=demo` dispensa banco e chaves. O único pacote de produção é o driver oficial do Neo4j. A interface usa JavaScript, HTML, CSS e SVG; nenhuma biblioteca de visualização externa é necessária.

## Problema e público

Equipes de dados precisam identificar quais produtos dependem de uma fonte, quais áreas podem ser afetadas por uma falha e quais incidentes anteriores merecem investigação. O DataImpact apresenta caminhos reproduzíveis entre fontes, processos, tabelas e relatórios. Destina-se a engenheiros de dados, analistas e responsáveis por produtos de dados.

## Funcionalidades

- Grafo com 28 ativos, 28 relações direcionadas e quatro incidentes históricos fictícios.
- Navegação por ativo, pesquisa de nomes, zoom, movimentação e ajuste do grafo.
- Alcance a jusante e rastreamento a montante com um caminho por ativo.
- Simulação sem escrita no banco; destaca dependência potencial.
- Contagens calculadas de ativos, relatórios e equipes alcançados; excluem o ativo selecionado.
- Três cenários: vendas incompletas, cadastro atrasado e divergência contábil.
- Busca lexical ou semântica real, conforme configuração.
- Evidência e solução histórica, sem atribuir causa raiz automaticamente.
- Exportação JSON da análise com modo, direção e caminhos.
- Layout adaptável a celular e controles de nós acessíveis por teclado.

## Arquitetura

Navegador → API Node.js na Vercel → Neo4j Aura. No modo demo a API usa o conjunto fictício versionado. No modo Neo4j ela lê o banco real, sem substituir erros silenciosamente por dados locais.

O Neo4j é o sistema de armazenamento das relações. A API retorna o subgrafo demonstrativo e o navegador executa busca em largura para apresentar alcance e um caminho mínimo por ativo. Esta escolha permite comparar o mesmo comportamento nos dois modos. Para grandes catálogos, a evolução necessária é filtrar ativos e executar travessias no servidor/Cypher.

A busca semântica gera um embedding da pergunta no servidor e consulta um índice vetorial Neo4j. Ela retorna ocorrências por similaridade e permite explorar o ativo relacionado. Esta versão não combina automaticamente score vetorial com proximidade no grafo e não inclui resposta gerada por LLM.

## Conectar ao Neo4j

1. Crie uma instância Neo4j Aura ou disponibilize Neo4j compatível com índices vetoriais.
2. Copie `.env.example` para `.env` e preencha URI, usuário, senha e banco. Não envie `.env` ao GitHub.
3. Execute `npm run seed`. A carga usa constraints e MERGE; repetir não duplica os dados. Ela adiciona somente os rótulos `DIAsset` e `DIIncident`, sem limpar o banco.
4. Altere `DATA_MODE=neo4j` e reinicie a aplicação.
5. Confira o indicador “Neo4j conectado”. O banco precisa conter a carga para que os cenários preparados funcionem.

Modelo:

```cypher
(:DIAsset {id, label, kind, owner, description})-[:FEEDS]->(:DIAsset)
(:DIIncident {id, title, description, resolution, evidence, tags, embedding})
  -[:OCCURRED_ON]->(:DIAsset)
```

Exemplo de impacto calculado diretamente no banco:

```cypher
MATCH p=(a:DIAsset {id: $assetId})-[:FEEDS*1..20]->(b:DIAsset)
RETURN b.id AS id, min(length(p)) AS distance
ORDER BY distance
```

Este exemplo limita a profundidade a 20 para proteger a consulta. A interface demonstrativa percorre todos os ativos retornados, com proteção contra ciclos. A leitura da API recusa mais de 500 ativos, 2.000 relações ou 200 incidentes em vez de mostrar silenciosamente um grafo truncado.

## Ativar embeddings

1. Com a carga já feita, configure `OPENAI_API_KEY` no servidor.
2. Execute `npm run embeddings`. Este comando envia os textos fictícios dos quatro incidentes ao provedor e pode gerar cobrança pela API.
3. Aguarde o índice `di_incident_embedding` ficar ONLINE. Verifique com `SHOW VECTOR INDEXES` no Neo4j.
4. Reinicie a aplicação com a mesma chave e modelo. Pesquise uma descrição na seção de incidentes.

Dimensão fixa: 1.536; modelo padrão: `text-embedding-3-small`. Se alterar o modelo, ele deve suportar a dimensão configurada e todos os vetores devem ser regenerados com o mesmo modelo. O script usa o índice vetorial e a procedure `db.index.vector.queryNodes`; verifique a compatibilidade com a versão da sua instância. A busca sem chave continua lexical e a interface informa isso. Similaridade não equivale a probabilidade de causa.

## Publicar na Vercel

1. Crie um repositório GitHub chamado `dataimpact` e envie os arquivos desta pasta, incluindo `package-lock.json`.
2. Na Vercel, use **Add New → Project** e importe esse repositório.
3. Selecione o preset **Other**, diretório raiz do projeto e saída **public**. Não é necessário comando de build; a instalação é `npm install`.
4. O arquivo `vercel.json` configura a saída e as funções em `/api`. Use runtime Node.js 22 ou superior.
5. Para uma publicação inicial sem custos de embeddings, use `DATA_MODE=demo`.
6. Para Neo4j, configure as variáveis do `.env.example` nas Environment Variables da Vercel, sem inserir segredos no código. Faça a carga localmente antes e publique novamente após alterar variáveis.
7. Confira `/api/graph`: deve indicar `mode: neo4j` ou `mode: demo`. Valide o grafo e a busca na URL publicada.

A API é somente leitura e pública por padrão. Publique apenas o conjunto fictício. A chave de embeddings pode gerar consumo por visitantes: antes de ampliar a divulgação, adicione autenticação e limitação de requisições/custos; alternativamente mantenha a busca lexical sem chave. Para uso corporativo, implemente controle de acesso também ao catálogo e às evidências. Prefira credenciais de leitura na aplicação; mantenha a carga com credencial separada.

## Roteiro de apresentação (3 minutos)

1. Problema: “Se esta fonte parar agora, quais decisões ficam comprometidas?”
2. Abra “Fechamento incompleto”. O alcance das vendas chega a cinco relatórios, mas preserva fornecedores.
3. Confira o caminho de vendas até o fechamento executivo e as equipes envolvidas.
4. Selecione o fechamento executivo e alterne para origem: ERP, CRM e contabilidade participam do resultado.
5. Pesquise “fechamento com valores menores”. Confira a evidência histórica e ressalte o modo de busca exibido.
6. Exporte a análise e mostre o teste que valida o caminho esperado.

## Validar

```bash
npm test
```

Oito testes verificam impacto por cenário, independência de suprimentos, origem do fechamento, ciclos, integridade das referências, busca lexical, API HTTP e interações da interface em DOM simulado. O layout visual ainda requer conferência em navegador; a conexão externa não foi validada sem credenciais. A pipeline GitHub Actions executa os testes. Banco, índice e provedor precisam de validação integrada na sua instância; testes unitários não comprovam conexão externa.

## Limitações e próximos passos

- Linhagem cadastrada por ativo, sem extração automática de SQL, integração AWS ou linhagem por coluna.
- Simulação qualitativa de alcance; não prevê probabilidade, duração, custo ou falha efetiva.
- Responsáveis são propriedades dos ativos, sem diretório real de pessoas.
- Um caminho por ativo, não todos os caminhos possíveis.
- Quatro incidentes são suficientes para demonstrar o fluxo, mas não para avaliar qualidade semântica em produção.
- Sem avaliação de relevância da busca semântica nesta entrega. Evolução: conjunto rotulado de consultas e comparação lexical/vetorial usando Recall@k.
- Fontes web são opcionais; sem internet o navegador usa fontes do sistema.

## Referências

- https://neo4j.com/docs/javascript-manual/current/
- https://neo4j.com/docs/cypher-manual/current/indexes/search-indexes/vector-indexes/
- https://vercel.com/docs/functions/runtimes/node-js

Licença MIT. Projeto de portfólio com dados inteiramente fictícios.

## Diagnóstico rápido

| Sintoma | Verificação |
| --- | --- |
| A interface continua em demonstração | Confira `DATA_MODE=neo4j` e reinicie ou publique novamente |
| Banco vazio | Execute `npm run seed` no mesmo banco configurado na aplicação |
| Erro 503 no grafo | Confira URI TLS, conectividade, credenciais, nome do banco e limites do catálogo |
| Busca semântica indisponível | Confira chave, modelo, dimensão, suporte à procedure e índice ONLINE |
| Deploy sem API | Confirme `/api` na raiz e `public` como saída; não publique somente o HTML como site estático |
| Termo sem resultado no demo | A busca lexical não infere sinônimos; experimente palavras do histórico |

A procedure vetorial usada atualmente foi depreciada em Neo4j 2026.04. Veja a [nota de compatibilidade](ARCHITECTURE.md#recuperação-de-incidentes) antes de ativar essa modalidade. Não há matriz de versões integrada já validada no projeto.
