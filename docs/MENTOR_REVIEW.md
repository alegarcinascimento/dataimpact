# Guia de avaliação para mentores

[Voltar ao README](../README.md) · [Laboratório Cypher](CYPHER.md)

## O que este projeto procura demonstrar

O DataImpact aplica grafos a um problema operacional de engenharia de dados: explicar o alcance de uma dependência e apoiar a investigação com contexto histórico. O foco da avaliação é a coerência entre problema, modelo, comportamento e evidência.

A proposta combina relações direcionadas, caminhos explicáveis, carga idempotente e busca vetorial opcional. Não foi apresentado como produto de produção nem como mecanismo de confirmação automática de causa raiz.

## Percurso sugerido: cinco minutos

| Tempo | Ação | Evidência a observar |
| --- | --- | --- |
| 0:00–0:45 | Executar o HTML autônomo ou `npm run dev` | Aplicação identificada como demonstração com dados fictícios |
| 0:45–1:30 | Escolher “Fechamento incompleto” | 13 consumidores, 5 relatórios, 7 equipes |
| 1:30–2:15 | Abrir o caminho até o fechamento executivo | Cadeia com sete relações a partir de `raw.vendas` |
| 2:15–3:00 | Selecionar o fechamento e alternar para origem | ERP, CRM e contabilidade no mesmo contexto |
| 3:00–3:45 | Explorar a origem de fornecedores | Apenas um relatório dependente; domínio comercial preservado |
| 3:45–4:30 | Pesquisar “fechamento com valores menores” | Evidência e solução histórica; modo da busca explícito |
| 4:30–5:00 | Abrir testes e consultas | Resultados reproduzíveis, com limites documentados |

A interface tem três botões de cenário. O caso de fornecedores pode ser acessado pela busca de ativos ou pelo grafo.

## Como avaliar a integração real

O HTML autônomo e o modo demo não usam Neo4j. Para avaliar persistência e recuperação reais, execute a carga e ative `DATA_MODE=neo4j`, conforme o [guia de instalação](INSTALLATION.md). Confira `mode: neo4j` em `/api/graph` e explore os labels e relações no banco.

Para embeddings, confirme o índice `ONLINE`, execute uma consulta e confira `mode: semantic` em `/api/search?q=...`. A ausência de chave mantém busca lexical. A existência de código não substitui uma execução integrada bem-sucedida; essa execução externa ainda não está registrada neste repositório.

## Matriz de evidências

| Aspecto | Onde revisar | O que já está disponível | O que falta comprovar |
| --- | --- | --- | --- |
| Domínio | `lib/data.js` | Conjunto coerente de fontes, processos, tabelas e produtos | Metadados reais anonimizados |
| Identidade | `scripts/seed.js` | Constraints e `MERGE` por ID | Execução repetida em instância real |
| Dependências | `lib/graph.js`, `public/graph.js` | BFS, visita única e um caminho por ativo | Desempenho em escala |
| API | `api/graph.js`, `api/search.js` | Métodos, validação e erros explícitos | Deploy externo e política de acesso |
| Neo4j | `lib/db.js` | Driver reutilizado, parâmetros e timeout | Integração na instância do avaliador |
| Recuperação | `scripts/embeddings.js`, `api/search.js` | Índice vetorial e busca real implementados | Recall@k e relevância com histórico maior |
| Interface | `tests/ui.test.js` | Interações em DOM simulado | Revisão visual em navegador |
| Qualidade | `.github/workflows/ci.yml` | Suíte automatizada no GitHub Actions | Testes de integração e carga |

## Oito testes, oito evidências

| Teste | Afirmação verificada |
| --- | --- |
| Propagação de vendas | Cinco relatórios alcançados, fornecedores fora e caminho esperado |
| Origem do fechamento | ERP, CRM e contabilidade como fontes |
| Domínio de fornecedores | Apenas seu relatório alcançado |
| Ciclo | Visita finita, sem repetir IDs |
| Busca lexical | Normalização de acentos e ausência de resultado para termo sem correspondência |
| Integridade | IDs únicos e referências válidas |
| HTTP | Dados demo, busca, entrada inválida e método não permitido |
| Interface | Nós renderizados, simulação, cenário, pesquisa de ativo, reset e direção |

As duas cópias da lógica de grafo devem permanecer equivalentes. A suíte de domínio usa `lib/graph.js`; o teste da interface injeta essa lógica em DOM simulado. A sincronização de `public/graph.js` deve ser verificada ao modificar o algoritmo.

## Perguntas técnicas que merecem discussão

1. Em qual tamanho de catálogo vale mover a travessia para o banco? Que orçamento de nós, profundidade e tempo a API deve impor?
2. Quais consultas justificariam labels especializados ou equipes como nós?
3. Qual relação adicional ajudaria a diferenciar dependência técnica de criticidade de negócio?
4. Como registrar vigência, origem e confiança de uma relação de linhagem?
5. Como avaliar se proximidade no grafo melhora os resultados da busca vetorial?
6. Como lidar com mudança de modelo de embeddings e reconstrução de índice?
7. Como testar equivalência entre travessia no navegador e consultas Cypher?

## Próximo experimento proposto

Criar um histórico maior de incidentes com perguntas e respostas relevantes rotuladas. Comparar busca lexical, vetorial e uma variante com filtro ou reranking topológico. Medir Recall@k, falsos candidatos sem conexão com o ativo e latência por etapa. Registrar modelo, dimensão, versão Neo4j e configuração do índice para permitir reprodução.

A hipótese a testar é: **o contexto de dependências pode melhorar a relevância operacional das ocorrências recuperadas por similaridade textual**. Isso é uma proposta de avaliação, ainda sem resultados.

## Como contribuir com a revisão

Abra uma [issue](https://github.com/alegarcinascimento/dataimpact/issues/new) com o cenário, a ação executada, o comportamento observado e o resultado esperado. Para sugestões de modelagem ou Cypher, indique qual pergunta de negócio a mudança permite responder e como validar sua correção.
