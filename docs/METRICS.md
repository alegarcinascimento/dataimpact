# Como interpretar os resultados de busca

[README](../README.md) · [Experimento reproduzível](RETRIEVAL_EXPERIMENT.md)

## Primeiro, o significado de “relevante”

Uma pessoa marca quais incidentes anteriores seriam úteis para investigar cada pergunta. Esse conjunto é o gabarito. O programa compara os resultados recuperados com esse gabarito; ele não descobre sozinho a resposta correta.

No conjunto atual, a relevância é binária: uma ocorrência é marcada como relevante ou não. Todos os itens relevantes têm o mesmo peso. Os resultados medem a busca de ocorrências, não a qualidade global do sistema nem a confirmação de causa raiz.

## Recall@3: cobertura nos três primeiros resultados

Pergunta respondida: **“Dos incidentes que deveriam ser encontrados, quantos apareceram entre as três primeiras sugestões?”**

Suponha que o gabarito indique três ocorrências úteis, A, B e C. A ferramenta apresenta A, X e B. Encontrou duas das três relevantes: o Recall@3 é **2/3 = 66,7%**.

O `@3` significa que olhamos apenas as três primeiras posições. Se existirem mais de três ocorrências relevantes, não é possível obter 100% nessa pergunta com apenas três sugestões. A métrica depende da composição do gabarito.

## NDCG@3: qualidade da ordem nos três primeiros resultados

Pergunta respondida: **“As ocorrências relevantes ficaram nas melhores posições?”**

A medida dá mais peso às primeiras posições e compara a lista apresentada com a melhor ordenação possível para o mesmo gabarito. O resultado normalizado vai de 0 a 1; valores maiores representam uma ordenação melhor segundo os rótulos usados.

Com A, B e C relevantes:

| Lista apresentada | Cobertura (Recall@3) | Qualidade da ordem (NDCG@3) |
| --- | ---: | ---: |
| A, B, C | 100% | 1,000 |
| A, X, B | 66,7% | 0,704 |
| X, A, B | 66,7% | 0,531 |

As duas últimas listas recuperam a mesma quantidade de ocorrências úteis. A primeira delas é melhor ordenada porque já apresenta uma ocorrência relevante na posição inicial.

A sigla significa *Normalized Discounted Cumulative Gain*. No código atual, uma ocorrência relevante contribui `1 / log2(posição + 1)`; uma não relevante contribui zero. A soma é dividida pela soma da ordenação ideal. A normalização permite comparar listas com quantidades diferentes de ocorrências relevantes, mas não elimina vieses do conjunto de avaliação.

## Precision@3: utilidade das três sugestões

Pergunta respondida: **“Das três sugestões, quantas eram relevantes?”**

Se A, X e B aparecem e apenas A e B são relevantes, a precisão é **2/3 = 66,7%**. No programa, o denominador continua três mesmo que a busca devolva menos resultados. Recall usa a quantidade de ocorrências relevantes no gabarito; precisão usa a quantidade de posições avaliadas.

## Os números atuais do DataImpact

| Método | Cobertura média nos três primeiros | Qualidade média da ordem |
| --- | ---: | ---: |
| Palavras | 85,4% | 0,875 |
| Palavras + contexto do grafo | 95,8% | 0,943 |

O programa calcula a métrica para cada uma das oito perguntas e depois faz a média simples: cada pergunta tem o mesmo peso. Isso não significa que o sistema resolveu 95,8% dos incidentes nem que reduziu o tempo de investigação nessa proporção.

A diferença de cobertura é **10,4 pontos percentuais** nesse conjunto sintético. O conjunto tem apenas 24 ocorrências, perguntas elaboradas manualmente e relevâncias definidas pelo mesmo processo de elaboração. Não há intervalo de confiança, comparação cega ou validação externa. Embeddings e Semantic IDs continuam sem resultado de qualidade medido na execução publicada.

## Como usar essas medidas na avaliação

Defina primeiro qual decisão precisa melhorar. Para uma pessoa investigando um alerta, encontrar uma evidência útil cedo pode ser mais importante que aumentar o número total de resultados. Combine métricas de busca com revisão humana, tempo até evidência útil, custo e análise dos erros.

Um valor alto pode esconder perguntas ou domínios com desempenho ruim. Revise resultados por consulta, fontes fora do catálogo e ocorrências novas. Uma sugestão textual parecida pode ser irrelevante para o ativo investigado; uma ocorrência de outro domínio também pode conter uma solução útil. O contexto do grafo deve ser testado, não assumido como sempre benéfico.
