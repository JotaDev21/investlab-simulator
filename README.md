# InvestLab

Laboratório educacional de investimentos. Todo saldo, produto, rendimento e indicador é fictício. A aplicação começa em **6 de outubro de 2026**, com **R$ 10.000**. Não há integração bancária, depósitos, ordens reais ou recomendações de compra.

## Primeira versão

- Dashboard responsivo em modo escuro, gráfico de evolução e distribuição da carteira.
- CDB prefixado de 10% a.a., vencimento em 24 meses e liquidez no vencimento.
- CDB de 110% do CDI simulado, vencimento em 24 meses e resgate diário integral.
- Máquina do tempo: 1 dia, 7 dias, 1 mês, 6 meses, 1 ano ou até 3.650 dias personalizados por avanço.
- Cenário macroeconômico determinístico, com Selic, CDI, IPCA e eventos trimestrais.
- Capitalização diária, inflação acumulada, rendimento nominal e real.
- Estimativas de IR e IOF, resgate e liquidação automática no vencimento.
- Histórico completo de rendimentos diários, aplicações, resgates, impostos e eventos.
- Consulta do fechamento de qualquer data simulada, sem reverter o relógio.
- Comparação dos dois produtos, projeções e referências históricas teóricas.
- Modo Aprendendo com exemplos numéricos, glossário e explicações.
- Salvamento no navegador, exportação JSON e reinício mediante confirmação.
- Seed configurável para reprodução de cenários; limite de 100 anos de simulação.

## Executar

Requer Node.js 22.13 ou superior. Na pasta deste projeto:

```sh
npm install
npm run dev
```

Acesse **http://127.0.0.1:5173/**. Para validar:

```sh
npm test
npm run typecheck
npm run build
```

O projeto usa React, TypeScript, Vinext/Vite, Recharts, Lucide e os componentes acessíveis Radix/Shadcn do starter Sites. O build gera um Worker compatível com Cloudflare. A identidade de hospedagem fica em `.openai/hosting.json`.

## Arquitetura

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Interface | `app/`, `components/investlab/` | Telas, gráficos, modais e explicações |
| Estado | `hooks/use-simulation.ts` | Ações atômicas, restauração e persistência |
| Dinheiro | `lib/simulation/money.ts` | Aritmética inteira de ponto fixo com BigInt |
| Relógio | `lib/simulation/clock.ts` | Datas UTC, dias e meses de calendário |
| Produtos | `lib/simulation/products.ts` | Catálogo e estratégias de indexação |
| Motor | `lib/simulation/engine.ts` | Aplicação, avanço diário, resgate, vencimento e snapshots |
| Economia | `lib/simulation/economy.ts` | Seed, regimes econômicos e indicadores |
| Tributos | `lib/simulation/tax.ts` | IR e IOF estimados sobre ganhos positivos |
| Histórico | `lib/simulation/types.ts` | Transações e fechamento patrimonial diário |
| Persistência | `lib/simulation/storage.ts` | Validação dos dados salvos com Zod |
| Mercado futuro | `lib/simulation/market.ts` | Regimes, momentum e volatilidade para extensões |
| Educação | `lib/education.ts` | Conceitos financeiros com exemplos |

As funções financeiras não dependem de React. Todas as operações retornam um novo estado, preservando o anterior. O número aleatório é xorshift32 com seed armazenada; cliques e tamanho de cada avanço não consomem aleatoriedade. Há histórico de cada dia, mesmo quando o gráfico reduz a quantidade de pontos para exibição.

## Metodologia e limites

**Dinheiro:** valores em reais com 18 casas decimais representados como inteiros BigInt serializados em strings. A raiz 365 da taxa efetiva anual é calculada por busca binária inteira; os juros são acumulados sem arredondamento diário aos centavos. Apresentação, tributos e liquidação arredondam aos centavos. Números de ponto flutuante são usados apenas para taxas de referência, percentuais visuais e coordenadas dos gráficos, nunca para somar ou debitar saldos.

**Capitalização:** convenção educacional Actual/365, inclusive fins de semana. 365 dias a 10% a.a. resultam em R$ 1.100 brutos para R$ 1.000 iniciais; 730 dias resultam em R$ 1.210. Um ano de calendário bissexto pode ter 366 dias. Meses preservam o dia da aplicação ou o último dia válido do mês.

**CDI:** a participação multiplica a taxa efetiva anual (ex.: 10% × 110% = 11%), com capitalização diária posterior. Frações de ponto-base são preservadas. É uma metodologia didática; produtos reais normalmente usam a participação na taxa diária do CDI e calendário de 252 dias úteis. A metodologia aparece na explicação de CDI dentro do aplicativo.

**Taxas:** indicadores iniciais inventados para a simulação (Selic 10,75%, CDI 10,65%, IPCA 4,50% a.a.). Não são cotações atuais. Mudanças ocorrem a cada 90 dias, com regimes persistentes, inflação limitada e resposta de juros. Os juros e a inflação do intervalo usam as taxas vigentes no começo do dia; o evento no fechamento afeta os períodos seguintes. Este é um modelo educacional de cenários, não uma previsão macroeconômica.

**Tributos:** IR regressivo de 22,5%/20%/17,5%/15%, conforme dias da aplicação, e IOF regressivo até o 29º dia. IR sobre o ganho depois de IOF; principal preservado. Cobrados uma vez no resgate/vencimento. O patrimônio total e o gráfico principal usam o valor líquido estimado; o valor investido é bruto. Não há custódia, tarifas, come-cotas, compensação de prejuízos nem regimes de outras classes.

Referências consultadas para o modelo: [IN RFB 1.585/2015, art. 46](https://normas.receita.fazenda.gov.br/sijut2consulta/consulta/normas.fazenda.gov.br/sijut2consulta/link.action?idAto=67494&visao=original) e [tributação de renda fixa no Tesouro Direto — CAIXA](https://www.caixa.gov.br/voce/poupanca-e-investimentos/tesouro-direto/Paginas/default.aspx?idServico=126&segmento=PF). São fontes para esta modelagem educacional, não orientação tributária individual.

**Comparação:** a projeção congela as taxas atuais e apresenta bruto e líquido. A referência histórica calcula o crescimento bruto teórico contínuo de R$ 1.000 desde o início, sem vencimentos, resgates ou tributos; não é uma posição da carteira e recebe essa identificação na tela. Não há classificação automática de melhor investimento.

**Persistência:** localStorage, exclusivamente neste navegador e perfil. Não há conta nem sincronização entre dispositivos. Se o navegador não puder salvar, a interface avisa e permite exportar o cenário. Dados inválidos são preservados em uma chave de recuperação quando possível. Exportação é uma cópia de dados; importação não faz parte desta versão.

**Futuro:** Tesouro, LCI/LCA, IPCA+, ações, ETFs e FIIs são extensões futuras. O módulo de mercado já oferece uma função pura determinística com regime e momentum, mas não há produtos de renda variável disponíveis nem marcação a mercado nesta versão.

## Validação

24 testes automatizados abrangem exemplos de juros compostos, CDI de 100% e 110%, precisão de centavos, períodos fracionados, resgates, maturidade, mudanças de taxa, determinismo por seed e por tamanho do avanço, IR/IOF, inflação, datas bissextas, snapshots e serialização.

Os fluxos da interface foram verificados em navegador automatizado: aplicação, avanço de ano, restauração após recarregar, resgate, comparação, histórico econômico, explicações, navegação móvel e período personalizado. Foram verificadas larguras desktop e móvel sem rolagem horizontal involuntária.

O recurso experimental WebMCP registra uma consulta somente leitura quando o navegador fornece `document.modelContext`; não há suporte obrigatório para operar a aplicação. Não havia um contexto WebMCP nativo disponível para sua validação nesta sessão.
