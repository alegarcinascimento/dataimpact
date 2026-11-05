# Instalação e configuração

[Voltar ao README](../README.md) · [Arquitetura](ARCHITECTURE.md) · [Validação técnica](VALIDATION.md)

Este guia descreve a instalação a partir do código, a configuração do Neo4j e a adaptação do conjunto de dados. Execute os comandos na raiz do repositório.

## Requisitos

| Componente | Requisito |
| --- | --- |
| Node.js | Versão 22 ou superior |
| npm | Compatível com a versão do Node.js utilizada |
| Git | Para clonar e atualizar o código |
| Neo4j | Instância acessível pelo driver oficial; opcional no modo demo |
| Provedor de embeddings | Opcional; necessário apenas para a busca semântica |

O único pacote de produção é o driver oficial do Neo4j. A interface usa HTML, CSS, JavaScript e SVG. Não há build obrigatório para executar o servidor local.

## 1. Clonar e instalar

```bash
git clone https://github.com/alegarcinascimento/dataimpact.git
cd dataimpact
npm ci
```

`npm ci` utiliza o lockfile versionado para reproduzir a instalação.

## 2. Executar sem banco

```bash
npm run dev
```

Abra **http://localhost:3000**. Na ausência de configuração, a API usa os dados fictícios e a busca lexical. Para uma execução autônoma sem servidor, abra [`DataImpact_Demo.html`](../DataImpact_Demo.html) no navegador.

## 3. Configurar as variáveis

```bash
cp .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env`. Edite o arquivo localmente:

| Variável | Uso | Valor ou orientação |
| --- | --- | --- |
| `DATA_MODE` | Selecionar a fonte de dados | `demo` ou `neo4j`; somente `neo4j` ativa o banco |
| `NEO4J_URI` | Endereço da instância | Use a URI fornecida pela instância, incluindo o esquema TLS apropriado |
| `NEO4J_USERNAME` | Usuário de conexão | Usuário autorizado no banco |
| `NEO4J_PASSWORD` | Senha | Mantenha apenas no ambiente local ou no gerenciador de segredos |
| `NEO4J_DATABASE` | Banco de destino | Padrão `neo4j` |
| `OPENAI_API_KEY` | Busca semântica opcional | Sem chave, a busca permanece lexical |
| `EMBEDDING_MODEL` | Modelo de embeddings | Padrão `text-embedding-3-small` |
| `PORT` | Porta do servidor | Padrão `3000` |

Não versione `.env`. A aplicação lê esse arquivo pelos scripts npm. As credenciais ficam no servidor e não devem ser inseridas na interface.

## 4. Carregar o Neo4j

Preencha a conexão e execute:

```bash
npm run seed
```

O comando verifica conectividade, cria constraints de unicidade e carrega o conjunto usando `MERGE`. Ele cria 28 ativos, 4 incidentes, 28 relações `FEEDS` e 4 relações `OCCURRED_ON` quando executado em um banco sem esses dados.

A carga requer permissões para criar constraints e gravar dados. Repetir o mesmo seed não duplica seus elementos, mas a operação não remove relações antigas após alterações no arquivo. Prefira um banco separado para desenvolvimento.

Defina `DATA_MODE=neo4j` no `.env` e reinicie:

```bash
npm run dev
```

Confira o indicador **Neo4j conectado** e a resposta de **http://localhost:3000/api/graph**, que deve conter `mode: neo4j`. Uma falha de conexão retorna erro; o sistema não troca silenciosamente para os dados de demonstração.

## 5. Ativar a busca semântica, se necessário

Com a carga concluída:

1. Configure `OPENAI_API_KEY` e o modelo no `.env`.
2. Execute `npm run embeddings`.
3. Aguarde o índice ficar `ONLINE`.
4. Reinicie a aplicação e faça uma pesquisa de incidente.

```cypher
SHOW VECTOR INDEXES
YIELD name, state, populationPercent
WHERE name = 'di_incident_embedding'
RETURN name, state, populationPercent;
```

O comando envia título e descrição dos quatro incidentes fictícios ao provedor e pode gerar cobrança. Os vetores usam 1.536 dimensões e similaridade de cosseno. Carga e consulta devem usar o mesmo modelo e dimensão; ao trocar o modelo, regenere todos os vetores.

A implementação atual usa `db.index.vector.queryNodes`, depreciada em Neo4j 2026.04 em favor de `SEARCH`. Confira a compatibilidade da sua instância e a [nota técnica](ARCHITECTURE.md#recuperação-de-incidentes). Não há matriz de versões integrada já validada no projeto.

Confirme `mode: semantic` na resposta de `/api/search?q=fechamento%20menores`. Similaridade não representa probabilidade de causa. Sem chave, a consulta continua lexical e a interface informa isso.

## 6. Validar a instalação

```bash
npm test
```

A suíte contém oito testes para cenários, ciclos, integridade, busca lexical, API HTTP e interações em DOM simulado. Confira também os [critérios funcionais](VALIDATION.md) e o [laboratório Cypher](CYPHER.md).

Os testes automatizados atuais não comprovam conexão externa com Neo4j ou provedor de embeddings. Valide essas integrações no ambiente utilizado. O layout visual requer revisão em navegador.

Para iniciar o mesmo servidor usando o comando convencional:

```bash
npm start
```

`npm start` e `npm run dev` executam o mesmo servidor Node.js. Não há reinício automático por alteração de arquivos; reinicie o processo após mudar código ou configuração.

## 7. Adaptar ao seu catálogo

O conjunto de origem está em [`lib/data.js`](../lib/data.js). O [modelo técnico](ARCHITECTURE.md#modelo-persistido) descreve as propriedades esperadas.

| Elemento | Como adaptar |
| --- | --- |
| Ativos | Preserve IDs únicos e informe nome, categoria, descrição e equipe |
| Dependências | Registre `source → target` no sentido de fornecimento dos dados |
| Incidentes | Relacione a ocorrência a um ID de ativo existente |
| Cenários da interface | Ajuste os IDs dos três botões no HTML e a seleção inicial/reset em `public/app.js` |
| Embeddings | Adapte o conjunto de incidentes em `lib/data.js` antes de gerar os vetores |

A interface foi preparada para os IDs do conjunto fictício. Trocar somente o banco sem adaptar os cenários pode deixar botões sem resultado. O script de embeddings também usa o conjunto de `lib/data.js`, não um carregamento automático de todos os incidentes do banco.

Depois de alterar dados ou comportamento:

```bash
npm test
node scripts/build-preview.js
```

Atualize testes e resultados esperados quando o domínio mudar. Mantenha `lib/graph.js` e `public/graph.js` equivalentes. Se o HTML autônomo for distribuído, revise os dados que ele incorpora.

## Limites para aplicação em ambiente próprio

A API carrega um catálogo pequeno e recusa mais de 500 ativos, 2.000 relações ou 200 incidentes. Essas barreiras são limites do MVP, sem benchmark de capacidade. Catálogos maiores exigem expansão seletiva no servidor e orçamento de travessia.

O servidor não implementa autenticação, autorização ou rate limit. Antes de disponibilizar dados internos ou habilitar uma chave de embeddings para outros usuários, implemente controle de acesso, restrição de consumo e gestão de segredos. Use credenciais de leitura na aplicação e credencial separada para carga e criação de índices. A execução de `npm start` por si só não fornece esses controles.

## Diagnóstico

| Sintoma | Verificação |
| --- | --- |
| Interface permanece em demonstração | Confira `DATA_MODE=neo4j` e reinicie o processo |
| Banco vazio | Execute o seed no mesmo banco indicado em `NEO4J_DATABASE` |
| Erro 503 no grafo | Confira URI, TLS, conectividade, permissões e limites do catálogo |
| Busca semântica indisponível | Confira chave, modelo, dimensão, procedure e índice ONLINE |
| Busca lexical sem resultado | Experimente palavras presentes no histórico; não há inferência de sinônimos |
| Botão de cenário sem resultado | Confira se os IDs esperados existem no catálogo adaptado |
| Porta ocupada | Configure `PORT` e reinicie; acesse a porta escolhida |

## Referências

- [Neo4j JavaScript Driver](https://neo4j.com/docs/javascript-manual/current/)
- [Índices vetoriais](https://neo4j.com/docs/cypher-manual/current/indexes/search-indexes/vector-indexes/)
