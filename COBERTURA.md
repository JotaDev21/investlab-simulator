# InvestLab — conferência do pedido de expansão

A entrega anterior não atendia integralmente ao pedido: futuros eram uma calculadora, gregas eram conceituais, havia uma aula por nível, cotização sempre imediata, previdência sem lotes e rebalanceamento que deixava a parcela de renda fixa em caixa. A revisão atual implementa esses fluxos e amplia a inspeção, os desafios, os eventos, os históricos e o replay.

Abra `../InvestLab.html`. O arquivo contém a aplicação e funciona offline. Este documento indica onde verificar cada item e explicita as convenções; não afirma que o simulador reproduz integralmente mercados ou legislação reais.

| Item | Implementação e onde verificar |
| --- | --- |
| 1. Classes e bolsa fictícia | Investimentos: 15 títulos. Mercados: 43 ativos em ações, FIIs, ETFs, exterior, fundos, previdência e cripto. Compra/venda, quantidade, média, resultado realizado/não realizado, renda e eventos corporativos. |
| 2. Análise fundamentalista | Mercados → empresa → Demonstrações: 18 indicadores clicáveis, DRE, balanço e fluxo de caixa anuais fictícios. Cada indicador abre fórmula, valores da empresa, finalidade, limitações e exemplo. |
| 3. FIIs | Seis segmentos; cotação, NAV, P/VP, rendimento, contratos, indexadores, receitas e despesas. Tijolo tem vacância; papel tem crédito e possibilidade de perda em recebíveis. |
| 4. ETFs | Oito ETFs brasileiros e um internacional. Cestas de referência, pesos que variam com os componentes, rebalanceamento periódico, taxas e histórico. Tracking error estatístico fica disponível após 30 retornos; é separado da diferença acumulada. Ouro e renda fixa são proxies declarados. |
| 5. Exterior | Ações, ETF global, título governamental e REIT fictícios; BRL/USD/EUR. Analisador separa retorno local, efeito cambial e resultado em BRL. |
| 6. Fundos | Cinco tipos. Taxas, referência e NAV; come-cotas nos fundos definidos pelo perfil. Resgate reserva cotas, espera cotização futura, usa o NAV dessa data e cria recebível até o pagamento. Calendário mostra as duas etapas. |
| 7. Previdência | PGBL/VGBL, administração, regimes, acumulação e consumo futuro. Cada aporte tem lote; venda usa FIFO e idade fiscal própria. Calculadora mostra bruto, capital, tributo, líquido, valor real e renda mensal de consumo. |
| 8. Cripto | Quatro classes de comportamento, área de maior risco, oferta circulante e market cap fictícios. Curso/glossário: blockchain, custódia, contraparte, liquidez e volatilidade; nenhuma movimentação de rede real. |
| 9. Opções e futuros | Avançado: gate do curso e aceite de risco. Calls/puts, strike, prêmio, prazo, intrínseco/extrínseco, payoff, venda antecipada e exercício financeiro no vencimento. Gregas numéricas, IV e contratos futuros persistidos. |
| 10. Short e alavancagem | Avançado: obrigação de recompra, aluguel, garantia, manutenção, chamada de margem, encerramento compulsório e dívida. Futuros também podem perder mais que a garantia. |
| 11. Economia integrada | Economia: Selic, CDI, IPCA, emprego, PIB, crescimento, câmbio, prêmio e curva. Ciclos e eventos estocásticos pela seed; fundamentos e preços reagem ao cenário. |
| 12. Banco Central | Decisões a cada 90 dias: elevar, manter ou cortar, conforme cenário. Economia apresenta a decisão, taxas antes/depois e reação observada nas posições, sem afirmar relações absolutas. |
| 13. Marcação a mercado | Investimentos → laboratório de títulos: fluxo descontado, venda líquida hoje, levar ao vencimento com cupons futuros e impostos, hipótese de juros/inflação constantes e sensibilidade a mudanças de taxa. |
| 14. Curva | Economia e Avançado: vértices por prazo, inclinação, expectativas, duration/convexidade e experimento de preço dos títulos. |
| 15. Retorno real | Faixa permanente: patrimônio nominal e poder de compra inicial; opção de exibir reais da data inicial. Analisador compara patrimônio e dinheiro parado, com capital externo separado. Projeções de produtos incluem inflação futura assumida. |
| 16. Tributos | TaxEngine independente e versionado. Analisador permite criar versão de taxas de mercado e limites de garantia para o universo. Tributos pagos e provisões são separados; regras de IR/IOF e previdência seguem o perfil educacional declarado. |
| 17. Crédito e garantia | Emissores com perfis, spreads e probabilidade fictícia de insolvência. Garantia limitada por emissor/conglomerado e janela de quatro anos; recuperação vira recebível, com perda acima da proteção e bloqueio de novas aplicações. |
| 18. Diversificação e risco | Analisador: ativo, classe, emissor, setor, país, moeda e indexador; volatilidade, drawdown, retorno anualizado, Sharpe, beta, alfa e correlação. Matriz mostra até oito posições; exige 30 retornos alinhados. |
| 19. Benchmarks | 100% CDI, inflação, índice Brasil e índice americano em BRL. Comparação original de 110% CDI preservada. TWR separa fluxos; explicação sobre risco e amostra acompanha os resultados. |
| 20. Rebalanceamento | Analisador: pesos e ativos escolhidos pelo usuário, manual ou periódico. Inclui compra de renda fixa e resgate parcial de títulos elegíveis. Carências, custos e operações pendentes podem deixar desvio do alvo. |
| 21. Aportes | Único, mensal de calendário ou intervalo personalizado. Gráficos e auditoria separam dinheiro novo e ganho. |
| 22. Proventos | Distribuições chegam ao caixa após tributos e ajustam preço ex-provento. Usuário pode manter, gastar ou investir. Experimento compara proventos em caixa e reinvestidos sob hipóteses explícitas. |
| 23. Eventos raros | Crise financeira, inflação inesperada, commodities, euforia e recuperação afetam variáveis antes da notícia. Recessão, falência empresarial, perdas em recebíveis e insolvência de emissor também são modeladas. |
| 24. Notícias | Notícias descrevem eventos já gerados; não escolhem a cotação. Feed em Economia e registro no histórico. |
| 25. Tempo | +1 dia, +7 dias, +1 mês, +6 meses, +1 ano e intervalo próprio. Automático 1x/10x/100x; pausas em vencimento, ordem, provento, macro, resultado, margem e liquidação. Todos usam o mesmo relógio. |
| 26. Calendário | Vencimentos de títulos/opções/futuros, cupons, aportes, cotização, pagamento de recebíveis, resultados, distribuições e decisões monetárias. Eventos raros não são anunciados antes. |
| 27. Diário | Tese anterior à ordem/aplicação e revisão datada posterior, preservando o texto original. Valores atuais/encerrados e referências cambiais podem ser inspecionados. |
| 28. Desafios | Universos separados: reserva de R$ 3 mil, preservar R$ 50 mil por cinco anos, quatro classes, casa em três anos e atravessar recessão. Feedback considera prazo efetivamente vivido, poder de compra, liquidez, vencimentos, concentração, drawdown e diário. |
| 29. Curso | 12 níveis, 97 aulas: temas individuais, inclusive 18 indicadores, DRE e balanço, fundos, macro, risco, renda fixa avançada e derivativos. Novos níveis exigem todas as aulas; créditos anteriores são preservados. |
| 30. Aprendizado ativo | Explicação → exemplo → resposta com raciocínio → ação/período observado no simulador → revisão escrita. Abrir aula não conclui. Experimentos de ações/fundos/derivativos verificam operações compatíveis; Master exige replay e tese. |
| 31. Glossário | Pesquisa, definições, fórmulas, exemplos, finalidade e limitações. Conceitos nas aulas, textos explicativos e rótulos financeiros abrem explicação ao clicar; indicadores e métricas têm ajuda ou inspeção contextual. Controles de formulário preservam seus rótulos e têm contexto nas explicações adjacentes. |
| 32. Sandbox | Universos independentes com nome, saldo, seed, data fictícia, dificuldade, inflação e juros iniciais. Troca preserva as outras carteiras. |
| 33. Replay | Mesmas condições iniciais e seed; compras não consomem RNG do mercado. Gráfico alinha datas e TWR de estratégias compatíveis. Dados V1 migrados não recebem mercados retroativos inventados. |
| 34. Analisador | Patrimônio, capital externo, ganho/perda, renda, tributos, histórico nominal/real, exposições, posições, métricas, planos e auditoria. Dívida, margem e recebíveis aparecem no cálculo do patrimônio. |
| 35. Inspeção | Patrimônio, títulos, ativos, 18 indicadores, risco, tracking, opções, short, futuros e macro têm cálculos contextuais. Projeção, reinvestimento, previdência, fluxos de vencimento e gregas expõem fórmulas e hipóteses nos respectivos experimentos. |
| 36. Motores | Módulos independentes de React para relógio, economia, mercado, renda fixa, bolsa, fundos, previdência, tributos, carteira, eventos corporativos, ordens, curso, eventos e notícias; módulos adicionais para opções, futuros, crédito, desafios, análise, diário, replay e persistência. |
| 37. Precisão | Strings de inteiros com 18 casas monetárias; decimal.js com 48 dígitos; HALF_UP. Actual/365 e calendário UTC declarados. Taxas compostas equivalentes; centavos em tributos/liquidações e precisão maior nos saldos internos. |
| 38. Testes | 90 testes financeiros e de integração; verificações de navegador offline em desktop/celular, migração, salvamento, recarga e quota de armazenamento. |
| 39. Auditoria | Cada alteração de caixa registra origem, antes, delta e depois. Avaliação de ativos, distribuições, impostos, eventos, ajustes e obrigações entram no histórico; saldo reconciliável e patrimonio incluindo passivos. |
| 40. Sem recomendação automática | Sem indicação do que comprar ou carteira ideal. Pesos, ativos, ordens, teses e parâmetros são escolhidos pelo usuário; feedback explica consequências e riscos. |

## Convenções que permanecem

Tudo é fictício. Não há dados atuais, corretora, matching de ordens entre usuários, custódia de ativos ou blockchain real. Índices têm cestas pequenas; ouro e título estrangeiro são proxies. Crédito e FGC usam probabilidades, limites e prazo de pagamento do exercício. Tributação não reproduz a legislação completa, deduções, declaração, compensação de perdas ou regras de day trade.

Dias D+N são corridos. Renda fixa negociável usa fluxos e mudanças da curva calibradas à compra; Selic é aproximado pelo saldo. Opções novas são europeias, com dividendos contínuos e volatilidade constante; opções legadas mantêm o modelo original. Futuros têm carregamento e margens didáticos, sem microestrutura real. Previdência modela consumo após resgate, sem renda vitalícia ou cálculo atuarial. Nenhum modelo promete retorno ou capacidade de prever mercados.

O histórico de cada ativo guarda até 3.651 fechamentos; métricas de correlação dependem da amostra. A matriz mostra até oito posições e o gráfico de replay até cinco estratégias. Rebalanceamento respeita restrições, tributos e arredondamento; o resultado pode se afastar dos pesos desejados.

O HTML atual preserva dados existentes. `InvestLab-v1.html` e `InvestLab-v2.html` são cópias das entregas anteriores; use o HTML atual para continuar com os novos contratos e campos. O navegador guarda universos no armazenamento local e IndexedDB. Exportar uma cópia JSON ajuda a preservar o histórico; não há sincronização nem importador de JSON nesta edição.
