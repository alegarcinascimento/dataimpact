# Proposta de piloto técnico

[Pitch](../PITCH.md) · [Arquitetura](ARCHITECTURE.md) · [Métricas](METRICS.md) · [Experimento](RETRIEVAL_EXPERIMENT.md)

## Objetivo

Avaliar se o DataImpact ajuda a delimitar o impacto de um problema de dados e a recuperar ocorrências úteis para a investigação, com evidências rastreáveis e custo operacional conhecido.

A proposta pode ser discutida com uma equipe de dados do iFood ou de outra organização. Nenhum fluxo, necessidade interna ou resultado empresarial foi confirmado. A escolha do caso e o uso de dados dependem da equipe participante.

## Hipóteses separadas

| Hipótese | Comparação necessária | Medida principal |
| --- | --- | --- |
| O grafo ajuda a delimitar consumidores | Caminhos obtidos versus dependências revisadas pela equipe | Cobertura e falsos consumidores apontados |
| O contexto melhora a recuperação | Busca por palavras/vetores com e sem contexto | Cobertura e qualidade da ordem dos três primeiros resultados |
| A recuperação ajuda uma pessoa | Processo de investigação atual versus apoio da ferramenta | Tempo até a primeira evidência útil, revisada por avaliador |
| Códigos semânticos preservam utilidade | Vetores originais versus reconstrução quantizada | Perda de qualidade, colisões, memória e tempo |

Nenhuma hipótese está comprovada pelos oito exemplos sintéticos atuais. Uma vantagem de ranking não comprova redução de tempo de diagnóstico; os dois resultados precisam ser medidos separadamente.

## Escopo inicial sugerido

Um pipeline de teste, com fontes, transformações, produtos consumidores e responsáveis. Como ponto de partida para planejamento, considerar 20–50 ativos, 30–100 incidentes revisados e 20–40 perguntas de investigação. Esses números são sugestões de esforço, não um cálculo de amostra ou garantia de significância estatística.

A primeira etapa deve usar metadados e ocorrências sintéticas, anonimizadas ou explicitamente autorizadas. As permissões de uso do provedor de embeddings precisam ser definidas antes de enviar textos externos. Não é necessário importar registros transacionais para comparar recuperação de incidentes.

O coletor PostgreSQL cobre objetos selecionados e suas dependências de views registradas no catálogo. Dependências de orquestradores, processamento distribuído e ferramentas de BI precisam ser fornecidas ou integradas separadamente. Uma origem diferente exige adaptação do conector.

## Entregas por etapa

| Etapa proposta | Trabalho | Evidência para encerramento |
| --- | --- | --- |
| 1. Definir o recorte | Escolher fluxo, perguntas, dados permitidos e critérios | Contrato de dados e protocolo de avaliação aprovados pela equipe |
| 2. Validar integrações | Importar catálogo, revisar relações e executar verificações | Execução real com caminhos conferidos e sem alterações na origem |
| 3. Comparar recuperação | Executar os métodos, registrar modelos, configurações e resultados | Relatório por consulta e análise dos erros |
| 4. Testar investigação assistida | Revisar evidências e próximos passos com participantes | Tempos medidos, observações e limites documentados |
| 5. Decidir continuidade | Comparar qualidade, custo, complexidade e riscos | Recomendação de avançar, ajustar ou encerrar |

Uma agenda de duas a quatro semanas pode ser discutida depois da definição de acessos, equipe e escopo. Não constitui prazo de entrega assumido nem depende de aprovação já recebida.

## Protocolo de avaliação

**Gabarito independente.** As pessoas que definirem as ocorrências relevantes devem fazê-lo sem ver o ranking dos métodos. Diferenciar ocorrência útil para investigação de causa confirmada. No experimento atual a relevância é binária; se for necessário graduar utilidade, o código de avaliação deverá ser adaptado antes do teste.

**Controle de vazamento.** Separar períodos e evitar que cópias ou versões do mesmo incidente apareçam indevidamente em avaliação e ajuste. Reservar um conjunto final sem uso para escolher parâmetros. Treinar os codebooks somente no histórico permitido para treinamento.

**Comparação justa.** Usar as mesmas perguntas, incidentes e permissões. Registrar modelo, versão, dimensão, índice, estratégia de ranking e configuração de hardware. Comparar com o processo realmente usado pela equipe, não apenas com o baseline lexical simplificado do protótipo.

**Medição operacional.** Repetir execuções para estimar variabilidade. Medir geração de embeddings, consulta, travessia e ranking separadamente, além do tempo total. Uma implementação que reconstrói vetores e percorre o conjunto inteiro não demonstra a eficiência de um índice comprimido.

**Investigação com pessoas.** Usar tarefas comparáveis e controlar a ordem de apresentação para reduzir aprendizado. Registrar quando a pessoa encontrou uma evidência considerada útil pelo avaliador. Não atribuir à ferramenta uma correção realizada por outro processo.

## Critérios de decisão a acordar antes do teste

| Dimensão | Condição a definir |
| --- | --- |
| Recuperação | Ganho mínimo considerado útil e tolerância a piora em grupos de perguntas |
| Impacto | Limite de consumidores apontados incorretamente e cobertura exigida |
| Evidência | Referência verificável para cada ocorrência e caminho apresentado |
| Latência e custo | Orçamento de tempo, recursos e uso de provedor por consulta |
| Quantização | Perda máxima aceitável frente ao vetor original e política de colisões |
| Operação | Controle de acesso, observabilidade, retenção e capacidade de reproduzir resultados |

Os limites devem refletir o caso real. O repositório não fixa metas percentuais arbitrárias nem promete ganho de negócio.

## Riscos e controles

- **Linhagem incompleta:** revisar o catálogo e identificar relações fornecidas manualmente.
- **Ocorrências parecidas sem relação causal:** apresentar histórico como evidência de investigação, sem afirmar a causa.
- **Mudança nas regras ou ativos:** registrar alterações para interpretar transições de resolução.
- **Dados sensíveis e permissões:** manter a avaliação em ambiente controlado, com credenciais de leitura e conteúdo autorizado.
- **Códigos instáveis:** versionar os codebooks e preservar IDs operacionais independentes.
- **Dependência de infraestrutura:** validar driver, versão do Neo4j e suporte às consultas vetoriais da instância.

A aplicação pública de leitura ainda não possui autenticação ou rate limit. Esses controles são pré-requisitos para compartilhar catálogos internos, assim como a política de acesso ao histórico.

## O que apresentar na revisão técnica

1. O problema de investigação e o recorte escolhido.
2. A demonstração saudável/falha/recuperação.
3. O modelo de ativos, verificações e achados no grafo.
4. O ranking comparado, com evidências e métricas explicadas.
5. As limitações atuais e a hipótese a testar no piloto.

A travessia da interface atual é executada em JavaScript após leitura do catálogo; o Neo4j persiste relações, histórico e busca vetorial opcional. Para avaliar escala, a expansão seletiva em Cypher no servidor é uma evolução a implementar e medir. Não se deve apresentar a demonstração local como validação de capacidade do banco.
