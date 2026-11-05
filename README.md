# FORM — Workout App

Aplicativo de treinos construído com React, TypeScript e Vite.

## Estilização

Interface criada exclusivamente com utilitários do **Tailwind CSS 3**, usando `@apply` no `src/index.css`, preservando as classes semânticas dos componentes. Nenhuma biblioteca de componentes foi adicionada.

Inclui layout responsivo, navegação mobile, cards de exercícios, biblioteca, histórico, sessões ativas e modais.

## Programa atual

O programa ativo é **V-Taper e Braços**, transcrito de [`treino_v_taper.md`](treino_v_taper.md): Superiores 1 na segunda, Inferiores e Core na terça, Superiores 2 na quinta e Corpo Inteiro na sexta. São 26 entradas de exercícios e 84 séries semanais, com a ordem, as alternativas, as faixas de repetições, os descansos e as observações do arquivo.

Os cartões exibem a prescrição completa. O cronômetro usa o descanso de cada exercício, incluindo os 75 segundos da puxada com triângulo e a super-série sem intervalo entre rosca Scott e tríceps (60 segundos após ambos). Para prancha / infra suspenso, selecione o registro em segundos ou repetições durante o treino. A última série de elevação lateral na sexta está identificada como drop-set.

Na primeira abertura desta versão, o aplicativo ativa esse programa também em navegadores que já usavam o plano anterior. O histórico, as preferências e o contexto pessoal são preservados. O programa anterior e uma eventual sessão em andamento ficam arquivados na chave local `form:program-backup:before-v-taper-1`. A migração ocorre uma vez e mantém as personalizações feitas depois da ativação do V-Taper.

## Idiomas

Use **EN / PT-BR** no topo para trocar o idioma. No primeiro acesso, a interface acompanha o idioma do navegador (português ou inglês); a escolha manual fica salva neste navegador. Exercícios, dicas, datas e números acompanham o idioma, preservando anotações, nomes personalizados e registros de treino.

As traduções ficam em `src/locales/pt-BR.json`, com o texto original em inglês como chave. A busca aceita nomes em ambos os idiomas, com ou sem acentos.

## Explicação do programa

Em **Meu programa → Entenda seu programa**, o usuário pode consultar a lógica da divisão, o papel de cada sessão, os dias sem treino previsto e as séries diretas semanais por músculo. Os números acompanham os exercícios e as séries personalizados.

Objetivo, dias disponíveis e tempo por sessão são opcionais e ficam salvos neste navegador. A explicação relaciona esses dados à rotina atual e indica incompatibilidades de agenda ou duração estimada. Esses campos não alteram a prescrição do programa.

## Executar

```bash
npm install
npm run dev
```

Para compilar: `npm run build`.

Para validar a prescrição do V-Taper contra o Markdown, a migração, os descansos, a prancha, os idiomas e a explicação personalizada no navegador, inicie o servidor e execute `node tests/browser.mjs` em outro terminal. O teste usa Chromium do Playwright (`npx playwright install chromium`, caso ainda não esteja instalado). Use `FORM_TEST_URL` para testar outro endereço.
