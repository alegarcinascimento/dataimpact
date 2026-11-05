# Verificações e histórico de recuperação

[README](../README.md) · [Conectar dados](DATA_SOURCES.md)

## Ciclo demonstrativo

Abra `DataImpact_Demo.html` ou execute a aplicação em modo demo. O painel **Da detecção à recuperação** oferece três etapas:

| Etapa | Volume de vendas | Atualização | Resultado esperado |
| --- | ---: | --- | --- |
| Base saudável | 120 registros; mínimo 100 | Há 5 minutos; limite 60 | Nenhum alerta de vendas |
| Introduzir falha | 40 registros | Há 120 minutos | Baixo volume e atraso |
| Confirmar recuperação | 120 registros | Há 5 minutos | Dois alertas resolvidos, se a falha foi executada antes |

Os botões alteram somente os dados fictícios do navegador. O histórico demonstrativo usa armazenamento local do navegador, limitado às últimas 30 etapas. Não escreve no Neo4j ou na base de origem e não representa uma coleta real. A indisponibilidade do armazenamento local não impede a execução na sessão.

Selecione um alerta para rastrear seus consumidores. Um ativo dependente é potencialmente afetado; a ferramenta não confirma falha em cada consumidor.

## Registrar verificações de dados próprios

Configure o catálogo e faça a coleta conforme o [guia de dados](DATA_SOURCES.md). Depois execute:

```bash
npm run monitor
```

O comando lê o catálogo configurado em `DATA_MODE=file` ou `neo4j`, avalia as regras e registra uma execução com:

- ID único e horário da verificação.
- Métricas observadas e seus timestamps.
- Violações, evidências e caminhos de impacto.
- IDs de violações abertas desde a execução anterior.
- IDs de violações resolvidas desde a execução anterior.

Para confirmar recuperação, corrija a origem em um processo autorizado, faça nova coleta, atualize o catálogo e rode `npm run monitor` novamente. O comando não corrige ou reprocessa dados automaticamente. A ausência de alerta na última execução é avaliada apenas para as regras cadastradas.

## Armazenamento

| Modo | Destino | Leitura na interface |
| --- | --- | --- |
| `file` | `HISTORY_FILE`, padrão `.data/runs.json` | Últimas 30 execuções |
| `neo4j` | Nós `DIRun` e `DIFinding` | Últimas 30 execuções |
| `demo` | Etapas locais do navegador | Histórico demonstrativo |

No modo arquivo, o histórico aceita até 500 execuções, sem sobrescrever silenciosamente as anteriores; arquive-o antes de atingir o limite. Use um diretório local persistente e serialize as gravações por arquivo. O programa não implementa coordenação entre processos concorrentes nem armazenamento distribuído.

No Neo4j, cada execução mantém o payload do snapshot e cria relações `CHECKED` com os ativos e `HAS_FINDING` com seus achados. Cada achado aponta ao ativo de origem por `AFFECTS`. A escrita ocorre em uma transação. O comando administrativo precisa de permissões para constraints e gravação; a aplicação pode continuar usando credenciais somente de leitura.

A comparação com a execução anterior é feita antes da transação de escrita. Serialize as execuções por catálogo também no Neo4j; não há garantia de ordenação correta de transições quando múltiplos monitores gravam simultaneamente. A retenção no banco deve ser definida pelo operador.

```cypher
MATCH (r:DIRun)-[:HAS_FINDING]->(f:DIFinding)-[:AFFECTS]->(a:DIAsset)
RETURN r.at AS checked_at, a.label AS asset, f.rule AS rule, f.detail AS evidence
ORDER BY checked_at DESC
LIMIT 50;
```

A consulta mostra achados registrados, não todas as execuções saudáveis. Para consultar todas as execuções:

```cypher
MATCH (r:DIRun)
RETURN r.id AS run, r.at AS checked_at
ORDER BY checked_at DESC
LIMIT 30;
```

A persistência Neo4j foi implementada, mas ainda requer validação integrada em uma instância real. Os testes locais verificam histórico em arquivo e transições de abertura/recuperação.

## Limites de interpretação

`resolved` significa que uma violação presente na execução anterior não aparece na atual. Mudança ou remoção de uma regra, ativo ou catálogo também pode produzir essa transição; o sistema não atribui a recuperação automaticamente a uma ação corretiva. Mantenha catálogo e regras consistentes ao comparar execuções.

O monitor avalia snapshots já coletados; não inicia a coleta automaticamente. Uma falha do coletor que preserve o snapshot anterior deve ser tratada na orquestração. `observedAt` acompanha a evidência, mas ainda não há SLA separado para idade da coleta.

A API `GET /api/history` é somente leitura e não possui autenticação. O histórico pode conter nomes de ativos e métricas internas; proteja o acesso antes de disponibilizá-lo a terceiros.
