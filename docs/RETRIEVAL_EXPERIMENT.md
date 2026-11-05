# Recuperação de incidentes: experimento reproduzível

[README](../README.md) · [Dados próprios](DATA_SOURCES.md) · [Histórico](MONITORING.md)

## Pergunta de avaliação

O contexto de dependências melhora a recuperação de ocorrências úteis para investigar um problema de dados? Semantic IDs preservam relevância quando os vetores dos incidentes são quantizados?

O experimento compara métodos no mesmo conjunto, com gabarito explícito. A demonstração não contém um agente autônomo, um recomendador generativo ou um modelo treinado com incidentes de produção.

## Conjunto de avaliação

[`experiments/dataset.json`](../experiments/dataset.json) contém 24 incidentes fictícios e oito consultas com ativo investigado e IDs relevantes. Os casos incluem carga parcial, cadastro atrasado, duplicidade, custo ausente, partição incorreta e entregas de fornecedores.

O conjunto e o gabarito foram escritos manualmente. Algumas perguntas compartilham termos com as descrições. Não há separação cega entre elaboração do conjunto e avaliação. Os resultados são descritivos e não estimam desempenho em produção.

## Métodos

| Método | Recuperação | Contexto do grafo |
| --- | --- | --- |
| `lexical` | Correspondência de palavras, baseline atual | Não |
| `lexical_graph` | Mesmo ranking lexical | Prioriza candidatos conectados ao ativo investigado |
| `vector` | Cosseno entre embedding da consulta e dos incidentes | Não |
| `vector_graph` | Mesmo ranking vetorial | Sim |
| `sid_reconstructed` | Cosseno com vetores reconstruídos dos códigos residuais | Não |
| `sid_graph` | Mesmo ranking quantizado | Sim |

O contexto considera antecessores e descendentes do ativo e prioriza candidatos conectados entre os candidatos recuperados. Não comprova relação causal e pode suprimir ocorrências úteis de outros domínios. Os incidentes lexicais sem correspondência continuam ausentes da busca lexical com grafo.

## Como ler os indicadores

**Recall@3** é a cobertura das ocorrências relevantes nas três primeiras sugestões. **NDCG@3** avalia se as ocorrências relevantes ficaram nas melhores posições. São medidas de recuperação de informação, não de resolução de incidentes. Veja os [exemplos em linguagem simples](METRICS.md).

## Resultados já executados

O [relatório versionado](../public/retrieval-report.json) apresenta:

| Método | Recall@3 médio | NDCG@3 médio |
| --- | ---: | ---: |
| Palavras | 0,8542 | 0,8753 |
| Palavras + grafo | 0,9583 | 0,9429 |
| Embeddings | Não avaliado sem vetores |
| Códigos residuais sobre embeddings | Não avaliado sem vetores |

Esses valores não devem ser anunciados como ganho de acurácia de um agente. São medidas de recuperação em oito consultas sintéticas. O contexto também acrescenta processamento; não há evidência de redução de latência ponta a ponta.

O JSON inclui resultados por pergunta, hash do conjunto, ambiente, data e tempos de ranking. O tempo medido usa uma única passagem em um processo, excluindo provedor, rede, banco, treinamento, interface e geração dos embeddings. Percentis com oito observações são frágeis; os tempos não são um benchmark de capacidade ou SLA.

## Reproduzir o baseline sem credenciais

```bash
npm ci
npm run evaluate
```

O resultado padrão fica em `.data/retrieval-report.json`, fora do Git. Para atualizar a demonstração pública, somente com o conjunto sintético:

```bash
npm run evaluate -- --output public/retrieval-report.json
node scripts/build-preview.js
```

O laboratório na interface permite escolher cada pergunta e comparar os candidatos e passos históricos. Ele é restrito ao modo demonstração, para não misturar o conjunto fictício com catálogos próprios.

## Executar com embeddings

Configure `OPENAI_API_KEY` e, opcionalmente, `EMBEDDING_MODEL` no ambiente:

```bash
npm run evaluate -- --embed
```

Esse comando envia títulos e descrições dos incidentes e textos das perguntas ao provedor, podendo gerar cobrança. Ele não envia o gabarito ou os IDs como texto de embedding. Usa 1.536 dimensões e o modelo padrão `text-embedding-3-small`. O relatório registra modelo, tempo da chamada e uso de tokens, quando retornado; não estima valor monetário.

Alternativamente:

```bash
npm run evaluate -- --vectors caminho/embeddings.json
```

O arquivo deve conter `datasetHash`, `model`, `incidents` como mapa de ID para vetor e `queries` como mapa de ID para vetor. Use o hash do relatório baseline. Todos os vetores devem ter a mesma dimensão e números finitos. A origem de vetores fornecidos é marcada como `provided_unverified`; o programa não consegue comprovar que eles foram gerados pelo modelo declarado.

Os vetores não são publicados automaticamente, nem gravados em arquivo pelo modo `--embed`. Preserve entradas e configuração em ambiente autorizado se precisar auditar a geração posteriormente.

## O que foi implementado como Semantic IDs

[`lib/sids.js`](../lib/sids.js) implementa **quantização residual com k-means**, com até três níveis e quatro centroides por nível por padrão. Os codebooks são ajustados somente aos vetores dos incidentes, sem usar perguntas ou rótulos de relevância. A inicialização é determinística para a ordem de entrada. Cada incidente recebe uma sequência de índices de centroides.

O vetor aproximado é reconstruído pela soma dos centroides selecionados. A consulta é comparada a esse vetor por cosseno; o código não treina um Transformer para gerar identificadores. Portanto, é um experimento de representação quantizada, não uma reprodução do TIGER ou RQ-VAE.

Os códigos podem colidir e não substituem o ID estável de um incidente. O relatório registra códigos, número de sequências distintas e colisões. O resultado depende do conjunto, embeddings, dimensão e configuração; códigos não são uma taxonomia legível garantida e podem mudar quando o treinamento mudar.

O teste automatizado do pipeline usa vetores numéricos artificiais exclusivamente para verificar a implementação. Seus resultados não são publicados como evidência semântica.

## Próximas evidências necessárias

- Histórico maior e autorizado, com causas e resoluções confirmadas.
- Perguntas e relevâncias rotuladas independentemente da implementação.
- Divisão temporal e controle de duplicatas para reduzir vazamento.
- Medidas de qualidade e latência ponta a ponta, com repetições e custos.
- Comparação com busca vetorial indexada: o experimento atual percorre os vetores em memória.
- Avaliação de deriva, colisões e estabilidade dos códigos ao atualizar o conjunto.

## Referência

[Rajput et al.: Recommender Systems with Generative Retrieval, NeurIPS 2023](https://proceedings.neurips.cc/paper/2023/hash/20dcab0f14046a5c6b02b61da9f13229-Abstract.html)
