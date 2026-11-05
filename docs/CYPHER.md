# Laboratório Cypher

[Voltar ao README](../README.md) · [Arquitetura](ARCHITECTURE.md)

Estas consultas servem para explorar o conjunto carregado por `npm run seed` no Neo4j. Os resultados esperados foram derivados do conjunto versionado e de testes JavaScript; as consultas abaixo ainda precisam de execução e validação na instância de avaliação. Não dependem de APOC ou GDS.

A interface atual lê o grafo pela API e calcula o alcance no navegador. As consultas deste laboratório são exemplos para revisão e para a evolução da travessia no servidor.

## 1. Conferir a carga

```cypher
MATCH (a:DIAsset)
RETURN a.kind AS category, count(*) AS assets
ORDER BY category;
```

| Categoria | Resultado esperado |
| --- | ---: |
| `job` | 9 |
| `report` | 6 |
| `source` | 4 |
| `table` | 9 |

```cypher
MATCH (:DIAsset)-[r:FEEDS]->(:DIAsset)
RETURN count(r) AS dependencies;
```

Esperado: **28**. Depois, confirme os incidentes:

```cypher
MATCH (:DIIncident)-[r:OCCURRED_ON]->(:DIAsset)
RETURN count(r) AS incident_links;
```

Esperado: **4**. Valores maiores podem indicar que o banco já contém dados adicionais com os mesmos labels.

## 2. Visualizar as dependências

```cypher
MATCH p=(:DIAsset)-[:FEEDS]->(:DIAsset)
RETURN p
LIMIT 100;
```

Explore o resultado na visualização de grafo da ferramenta Neo4j utilizada. O limite é suficiente para o conjunto demonstrativo, mas não representa extração completa de um catálogo maior.

## 3. Descobrir relatórios potencialmente afetados

```cypher
MATCH p=(origin:DIAsset {id: 'rawSales'})-[:FEEDS*1..20]->(report:DIAsset)
WHERE report.kind = 'report'
RETURN report.id AS id,
       report.label AS report,
       min(length(p)) AS minimum_hops
ORDER BY report;
```

Esperado: cinco relatórios: **Conciliação contábil**, **Fechamento executivo**, **Painel comercial**, **Painel de margem** e **Projeção de receita**. O **Painel de fornecedores** fica fora do resultado.

A agregação evita repetir o relatório quando há caminhos compartilhados. O limite de 20 relações atende ao seed; não implica completude para qualquer catálogo.

## 4. Explicar um caminho até o fechamento

```cypher
MATCH p=(origin:DIAsset {id: 'rawSales'})-[:FEEDS*1..20]->(target:DIAsset {id: 'boardReport'})
RETURN [node IN nodes(p) | node.label] AS dependency_path,
       length(p) AS hops
ORDER BY hops
LIMIT 1;
```

Esperado: **raw.vendas → Validação de vendas → trusted.vendas → Consolidação comercial → mart.receita → Cálculo de fechamento → mart.fechamento → Fechamento executivo**, com sete relações.

Esta consulta enumera caminhos limitados e ordena o resultado. Ela é didática e não deve ser apresentada como uma implementação otimizada de shortest path. Em grafos maiores, avalie os recursos de seleção de caminhos da versão utilizada e examine o plano.

## 5. Rastrear as fontes de um relatório

```cypher
MATCH (source:DIAsset)-[:FEEDS*1..20]->(report:DIAsset {id: 'boardReport'})
WHERE source.kind = 'source'
RETURN DISTINCT source.id AS id, source.label AS source
ORDER BY source;
```

Esperado: **CRM clientes**, **ERP comercial** e **Sistema contábil**. A consulta percorre o fluxo em direção ao relatório, retornando seus antecessores; esse é o mesmo problema que a interface apresenta como origem a montante.

## 6. Identificar as equipes no alcance

```cypher
MATCH (origin:DIAsset {id: 'rawSales'})-[:FEEDS*1..20]->(dependent:DIAsset)
WHERE dependent <> origin
RETURN dependent.owner AS team,
       count(DISTINCT dependent) AS assets_in_scope
ORDER BY assets_in_scope DESC, team;
```

Esperado: **sete equipes distintas**. A equipe do ativo selecionado só aparece se também for responsável por algum consumidor alcançado, como ocorre neste seed.

## 7. Recuperar histórico ligado à origem de um relatório

```cypher
MATCH (incident:DIIncident)-[:OCCURRED_ON]->(origin:DIAsset)
MATCH (origin)-[:FEEDS*0..20]->(report:DIAsset {id: 'boardReport'})
RETURN DISTINCT incident.id AS incident,
       incident.title AS title,
       origin.label AS related_asset,
       incident.resolution AS historical_resolution
ORDER BY incident;
```

Esperado: `INC-019`, `INC-028` e `INC-041`. A ocorrência de fornecedores fica fora. Esta consulta mostra como o relacionamento persistido pode contextualizar o histórico; esse filtro topológico ainda não é aplicado automaticamente pela busca da interface.

## 8. Validar um caso sem propagação entre domínios

```cypher
MATCH (origin:DIAsset {id: 'rawVendor'})-[:FEEDS*1..20]->(report:DIAsset)
WHERE report.kind = 'report'
RETURN DISTINCT report.label AS report;
```

Esperado: somente **Painel de fornecedores**. Esse caso testa a precisão da propagação: destacar toda a rede seria um resultado incorreto.

## 9. Conferir o índice vetorial

Depois de configurar o provedor e executar `npm run embeddings`:

```cypher
SHOW VECTOR INDEXES
YIELD name, state, populationPercent
WHERE name = 'di_incident_embedding'
RETURN name, state, populationPercent;
```

Aguarde `ONLINE`. Para consultar, forneça `$embedding` com 1.536 dimensões, gerado pelo mesmo modelo usado na carga:

```cypher
CALL db.index.vector.queryNodes('di_incident_embedding', 4, $embedding)
YIELD node, score
RETURN node.id AS incident, node.title AS title, score
ORDER BY score DESC;
```

Não há resultado esperado fixo para a ordem semântica: ela depende dos vetores gerados. Não use o score como probabilidade de causa. A procedure é usada pelo código atual e foi depreciada em Neo4j 2026.04 em favor de `SEARCH`; consulte a [compatibilidade oficial](https://neo4j.com/docs/cypher-manual/current/deprecations-additions-removals-compatibility/) para planejar a migração.

## 10. Avaliar o plano antes de escalar

```cypher
EXPLAIN
MATCH (origin:DIAsset {id: 'rawSales'})-[:FEEDS*1..20]->(dependent:DIAsset)
RETURN DISTINCT dependent.id;
```

Verifique o acesso ao nó inicial por índice/constraint e a expansão por tipo e direção. Use `PROFILE` em ambiente controlado para medir linhas e DB hits: ao contrário de `EXPLAIN`, ele executa a consulta. Um limite de profundidade reduz o espaço de busca, mas caminhos alternativos ainda podem crescer de forma combinatória. Não há benchmark publicado para estas consultas.

## Referências

- [Padrões de comprimento variável](https://neo4j.com/docs/cypher-manual/current/patterns/variable-length-paths/)
- [Índices vetoriais](https://neo4j.com/docs/cypher-manual/current/indexes/search-indexes/vector-indexes/)
- [Planejamento e execução](https://neo4j.com/docs/cypher-manual/current/planning-and-tuning/)
