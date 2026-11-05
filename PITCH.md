# DataImpact
## Investigação de problemas de dados com contexto, evidência e histórico

**Proposta:** testar se combinar dependências em grafo com recuperação de incidentes ajuda uma equipe de dados a encontrar evidências úteis e delimitar o impacto de uma falha.

[Executar a demonstração](README.md#demonstração-em-três-passos) · [Plano de piloto](docs/PILOT_PROPOSAL.md) · [Como interpretar as métricas](docs/METRICS.md) · [Código e testes](tests)

## O problema

Um alerta informa que uma base está atrasada ou recebeu menos registros. A investigação ainda precisa esclarecer quais consumidores dependem dela, quais equipes participam do fluxo e se existe uma ocorrência anterior que ajude a decidir o próximo passo.

O DataImpact reúne essas informações em uma investigação visual. O usuário vê a regra violada, percorre o caminho até os consumidores e consulta passos registrados em ocorrências semelhantes. A ferramenta preserva as verificações para acompanhar a recuperação.

## A conexão com a discussão do GDG Campinas

A programação de 4 de novembro de 2026 reuniu dois temas complementares: recomendação e busca generativas, apresentados por Feliphe Galiza, e memória e contexto em grafos para agentes, apresentados por Eliézer Zarpelão. A proposta do DataImpact é investigar a aplicação dessas ideias à operação de dados.

A contribuição a testar é específica: **a semelhança entre descrições ajuda a encontrar candidatos; a dependência entre ativos ajuda a contextualizar esses candidatos**. Essa combinação pode orientar a investigação, mas seu benefício precisa ser avaliado.

[Programação oficial do evento](https://gdg.community.dev/events/details/google-gdg-campinas-presents-da-estatistica-aos-agentes-de-ia-dados-e-blockchain-na-pratica/).

## O que pode ser visto hoje

| Experiência | Evidência disponível |
| --- | --- |
| Base saudável, falha e recuperação | Ciclo fictício executável no navegador |
| Impacto da origem nos consumidores | Caminhos no catálogo e equipes responsáveis |
| Dados próprios | Importação JSON/CSV, perfil de CSV e coletor PostgreSQL implementados |
| Memória operacional | Verificações, achados e transições em arquivo ou Neo4j |
| Comparação de recuperação | 24 incidentes fictícios, oito perguntas e gabarito explícito |
| Experimento de Semantic IDs | Quantização residual implementada, com execução vetorial opcional |
| Validação automatizada | 24 testes, incluindo o HTML autônomo |

As integrações PostgreSQL e Neo4j precisam de execução em instâncias reais para validação conjunta. O laboratório ainda não demonstrou benefício de embeddings ou Semantic IDs: faltam os vetores e a execução correspondente. A implementação experimental usa k-means residual, sem RQ-VAE ou recomendador generativo.

## Um piloto possível no contexto do iFood

Selecionar um fluxo de dados em ambiente de teste e um histórico autorizado de incidentes. Comparar o processo atual com a investigação contextualizada pelo DataImpact, medindo qualidade das ocorrências recuperadas, tempo até uma evidência útil e custo de operação.

Um cenário ilustrativo seria uma base de pedidos com carga parcial e consumidores operacionais ou analíticos dependentes. O catálogo, os consumidores e os critérios seriam definidos pela equipe participante; não representam uma descrição dos sistemas internos do iFood.

**Solicitação concreta:** revisão técnica do protótipo e, havendo interesse, definição conjunta de um recorte de avaliação, seus dados autorizados e critérios de sucesso. Não é necessário acesso à produção para a primeira etapa.

## O resultado que buscamos

Uma conclusão verificável: em quais condições o contexto do grafo melhora a investigação, quando não ajuda e se a representação por códigos semânticos justifica sua complexidade. A decisão sobre adoção viria depois dessa comparação.

Projeto independente. Não há parceria, integração ou endosso do iFood, da Neo4j ou dos palestrantes. Os resultados publicados são sintéticos e não comprovam redução de incidentes, ganho financeiro ou desempenho de produção.
