# Contribuindo com o DataImpact

Obrigado por revisar o projeto. Uma contribuição útil conecta uma mudança a uma pergunta de negócio e a um resultado que possa ser reproduzido.

## Executar e validar

```bash
npm ci
npm test
npm run dev
```

Use Node.js 22 ou superior. Não são necessárias credenciais para os testes atuais nem para a demonstração.

## Propor mudanças

Abra uma issue ou pull request com o problema concreto, o comportamento esperado, a solução e a validação realizada. Mantenha mudanças focadas. Ao alterar o modelo, documente direção e significado das relações e ajuste as consultas e contagens afetadas.

Ao mudar a travessia, mantenha `lib/graph.js` e `public/graph.js` equivalentes. Atualize o HTML autônomo com:

```bash
node scripts/build-preview.js
```

Casos úteis de teste incluem caminhos compartilhados, ciclos, nós sem dependências e referências inconsistentes. Evite testes que apenas repetem a implementação; valide a consequência de negócio.

## Dados e credenciais

Use somente dados fictícios ou material explicitamente autorizado e anonimizado. Não inclua `.env`, tokens, chaves, senhas ou exemplos com dados internos de organizações. Registre versões e configurações sem expor segredos ao relatar falhas de integração.

## Afirmações e benchmarks

Diferencie funcionalidades implementadas de propostas. Ao relatar desempenho ou qualidade de recuperação, informe o conjunto usado, metodologia, ambiente, versão e limites. Não trate similaridade vetorial como confirmação de causa.

## Áreas de contribuição

| Área | Entrega útil |
| --- | --- |
| Neo4j | Teste integrado reproduzível e migração vetorial para `SEARCH` na versão alvo |
| Modelagem | Vigência e proveniência de relações ou responsabilidades como entidades |
| Recuperação | Conjunto rotulado e comparação entre lexical, vetorial e contexto topológico |
| Escala | Expansão seletiva no servidor com limites e medidas de plano/latência |
| Experiência | Revisão de acessibilidade, layout móvel e exploração em navegador |

As contribuições são distribuídas sob a [licença MIT](LICENSE) do repositório.
