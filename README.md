# FORM — Workout App

Aplicativo de treinos construído com React, TypeScript e Vite.

## Estilização

Interface criada exclusivamente com utilitários do **Tailwind CSS 3**, usando `@apply` no `src/index.css`, preservando as classes semânticas dos componentes. Nenhuma biblioteca de componentes foi adicionada.

Inclui layout responsivo, navegação mobile, cards de exercícios, biblioteca, histórico, sessões ativas e modais.

## Feed de treino

Ao abrir a área de treinamento, o app seleciona o treino previsto para o dia da semana e mostra sua categoria (superiores, inferiores ou corpo inteiro). Uma sessão em andamento tem prioridade, inclusive ao recarregar a página em outro dia. Nos dias sem treino previsto, o cartão identifica o treino selecionado, que pode ser alterado pelas abas.

Em **Iniciar treino**, os exercícios aparecem em um feed vertical com encaixe de rolagem: uma ilustração ampliada, a prescrição e os registros de séries em cada cartão. Role para passar ao próximo exercício ou use os botões de navegação. Peso, repetições e conclusão ficam acessíveis sem expandir o cartão; a seta de detalhes abre dicas, variantes, anotações e histórico comparável.

Marcar uma série como concluída inicia automaticamente o descanso prescrito. O cronômetro permanece na barra inferior durante a rolagem. A super-série sem descanso avança diretamente para o exercício seguinte. Os registros continuam salvos no navegador e entram no histórico ao finalizar.

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

## Histórico detalhado e referência do último treino

1. Em **Meu programa**, abra um exercício. Quando houver alternativas, selecione a **Variante do exercício** antes de concluir uma série. Para prancha / infra suspenso, use **Forma de registro** durante o treino.
2. Inicie a sessão e registre normalmente suas cargas e repetições ou segundos. O bloco **Último treino comparável** mostra as séries concluídas na última execução do mesmo exercício, variante e unidade de peso. As cargas dessas séries são preenchidas automaticamente na nova sessão, nos mesmos números de série, e podem ser editadas. As repetições continuam com a meta atual e nenhuma série é concluída automaticamente.
3. Acrescente uma **Anotação do exercício**, se desejar. A anotação geral do treino também é preservada na sessão.
4. Use **Salvar e finalizar treino**. Em **Histórico de treinos**, abra o resumo de uma sessão e expanda seus exercícios para consultar a prescrição utilizada, variante, equipamento, séries concluídas e não concluídas, cargas, repetições ou segundos e anotações.

Os novos registros guardam uma cópia da prescrição e da versão do programa. Alterações posteriores no treino não reescrevem o histórico. Exercícios em segundos não entram no cálculo de carga × repetições. A escolha de variante fica bloqueada após concluir uma série; para trocá-la na mesma sessão, desmarque primeiro as séries desse exercício. Exercícios com séries concluídas não podem ser removidos da sessão.

Registros antigos continuam disponíveis com o aviso **Somente resumo**, sem inventar detalhes que não foram salvos. Se uma sessão já estava em andamento na atualização, suas séries são preservadas e a prescrição é capturada naquele momento, com aviso no histórico. Alternativas cuja escolha anterior era desconhecida aparecem como **Variante não registrada** e não fornecem cargas para uma variante específica no próximo treino.

## Registro simples de esforço com RIR

Durante a sessão de treino, cada série de exercícios com contagem de repetições inclui uma coluna opcional de **RIR** (Repetições na Reserva / *Repetitions in Reserve*), posicionada ao lado do botão de conclusão da série:

1. **O que é RIR:** é uma estimativa subjetiva de quantas repetições a mais, com boa postura e controle técnico, você conseguiria realizar antes de atingir a falha muscular ou perder a técnica.
2. **Opções disponíveis:**
   - `—` (em branco): opcional; o treino pode ser concluído normalmente sem preencher o RIR.
   - `0`: nenhuma repetição a mais com boa forma (esforço máximo na série).
   - `1`: conseguiria fazer mais 1 repetição com técnica adequada.
   - `2`: conseguiria fazer mais 2 repetições (estímulo de alta eficiência para hipertrofia).
   - `3`: conseguiria fazer mais 3 repetições (esforço moderado).
   - `4+`: 4 ou mais repetições na reserva (série leve ou de aquecimento).
   - `Não sei`: incerteza legítima; use sempre que tiver dúvida, especialmente ao iniciar um exercício novo ou mudar de carga.
3. **Sem bloqueios:** o registro é totalmente opcional e não bloqueia a conclusão da série, o início do cronômetro de descanso nem a finalização do treino. A resposta pode ser escolhida antes, durante ou após a série, e pode ser corrigida a qualquer momento da sessão.
4. **Sem incentivo à falha:** a interface orienta explicitamente que nunca se deve treinar até a falha apenas para testar ou adivinhar o valor de RIR. Estudos científicos demonstram que manter 1 a 3 repetições na reserva promove hipertrofia semelhante a treinar até a falha concêntrica, gerando menor fadiga do sistema nervoso central e recuperação mais rápida.
5. **Histórico e referência:** o RIR informado é preservado nos registros detalhados do treino e exibido tanto na tabela do modal de **Histórico de treinos** quanto no bloco **Último treino comparável** nas sessões seguintes (ex.: `60 kg × 10 · RIR 2` ou `60 kg × 10 · RIR: Não sei`).
6. **Exercícios em segundos:** exercícios como a prancha cronometrada em segundos não exibem o campo de RIR de repetições nesta primeira versão.

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

Para validar o histórico detalhado, as referências por variante/unidade, os backups e sua restauração, as falhas de armazenamento, a prescrição do V-Taper, os idiomas e a explicação personalizada no navegador, inicie o servidor e execute `node tests/browser.mjs` em outro terminal. O teste usa Chromium do Playwright (`npx playwright install chromium`, caso ainda não esteja instalado). Use `FORM_TEST_URL` para testar outro endereço. Os testes usam contextos isolados do navegador e não alteram os dados reais dos testadores.
