# FORM — Workout App

Aplicativo de treinos construído com React, TypeScript e Vite.

## Estilização

Interface criada exclusivamente com utilitários do **Tailwind CSS 3**, usando `@apply` no `src/index.css`, preservando as classes semânticas dos componentes. Nenhuma biblioteca de componentes foi adicionada.

Inclui layout responsivo, navegação mobile, cards de exercícios, biblioteca, histórico, sessões ativas e modais.

## Temas claro e escuro

Use o botão de sol/lua no cabeçalho para alternar o tema. No primeiro acesso, o aplicativo acompanha a preferência do dispositivo; depois da escolha manual, mantém o tema salvo neste navegador. A troca preserva o treino em andamento e é aplicada antes da primeira renderização para evitar flashes claros no modo escuro.

A paleta combina branco e azul no tema claro, e preto e azul no tema escuro. As cores compartilhadas ficam em `src/index.css`, com papéis semânticos registrados no Tailwind para manter cartões, campos, menus e modais consistentes.

## Feed de treino

A área **Meu programa** mostra somente os cartões dos dias da semana que possuem exercícios. O dia atual recebe a indicação **Hoje**, e o cartão de uma sessão aberta mostra **Em andamento**. Dias sem exercícios ficam ocultos.

Ao tocar em um dia, o usuário abre seu feed vertical de exercícios, com um botão **Iniciar treino** em destaque. Cada exercício mostra as séries e as repetições prescritas, incluindo faixas e indicações por lado. Não há campos de carga, repetições ou RIR, nem edição da prescrição nessa tela. Antes de iniciar, as séries ficam disponíveis apenas para consulta.

Durante o treino, toque em **Concluir série**. Um modal exibe o cronômetro de descanso, o próximo exercício e o número da próxima série. Ao terminar a contagem, use **Continuar treino**; também é possível **Pular descanso**. Fechar o modal ou usar Escape equivale a pular o intervalo. O retorno leva à próxima série pendente. Os exercícios da supersérie com descanso zero avançam diretamente para o par; o descanso é aplicado depois do segundo exercício. A última série pendente do treino abre a revisão para finalizar.

Séries concluídas e o horário de término do descanso ficam salvos neste navegador. Recarregar a página durante um descanso mantém a contagem pelo tempo real transcorrido. O botão **Dias de treino** retorna aos cartões sem descartar a sessão; **Retomar treino** reabre a sessão em andamento, mesmo ao consultar outro dia.

## Programa atual

O programa ativo é **V-Taper e Braços**, transcrito de [`treino_v_taper.md`](treino_v_taper.md): Superiores 1 na segunda, Inferiores e Core na terça, Superiores 2 na quinta e Corpo Inteiro na sexta. São 26 entradas de exercícios e 84 séries semanais, com a ordem, as alternativas, as faixas de repetições, os descansos e as observações do arquivo.

Os cartões exibem a prescrição completa. O cronômetro usa o descanso de cada exercício, incluindo os 75 segundos da puxada com triângulo e a super-série sem intervalo entre rosca Scott e tríceps (60 segundos após ambos). A alternativa de prancha / infra suspenso segue a variante já definida na prescrição, sem campos de edição durante o treino. A última série de elevação lateral na sexta está identificada como drop-set.

Na primeira abertura desta versão, o aplicativo ativa esse programa também em navegadores que já usavam o plano anterior. O histórico, as preferências e o contexto pessoal são preservados. O programa anterior e uma eventual sessão em andamento ficam arquivados na chave local `form:program-backup:before-v-taper-1`. A migração ocorre uma vez e mantém as personalizações feitas depois da ativação do V-Taper.

## Idiomas

Use **EN / PT-BR** no topo para trocar o idioma. No primeiro acesso, a interface acompanha o idioma do navegador (português ou inglês); a escolha manual fica salva neste navegador. Exercícios, dicas, datas e números acompanham o idioma, preservando anotações, nomes personalizados e registros de treino.

As traduções ficam em `src/locales/pt-BR.json`, com o texto original em inglês como chave. A busca aceita nomes em ambos os idiomas, com ou sem acentos.

## Explicação do programa

Em **Meu programa → Opções do programa → Entenda seu programa**, o usuário pode consultar a lógica da divisão, o papel de cada sessão, os dias sem treino previsto e as séries diretas semanais por músculo. Os números acompanham os exercícios e as séries personalizados.

Objetivo, dias disponíveis e tempo por sessão são opcionais e ficam salvos neste navegador. A explicação relaciona esses dados à rotina atual e indica incompatibilidades de agenda ou duração estimada. Esses campos não alteram a prescrição do programa.

## Histórico detalhado

Use **Finalizar treino → Salvar e finalizar treino** para guardar as séries concluídas. Em **Histórico de treinos**, abra uma sessão para consultar sua prescrição e a conclusão de cada série. Os registros guardam uma cópia da prescrição e da versão do programa, preservando o histórico após alterações futuras.

As novas sessões registram somente conclusão e a meta prescrita, sem copiar cargas ou esforço de treinos anteriores. Como não há registro de carga no novo fluxo, elas não acrescentam volume de carga. Registros anteriores continuam disponíveis com suas cargas, repetições, variantes, RIR e anotações originais. Resumos antigos continuam identificados como **Somente resumo**. Sessões antigas em andamento também são recuperadas, mantendo os dados que já haviam sido registrados.

## Backup e restauração local

Em **Histórico de treinos → Backup e restauração**, use **Baixar backup** para guardar um arquivo JSON com programa, histórico, preferências, idioma, contexto de treino, arquivos do programa anterior e eventual sessão em andamento. É possível exportar durante o treino. Mantenha um arquivo separado para cada testador.

Para importar em outro navegador ou restaurar uma cópia:

1. Use **Escolher arquivo de backup** e selecione um arquivo do FORM de até 5 MB.
2. Confira a prévia: treinos novos, registros já existentes e versões conflitantes.
3. Escolha **Adicionar somente o histórico**, para manter o programa e as preferências atuais, ou **Restaurar também o programa e as preferências**, para recuperar a configuração do arquivo e sua sessão em andamento, quando houver. Essa segunda opção substitui as configurações atuais; baixe uma cópia delas antes se desejar preservá-las.
4. Use **Confirmar importação**. A página será recarregada com os dados importados.

As duas opções preservam os treinos já existentes e adicionam somente identificadores novos. Um registro com o mesmo identificador nunca é duplicado nem sobrescrito, mesmo que tenha conteúdo diferente no arquivo. Finalize ou descarte a sessão atual antes de importar; isso evita substituir um treino em andamento. Sessões restauradas mantêm o horário original de início.

Arquivos inválidos ou versões não suportadas são recusados antes da gravação. Se houver falha durante uma gravação com várias etapas, a aplicação tenta restaurar os valores anteriores e informa o resultado. Quando não for possível salvar um treino concluído, a sessão permanece aberta. Um aviso permite baixar o backup dos dados atuais em memória antes de fechar a aplicação.

O formato do backup é identificado por `app: "FORM"` e `formatVersion: 1`; detalhes das sessões usam `schemaVersion: 1`. Essas versões são independentes da versão do programa V-Taper. Não há login nem envio dos backups a um servidor.

## Executar

```bash
npm install
npm run dev
```

Para compilar: `npm run build`.

Para validar os cartões por dia, o feed com prescrição fixa, a conclusão de séries, o modal de descanso e sua recuperação, as superséries, o histórico legado, os backups, as falhas de armazenamento, os temas, os idiomas e a explicação personalizada no navegador, inicie o servidor e execute `node tests/browser.mjs` em outro terminal. O teste usa Chromium do Playwright (`npx playwright install chromium`, caso ainda não esteja instalado). Use `FORM_TEST_URL` para testar outro endereço. Os testes usam contextos isolados do navegador e não alteram os dados reais dos testadores.
