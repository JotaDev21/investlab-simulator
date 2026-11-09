# InvestLab

Simulador educacional de investimentos com dinheiro fictício. Dá para montar uma carteira, avançar o calendário e comparar o efeito de juros, aportes e cenários econômicos.

## Experimente offline

Baixe [InvestLab.html](InvestLab.html) e abra o arquivo no navegador. A simulação roda no próprio HTML, com salvamento local e exportação do cenário em JSON.

- Compare títulos de renda fixa, ações e outros ativos do mercado simulado.
- Use universos separados para repetir uma estratégia em condições comparáveis.
- Explore a carteira pelo analisador de retorno, risco e exposição.

Empresas, preços, eventos e ordens são fictícios. O modelo foi feito para aprendizado. As simplificações de mercado e de tributação estão documentadas no histórico.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

    npm ci
    npm run dev
    npm test
    npm run typecheck
    npm run build:html

Os motores de simulação ficam em [lib/lab](lib/lab/) e [lib/simulation](lib/simulation/). A interface web usa React e TypeScript. O build de [standalone](standalone/) gera a edição em um único HTML.

- [Cobertura e limites da simulação](COBERTURA.md)
- [Histórico, arquitetura e convenções do modelo](HISTORICO.md)
