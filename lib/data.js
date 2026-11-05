export const demo = {
  "nodes": [
    {
      "id": "erp",
      "label": "ERP comercial",
      "kind": "source",
      "owner": "Operações",
      "description": "Pedidos e faturamento na origem"
    },
    {
      "id": "crm",
      "label": "CRM clientes",
      "kind": "source",
      "owner": "Comercial",
      "description": "Cadastro e segmentação de clientes"
    },
    {
      "id": "ledger",
      "label": "Sistema contábil",
      "kind": "source",
      "owner": "Contabilidade",
      "description": "Lançamentos e centros de custo"
    },
    {
      "id": "vendor",
      "label": "Portal fornecedores",
      "kind": "source",
      "owner": "Compras",
      "description": "Entregas e cadastro de fornecedores"
    },
    {
      "id": "capture",
      "label": "Captura de vendas",
      "kind": "job",
      "owner": "Plataforma",
      "description": "Carga diária do ERP"
    },
    {
      "id": "customers",
      "label": "Captura de clientes",
      "kind": "job",
      "owner": "Plataforma",
      "description": "Carga incremental do CRM"
    },
    {
      "id": "captureLedger",
      "label": "Captura contábil",
      "kind": "job",
      "owner": "Plataforma",
      "description": "Ingestão de lançamentos"
    },
    {
      "id": "captureVendor",
      "label": "Captura de fornecedores",
      "kind": "job",
      "owner": "Plataforma",
      "description": "Ingestão de entregas"
    },
    {
      "id": "rawSales",
      "label": "raw.vendas",
      "kind": "table",
      "owner": "Dados comerciais",
      "description": "Vendas recebidas, sem transformação"
    },
    {
      "id": "rawClients",
      "label": "raw.clientes",
      "kind": "table",
      "owner": "Dados comerciais",
      "description": "Cadastro recebido do CRM"
    },
    {
      "id": "rawLedger",
      "label": "raw.lancamentos",
      "kind": "table",
      "owner": "Dados financeiros",
      "description": "Lançamentos contábeis recebidos"
    },
    {
      "id": "rawVendor",
      "label": "raw.entregas",
      "kind": "table",
      "owner": "Dados de suprimentos",
      "description": "Entregas de fornecedores"
    },
    {
      "id": "quality",
      "label": "Validação de vendas",
      "kind": "job",
      "owner": "Dados comerciais",
      "description": "Verifica completude e duplicidade"
    },
    {
      "id": "cleanSales",
      "label": "trusted.vendas",
      "kind": "table",
      "owner": "Dados comerciais",
      "description": "Vendas validadas"
    },
    {
      "id": "join",
      "label": "Consolidação comercial",
      "kind": "job",
      "owner": "Dados comerciais",
      "description": "Relaciona vendas e clientes"
    },
    {
      "id": "revenue",
      "label": "mart.receita",
      "kind": "table",
      "owner": "Dados financeiros",
      "description": "Receita consolidada por cliente"
    },
    {
      "id": "closing",
      "label": "Cálculo de fechamento",
      "kind": "job",
      "owner": "Dados financeiros",
      "description": "Cruza receita e lançamentos"
    },
    {
      "id": "result",
      "label": "mart.fechamento",
      "kind": "table",
      "owner": "Dados financeiros",
      "description": "Resultado mensal consolidado"
    },
    {
      "id": "marginJob",
      "label": "Cálculo de margem",
      "kind": "job",
      "owner": "Dados financeiros",
      "description": "Margem calculada com receita e custos"
    },
    {
      "id": "margin",
      "label": "mart.margem",
      "kind": "table",
      "owner": "Dados financeiros",
      "description": "Margens por produto"
    },
    {
      "id": "deliveryJob",
      "label": "Cálculo de entregas",
      "kind": "job",
      "owner": "Dados de suprimentos",
      "description": "Indicadores de prazo por fornecedor"
    },
    {
      "id": "delivery",
      "label": "mart.entregas",
      "kind": "table",
      "owner": "Dados de suprimentos",
      "description": "Pontualidade e volume de entregas"
    },
    {
      "id": "salesReport",
      "label": "Painel comercial",
      "kind": "report",
      "owner": "Comercial",
      "description": "Receita e vendas por segmento"
    },
    {
      "id": "boardReport",
      "label": "Fechamento executivo",
      "kind": "report",
      "owner": "Diretoria financeira",
      "description": "Resultado mensal da empresa"
    },
    {
      "id": "marginReport",
      "label": "Painel de margem",
      "kind": "report",
      "owner": "Controladoria",
      "description": "Margem por produto e período"
    },
    {
      "id": "deliveryReport",
      "label": "Painel de fornecedores",
      "kind": "report",
      "owner": "Compras",
      "description": "Cumprimento de prazos"
    },
    {
      "id": "forecast",
      "label": "Projeção de receita",
      "kind": "report",
      "owner": "Planejamento",
      "description": "Projeção baseada no histórico comercial"
    },
    {
      "id": "audit",
      "label": "Conciliação contábil",
      "kind": "report",
      "owner": "Contabilidade",
      "description": "Confronto dos valores consolidados"
    }
  ],
  "edges": [
    {
      "source": "erp",
      "target": "capture"
    },
    {
      "source": "capture",
      "target": "rawSales"
    },
    {
      "source": "crm",
      "target": "customers"
    },
    {
      "source": "customers",
      "target": "rawClients"
    },
    {
      "source": "ledger",
      "target": "captureLedger"
    },
    {
      "source": "captureLedger",
      "target": "rawLedger"
    },
    {
      "source": "vendor",
      "target": "captureVendor"
    },
    {
      "source": "captureVendor",
      "target": "rawVendor"
    },
    {
      "source": "rawSales",
      "target": "quality"
    },
    {
      "source": "quality",
      "target": "cleanSales"
    },
    {
      "source": "cleanSales",
      "target": "join"
    },
    {
      "source": "rawClients",
      "target": "join"
    },
    {
      "source": "join",
      "target": "revenue"
    },
    {
      "source": "revenue",
      "target": "closing"
    },
    {
      "source": "rawLedger",
      "target": "closing"
    },
    {
      "source": "closing",
      "target": "result"
    },
    {
      "source": "revenue",
      "target": "marginJob"
    },
    {
      "source": "rawLedger",
      "target": "marginJob"
    },
    {
      "source": "marginJob",
      "target": "margin"
    },
    {
      "source": "rawVendor",
      "target": "deliveryJob"
    },
    {
      "source": "deliveryJob",
      "target": "delivery"
    },
    {
      "source": "revenue",
      "target": "salesReport"
    },
    {
      "source": "result",
      "target": "boardReport"
    },
    {
      "source": "margin",
      "target": "marginReport"
    },
    {
      "source": "delivery",
      "target": "deliveryReport"
    },
    {
      "source": "revenue",
      "target": "forecast"
    },
    {
      "source": "result",
      "target": "audit"
    },
    {
      "source": "rawLedger",
      "target": "audit"
    }
  ],
  "incidents": [
    {
      "id": "INC-041",
      "title": "Carga parcial de vendas no fechamento",
      "description": "Valores menores no fechamento mensal por ingestão incompleta de pedidos e faturamento.",
      "asset": "rawSales",
      "resolution": "Reexecutar a captura da partição faltante, validar contagem na origem e recalcular os consumidores.",
      "evidence": "Na ocorrência fictícia, a contagem de registros da origem era maior que a carga recebida.",
      "tags": [
        "fechamento",
        "menor",
        "incompleto",
        "vendas",
        "receita",
        "parcial"
      ]
    },
    {
      "id": "INC-028",
      "title": "Cadastro de clientes atrasado",
      "description": "Segmentos de clientes ausentes após atraso na atualização do CRM.",
      "asset": "rawClients",
      "resolution": "Atualizar o cadastro e executar novamente a consolidação comercial.",
      "evidence": "Partição do cadastro anterior à data esperada no cenário fictício.",
      "tags": [
        "clientes",
        "cadastro",
        "atraso",
        "segmento",
        "crm"
      ]
    },
    {
      "id": "INC-019",
      "title": "Lançamentos duplicados na contabilidade",
      "description": "Margem e resultado divergentes por duplicidade em lançamentos de custo.",
      "asset": "rawLedger",
      "resolution": "Deduplicar por chave de lançamento, conferir totais e reprocessar o fechamento.",
      "evidence": "Chaves repetidas no lote contábil do cenário fictício.",
      "tags": [
        "margem",
        "custo",
        "duplicidade",
        "contabilidade",
        "divergente"
      ]
    },
    {
      "id": "INC-012",
      "title": "Entregas de fornecedores desatualizadas",
      "description": "Indicadores de prazo sem atualização após falha da captura de entregas.",
      "asset": "rawVendor",
      "resolution": "Restabelecer a captura e atualizar os indicadores de entregas.",
      "evidence": "Última carga anterior ao prazo esperado na demonstração.",
      "tags": [
        "fornecedor",
        "entrega",
        "prazo",
        "atraso"
      ]
    }
  ]
};
