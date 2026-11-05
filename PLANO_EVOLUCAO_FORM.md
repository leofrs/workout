# Plano de execução — Evolução do FORM

Data: 05/11/2026  
Status: recursos 1 e 2 implementados; demais recursos planejados; avaliação cotidiana dos testadores pendente  
Programa de referência: [V-Taper e Braços](treino_v_taper.md)

## 1. Objetivo do projeto nesta fase

Transformar o FORM em uma aplicação que ajude a pessoa a entender o treino, executá-lo, registrar o desempenho e decidir os próximos passos com orientações explicáveis e baseadas em evidências.

Proposta de valor: **“Treino guiado por evidências, ajustado ao seu desempenho e à sua rotina.”**

A implementação será validada no uso cotidiano por dois testadores. A prioridade é verificar utilidade, clareza e facilidade de uso antes de investir em contas individuais, sincronização ou infraestrutura de armazenamento remoto.

Este documento orienta a execução dos dez recursos. Os recursos 1 e 2 já foram implementados; os demais continuam planejados. Os critérios marcados representam verificação técnica, sem substituir a avaliação cotidiana dos dois testadores.

## 2. Ponto de partida e limites

### O que já existe

- Aplicação em React, TypeScript, Vite e Tailwind CSS.
- Programa V-Taper com quatro dias, 26 entradas de exercícios e 84 séries semanais.
- Registro de cargas, repetições e conclusão de séries durante a sessão.
- Registro em segundos para a alternativa de prancha.
- Descansos por exercício, identificação de super-série e drop-set.
- Histórico detalhado por exercício para novas sessões, com prescrição, variantes, séries e anotações; resumos antigos preservados sem detalhes inventados.
- Referência do último treino comparável, preenchimento de cargas anteriores e backup manual com prévia de restauração.
- Explicação da divisão com dados opcionais de objetivo e disponibilidade.
- Dados locais no navegador e interface em português e inglês.

### Limites desta etapa

- Manter os dados no dispositivo e aproveitar a persistência local existente.
- Cada testador utiliza preferencialmente seu próprio navegador ou dispositivo.
- Adiar login, contas, sincronização entre dispositivos, banco remoto e painel administrativo.
- Implementar e avaliar uma mudança por vez, evitando alterar simultaneamente toda a experiência.
- Preservar o programa atual e o histórico nas evoluções de dados. Mudanças na estrutura dos registros devem ter migração própria, sem reativar a migração que substituiu o programa anterior pelo V-Taper.
- Manter mudanças no treino visíveis e sujeitas à escolha do usuário.
- Tratar a evidência científica como apoio às decisões. Diferenciar resultados de pesquisas, escolhas do protocolo e observações individuais.
- A IA remota será uma integração posterior e opcional. O treino deve continuar funcionando quando ela estiver indisponível.

## 3. Ordem de execução e dependências

Os números abaixo identificam as dez ideias da proposta original. A execução deve respeitar as dependências, mesmo quando isso mudar a ordem numérica.

| Etapa | Recursos | Resultado esperado para avançar |
| --- | --- | --- |
| Preparação | Observação da versão atual e definição das métricas | Referência de uso dos dois testadores antes das mudanças |
| Etapa 1 — Base confiável | 1. Histórico detalhado; 2. RIR; 4. Evidências | Dados completos, esforço compreensível e orientações rastreáveis |
| Etapa 2 — Direcionamento pessoal | 5. Configuração inicial; 3. Progressão | Contexto individual e sugestões justificadas por registros |
| Etapa 3 — Uso na academia | 6. Treino guiado; 7. Substituições; 8. Tempo disponível | Sessões mais fáceis de executar e adaptar |
| Etapa 4 — Acompanhamento | 9. Painel e revisão semanal | Evolução observável e dificuldades registradas |
| Etapa 5 — IA | 10. Copiloto contextual | Explicações e revisões apoiadas nos dados e nas fontes anteriores |

A primeira entrega deve ser o recurso 1. O recurso 4 pode começar com uma revisão de conteúdo em paralelo ao desenvolvimento, sem exigir agentes ou infraestrutura adicionais. A primeira versão da progressão depende de regras revisadas, do histórico detalhado e do registro de esforço.

## 4. Recursos a implementar

### Recurso 1 — Histórico completo por exercício e preenchimento do último treino

**Status:** implementado, com verificação técnica por build e testes de navegador. A validação cotidiana com Testador A e Testador B permanece pendente. Consulte as instruções de uso no [README](README.md#histórico-detalhado-e-referência-do-último-treino).

**Objetivo a alcançar:** permitir consultar cada série realizada e usar a última sessão comparável como referência ao iniciar um exercício.

**Por que implementar:** o resumo atual informa que houve treino, mas não preserva detalhes suficientes para comparar desempenho, sugerir progressão ou explicar decisões futuras. Essa é a base dos demais recursos orientados por dados.

**Primeira versão:**

- Histórico de exercícios com cargas, repetições ou segundos, unidade, séries concluídas e observações.
- Referência do último treino ao lado do registro atual.
- Preenchimento das cargas anteriores como sugestão editável, sem marcar séries como concluídas.
- Exportação e importação manual de backup dos dados locais para os testadores.

**Etapas de implementação:**

1. Estender os modelos de sessão e histórico para preservar os registros detalhados ao finalizar o treino.
2. Salvar uma cópia da prescrição utilizada: exercício, variante escolhida, séries, faixa de repetições, descanso, unidade e versão do programa.
3. Distinguir variantes que hoje compartilham uma entrada, como agachamento ou leg press e prancha ou infra suspenso. Não compartilhar automaticamente cargas entre variantes diferentes.
4. Criar uma migração compatível com registros antigos. Resumos antigos continuam disponíveis, identificados como sem detalhes; não inventar séries ausentes.
5. Exibir os detalhes no histórico e localizar a última execução comparável por exercício e variante.
6. Adicionar backup com versão de formato, validação do arquivo, prévia da importação e tratamento de duplicatas. Proteger a sessão em andamento durante a restauração.

**Dependências:** nenhuma funcionalidade nova.

**Critérios de aceitação:**

- [x] Os detalhes de um treino concluído permanecem corretos após recarregar a página.
- [x] Alterar o programa atual não modifica a prescrição nem os registros históricos.
- [x] Repetições, segundos e unidades de peso continuam distintos.
- [x] Registros antigos permanecem acessíveis.
- [x] A referência anterior pode ser aceita ou editada sem sobrescrever o treino passado.
- [x] Exportar e restaurar um backup em navegador de teste preserva os dados; arquivos inválidos não alteram os registros atuais.

**Validação com os testadores:** comparar o tempo e as dúvidas para registrar um exercício em duas execuções comparáveis, antes e depois do preenchimento anterior. Testar restauração com uma cópia dos dados, sem arriscar o único registro disponível.

**Pontos de partida no código:** `src/data.ts`, finalização da sessão e histórico em `src/App.tsx`, migrações locais e testes de navegador.

### Recurso 2 — Registro simples de esforço com RIR

**Status:** implementado, com verificação técnica por build e testes de navegador. A validação cotidiana com Testador A e Testador B permanece pendente. Consulte as instruções de uso no [README](README.md#registro-simples-de-esforço-com-rir).

**Objetivo a alcançar:** registrar a estimativa de quantas repetições ainda seriam possíveis ao terminar uma série com execução adequada.

**Por que implementar:** carga e repetições isoladas não descrevem todo o esforço percebido. O RIR acrescenta contexto para comparações e progressão, desde que o usuário compreenda a pergunta e possa declarar incerteza.

**Primeira versão:** seleção opcional de `0`, `1`, `2`, `3`, `4 ou mais` e `não sei`, acompanhada de explicação curta e exemplos. Os valores são respostas subjetivas, sem apresentação como medição exata.

**Etapas de implementação:**

1. Acrescentar RIR opcional aos registros detalhados, distinguindo `0` de ausência de resposta.
2. Definir os textos com apoio da revisão de conteúdo do recurso 4.
3. Posicionar a seleção junto à conclusão da série, sem bloquear o registro nem interromper o descanso.
4. Permitir corrigir a resposta e consultá-la no histórico.
5. Manter o RIR de repetições fora do fluxo de prancha em segundos nesta primeira versão.

**Dependências:** recurso 1. Conteúdo revisado do recurso 4 antes da liberação.

**Critérios de aceitação:**

- [x] É possível concluir o treino sem informar RIR.
- [x] `Não sei`, campo vazio e RIR zero têm significados diferentes nos dados.
- [x] O valor permanece após recarregar e finalizar a sessão.
- [x] A interface não incentiva testar a falha para preencher o campo.
- [ ] Ambos os testadores conseguem explicar o significado da pergunta com suas palavras.

**Validação com os testadores:** observar compreensão, frequência de uso, respostas `não sei` e esforço adicional para registrar. Não avaliar a precisão fisiológica do RIR apenas com esses relatos.

**Pontos de partida no código:** tipos de séries em `src/data.ts`, tabela de registro em `src/App.tsx` e traduções.

### Recurso 3 — Sugestão explicada de progressão de carga

**Objetivo a alcançar:** orientar quando considerar manter ou aumentar a carga, usando execuções comparáveis, faixa prescrita e esforço informado.

**Por que implementar:** transformar os registros em um próximo passo claro, reduzindo decisões por memória e tornando a orientação verificável pelo usuário.

**Primeira versão:** um motor local de regras revisadas. A sugestão apresenta a decisão, os registros utilizados e o motivo. Aumentar a carga continua sendo uma escolha do usuário.

**Etapas de implementação:**

1. Especificar e revisar as regras antes de codificá-las: dados mínimos, execuções comparáveis, alcance da faixa, esforço informado e condições que impedem uma sugestão.
2. Definir incrementos disponíveis por equipamento e unidade. O próximo incremento deve existir na realidade do testador.
3. Separar a regra em uma função testável, sem depender de texto produzido por IA.
4. Retornar uma decisão estruturada, motivos, referências dos registros e versão da regra.
5. Mostrar `Aceitar`, `Manter` e `Editar`, registrando a decisão do usuário.
6. Quando faltar histórico ou contexto, informar o que falta e manter a orientação anterior sem fabricar uma recomendação.

**Dependências:** recursos 1, 2 e 4. Usar o contexto do recurso 5 quando disponível; não presumir um objetivo ausente.

**Critérios de aceitação:**

- [ ] Os mesmos dados e a mesma versão de regra produzem a mesma sugestão.
- [ ] O usuário pode verificar quais sessões sustentaram a decisão.
- [ ] Séries incompletas, variantes diferentes e mudanças de unidade recebem tratamento explícito.
- [ ] A carga não aumenta automaticamente e a recusa não impede continuar o treino.
- [ ] As condições das regras são documentadas como decisões revisadas do produto, sem apresentá-las como limiares científicos universais.

**Validação com os testadores:** registrar sugestões aceitas, editadas e recusadas, com motivo opcional. Verificar se os incrementos estavam disponíveis e se a explicação era compreensível.

**Pontos de partida no código:** novo módulo de regras, histórico detalhado e apresentação da prescrição em `src/components/ExercisePrescription.tsx`.

### Recurso 4 — Ciência acessível em cada orientação

**Objetivo a alcançar:** permitir entender o motivo de uma orientação e consultar a fonte que a sustenta, com limites claros de aplicação.

**Por que implementar:** transmitir confiança depende de rastreabilidade e conteúdo revisado. Uma escolha presente no Markdown ou uma resposta de IA não constitui, por si só, validação científica.

**Primeira versão:** cartões curtos para divisão, volume, repetições, descanso, esforço e progressão, integrados ao “Entenda seu programa” e aos pontos de decisão.

**Etapas de implementação:**

1. Inventariar afirmações exibidas atualmente e classificá-las como evidência, escolha do protocolo ou observação pessoal.
2. Revisar as afirmações do `treino_v_taper.md` antes de utilizá-las como justificativa científica, incluindo as relacionadas à cintura, ao vacuum e à fadiga do sistema nervoso central.
3. Criar um catálogo de referências com título, autores ou instituição, ano, link, população estudada, conclusão relevante, limitações e data de revisão.
4. Vincular cada explicação às referências que efetivamente sustentam aquela afirmação.
5. Mostrar explicação simples primeiro e detalhes científicos por expansão.
6. Versionar o conteúdo e registrar o responsável pela revisão. Conteúdo ainda não revisado não recebe selo de validação científica.

**Dependências:** pode começar imediatamente. Recebe os dados existentes de `src/programInsights.ts`.

**Critérios de aceitação:**

- [ ] Cada afirmação científica liberada possui referência verificável e pertinente.
- [ ] O usuário distingue o que vem do protocolo e o que vem da literatura.
- [ ] A aplicação informa limitações relevantes, sem prometer resultados individuais.
- [ ] Textos em português e inglês preservam o mesmo sentido.
- [ ] Revisar a explicação não altera silenciosamente a prescrição de treino.

**Validação com os testadores:** pedir que expliquem o motivo de uma orientação e identifiquem sua fonte. Registrar trechos confusos ou excessivamente técnicos.

**Pontos de partida no código:** `src/components/ProgramExplanation.tsx`, `src/programInsights.ts`, dados do protocolo e traduções.

### Recurso 5 — Configuração inicial de aproximadamente um minuto

**Objetivo a alcançar:** coletar o contexto mínimo para relacionar o programa ao objetivo, experiência, equipamentos, disponibilidade e prioridades do usuário.

**Por que implementar:** a aplicação já pergunta objetivo e disponibilidade, mas ainda precisa conhecer condições práticas para evitar orientações baseadas em suposições.

**Primeira versão:** fluxo curto, opcional e editável, aproveitando os campos atuais. Ao terminar, apresentar como o programa atual se relaciona com as respostas e onde existem incompatibilidades.

**Etapas de implementação:**

1. Definir os campos essenciais: objetivo, experiência, dias, tempo, equipamentos, incrementos disponíveis e prioridades musculares opcionais.
2. Migrar os dados já salvos em `training-context`, evitando preenchimento duplicado ou respostas conflitantes.
3. Criar etapas pequenas com opção de pular e voltar.
4. Exibir uma síntese do contexto, compatibilidade de agenda e necessidades de revisão do plano.
5. Permitir edição posterior sem reiniciar o programa ou apagar registros.

**Dependências:** reaproveitar a explicação atual; recurso 4 para justificar as orientações.

**Critérios de aceitação:**

- [ ] É possível configurar, pular e editar o contexto sem criar conta.
- [ ] Informações ausentes permanecem desconhecidas, sem assumir experiência ou equipamentos.
- [ ] O resultado distingue compatibilidade de rotina de garantia de eficácia.
- [ ] Alterar uma resposta não modifica o treino automaticamente.
- [ ] Ambos os testadores concluem o fluxo sem ajuda; aproximadamente um minuto é uma meta inicial de usabilidade, sujeita a ajuste.

**Validação com os testadores:** medir tempo, dúvidas, campos ignorados e capacidade de reconhecer incompatibilidades reais.

**Pontos de partida no código:** contexto pessoal em `src/components/ProgramExplanation.tsx`, preferências e novas telas de configuração.

### Recurso 6 — Modo de treino guiado, instalável e offline

**Objetivo a alcançar:** permitir executar a sessão no celular com poucos toques e continuidade mesmo sem conexão.

**Por que implementar:** durante o treino, consultar a tela, digitar e navegar competem com a atividade principal. A experiência deve tornar evidente a próxima ação e preservar o que foi registrado.

**Primeira versão:** tela focada no exercício atual, com referência anterior, meta, registro, descanso e próximo movimento. Disponibilizar instalação como PWA quando suportada pelo navegador.

**Etapas de implementação:**

1. Criar uma visualização guiada usando a mesma sessão e os mesmos registros da tela atual.
2. Estruturar super-séries por grupo e rodada, para orientar a alternância sem depender apenas de uma anotação textual.
3. Estruturar o drop-set em etapas de carga e repetições dentro da série, preservando a contagem de séries principais e os detalhes executados.
4. Melhorar ações de concluir, desfazer, voltar e retomar; incluir resposta sonora ou tátil opcional quando disponível.
5. Preparar manifesto, ícones e cache dos arquivos necessários ao treino offline.
6. Basear os cronômetros em horários registrados para recalcular o tempo após suspensão da tela. Não depender de atualizações contínuas em segundo plano.
7. Aplicar atualizações da aplicação sem interromper a sessão ou eliminar dados locais.

**Dependências:** recurso 1; integrar RIR do recurso 2 e contexto do recurso 5.

**Critérios de aceitação:**

- [ ] As visualizações atual e guiada representam a mesma sessão, sem duplicar registros.
- [ ] Super-séries orientam a alternância e aplicam o descanso correto após o par.
- [ ] As etapas de drop-set ficam no histórico sem inflar a contagem de séries principais.
- [ ] Após carregar os recursos necessários online, é possível executar e salvar uma sessão em modo avião.
- [ ] Recarregar, suspender e retomar a tela preserva a sessão e recalcula os temporizadores.
- [ ] A experiência funciona mesmo quando instalação, som ou vibração não estão disponíveis.

**Validação com os testadores:** acompanhar uma sessão completa, incluindo modo avião e suspensão da tela. Comparar toques, erros, esquecimentos de registro e facilidade de retomar.

**Pontos de partida no código:** sessão em `src/App.tsx`, componentes de registro, estilos, configuração do Vite e arquivos públicos da PWA.

### Recurso 7 — Substituições de exercícios com critérios claros

**Objetivo a alcançar:** oferecer alternativas úteis quando o equipamento estiver ocupado ou indisponível, explicando o que a troca preserva e altera.

**Por que implementar:** obstáculos práticos podem interromper a sessão. Alternativas revisadas permitem continuar com uma decisão compreensível.

**Primeira versão:** botão “Substituir” com opções de um catálogo revisado e motivo da troca. Começar pelas alternativas já previstas no protocolo.

**Etapas de implementação:**

1. Representar exercícios e variantes com identificadores próprios, equipamento, padrão de movimento, músculo principal e requisitos relevantes.
2. Criar relações de substituição revisadas. Compartilhar um músculo não basta para declarar equivalência.
3. Filtrar opções pelos equipamentos informados e permitir corrigir essa disponibilidade no momento da sessão.
4. Mostrar diferenças de execução e prescrição, mantendo a carga anterior separada por variante.
5. Permitir aplicar somente à sessão atual ou ao programa futuro, com escolhas explícitas e possibilidade de desfazer.

**Dependências:** recursos 1, 4 e 5. Integrar ao modo guiado quando disponível.

**Critérios de aceitação:**

- [ ] Toda alternativa oferecida possui justificativa revisada e requisitos conhecidos.
- [ ] A troca não copia automaticamente a carga de outro exercício ou equipamento.
- [ ] O histórico identifica o exercício realmente realizado.
- [ ] O usuário distingue uma mudança pontual de uma alteração permanente.
- [ ] A substituição não elimina séries já concluídas.

**Validação com os testadores:** simular equipamento ocupado e observar se conseguem escolher e executar o próximo passo sem ajuda. Registrar alternativas ausentes ou impraticáveis.

**Pontos de partida no código:** catálogo e variantes de exercícios, biblioteca, seleção de exercícios e sessão ativa.

### Recurso 8 — Adaptação ao tempo disponível no dia

**Objetivo a alcançar:** apresentar uma versão da sessão que respeite o tempo informado, com prioridades e alterações explícitas antes da confirmação.

**Por que implementar:** imprevistos podem tornar a sessão completa inviável. Uma adaptação compreensível ajuda o usuário a decidir o que consegue realizar naquele dia.

**Primeira versão:** informar o tempo antes de iniciar, receber uma proposta reduzida e comparar com a original. Começar com regras locais revisadas e adaptação apenas da sessão daquele dia.

**Etapas de implementação:**

1. Melhorar a estimativa de duração com registros reais comparáveis, descansos e transições; identificar quando a estimativa ainda tem poucos dados.
2. Definir com revisão de conteúdo a prioridade dos exercícios e quais ajustes são permitidos.
3. Calcular uma proposta que preserve os descansos estabelecidos, sem encurtá-los indiscriminadamente para fazer o treino caber.
4. Mostrar exercícios ou séries mantidos, retirados ou reduzidos e seus motivos.
5. Exigir confirmação antes de iniciar a versão adaptada e guardar sua prescrição no histórico.
6. Quando o tempo for incompatível com as regras definidas, informar essa limitação em vez de prometer uma sessão equivalente.

**Dependências:** recursos 1, 4 e 5. Recurso 6 para representar corretamente super-séries e drop-sets no cálculo.

**Critérios de aceitação:**

- [ ] A proposta informa que a duração é estimada e mostra a comparação com o treino original.
- [ ] O usuário pode aceitar, editar ou cancelar sem alterar o programa permanente.
- [ ] O histórico distingue a sessão adaptada da prescrição original.
- [ ] As prioridades utilizadas são explicáveis e revisadas.
- [ ] A aplicação não garante resultados equivalentes entre versões de volume diferente.

**Validação com os testadores:** comparar tempo informado, estimado e realizado; verificar se a pessoa compreendeu as escolhas e conseguiu concluir a versão proposta.

**Pontos de partida no código:** estimativa de duração em `src/data.ts`, prioridades do programa e preparação da sessão.

### Recurso 9 — Painel de evolução e revisão semanal

**Objetivo a alcançar:** tornar visível a evolução registrada e reunir dificuldades da rotina para apoiar decisões futuras.

**Por que implementar:** o usuário precisa perceber o resultado dos próprios registros. Comparações claras também fornecem contexto para revisar progressão, adaptações e utilidade do aplicativo.

**Primeira versão:** evolução por exercício, frequência, séries realizadas, duração das sessões e check-in semanal curto sobre disposição, recuperação percebida e dificuldades.

**Etapas de implementação:**

1. Definir métricas a partir dos dados já coletados, com separação por variante, unidade e versão de prescrição quando necessário.
2. Mostrar cargas e repetições em conjunto, sem tratar aumento de volume total como prova automática de ganho muscular.
3. Comparar planejado e realizado, identificando sessões incompletas ou adaptadas.
4. Adicionar check-in opcional e permitir relacionar os relatos aos treinos da semana.
5. Apresentar tendências descritivas com quantidade de registros e período observado.
6. Exibir estados de dados insuficientes e evitar diagnósticos automáticos de fadiga, lesão ou estagnação.

**Dependências:** recursos 1 e 2; integrar contexto e decisões dos recursos 3, 5, 7 e 8 conforme forem disponibilizados.

**Critérios de aceitação:**

- [ ] Os valores exibidos podem ser conferidos nos registros de origem.
- [ ] Unidades, variantes e exercícios em segundos não geram comparações indevidas.
- [ ] O painel informa o período e a quantidade de sessões utilizadas.
- [ ] É possível distinguir dado observado, relato do usuário e interpretação.
- [ ] Com pouco histórico, a aplicação informa a limitação em vez de apresentar uma tendência como conclusiva.

**Validação com os testadores:** pedir que identifiquem uma conquista e uma dificuldade da semana usando o painel; conferir se a interpretação corresponde aos registros.

**Pontos de partida no código:** histórico detalhado, novos cálculos de evolução e componentes de visualização.

### Recurso 10 — Copiloto de IA contextual com fontes verificáveis

**Objetivo a alcançar:** responder dúvidas e produzir revisões do treino usando o programa atual, os registros disponíveis e conteúdo científico revisado.

**Por que implementar:** a IA pode transformar dados e explicações em uma conversa acessível. Sua utilidade depende de contexto correto, referências pertinentes e respostas que possam ser verificadas.

**Primeira versão:** começar pela revisão semanal. Depois, liberar perguntas contextualizadas como “O que mudou no meu desempenho?” e “Por que a carga foi mantida?”. As regras de progressão continuam calculadas pelo motor local; a IA explica as decisões.

**Etapas de implementação:**

1. Definir os tipos de pergunta aceitos e exemplos de respostas esperadas, incluindo falta de dados, premissas incorretas e ausência de referências suficientes.
2. Preparar um contexto estruturado e mínimo com programa, registros pertinentes, decisões das regras, período e referências revisadas.
3. Criar um serviço mínimo para a integração remota, mantendo credenciais fora do navegador. Isso não exige login nem banco de usuários; os dados podem continuar locais e ser enviados somente para a solicitação escolhida.
4. Informar quais dados serão enviados, evitar identificadores desnecessários e documentar o tratamento dos dados pelo provedor antes da liberação.
5. Exigir resposta estruturada com fatos usados, interpretação, sugestões, limitações e identificadores das fontes fornecidas.
6. Validar os identificadores e números retornados. Não aceitar referências inventadas nem apresentar uma referência real como suporte de uma afirmação que ela não sustenta.
7. Mostrar qualquer proposta de mudança separadamente, com comparação e confirmação do usuário. A primeira versão não altera o programa automaticamente.
8. Prever tempo limite, limite de uso/custo, falhas de conexão e opção de continuar com as explicações locais.
9. Registrar localmente feedback de utilidade e, quando necessário à avaliação, versão do modelo, conteúdo e contexto usados, respeitando a escolha do testador.

**Dependências:** recursos 1, 4, 5 e 9. Aproveita RIR, progressão e adaptações conforme disponíveis. A integração de IA é a única etapa que prevê um serviço remoto neste plano.

**Critérios de aceitação:**

- [ ] A resposta usa o programa e o período corretos, sem inventar treinos, cargas ou resultados.
- [ ] Fatos, interpretações e sugestões aparecem diferenciados.
- [ ] Fontes citadas pertencem ao catálogo revisado e sustentam as afirmações associadas.
- [ ] Ausência de dados ou evidência é comunicada claramente.
- [ ] A IA não modifica o programa nem substitui uma regra de progressão sem revisão do usuário.
- [ ] Falha ou indisponibilidade da IA não impede registrar e concluir o treino.
- [ ] Credenciais não ficam no aplicativo entregue ao navegador e há controle de acesso/uso do serviço de teste.
- [ ] Um conjunto fixo de perguntas e registros é avaliado antes de disponibilizar uma nova versão aos testadores.

**Validação com os testadores:** conferir precisão dos fatos, compreensão e utilidade de cada revisão. Coletar perguntas reais, marcar respostas incorretas e comparar a ajuda recebida com a explicação local já existente.

**Pontos de partida no código:** serviço separado de IA, catálogo de evidências, contexto pessoal, histórico e painel semanal. A escolha do provedor fica para a implementação.

## 5. Protocolo de validação com os dois testadores

### Preparação

1. Identificar os participantes somente como Testador A e Testador B nos relatórios de avaliação.
2. Registrar navegador, dispositivo, experiência com treino e rotina prevista.
3. Observar aproximadamente uma semana da versão atual como referência inicial. Ajustar esse período se não houver sessões suficientes para observar os fluxos.
4. Registrar dificuldades, dúvidas, tempo para cadastrar séries e situações que levaram a abandonar o aplicativo ou o registro.
5. Garantir um backup antes de migrar registros existentes assim que o mecanismo do recurso 1 estiver disponível.

### A cada entrega

1. Liberar um recurso por vez, mantendo uma versão identificável e um caminho de recuperação dos dados.
2. Verificar os cenários técnicos antes do teste cotidiano.
3. Apresentar a tarefa, observando se a interface é compreendida sem explicação adicional.
4. Coletar evidências separadas para cada pessoa; registrar correções durante o teste.
5. Usar mais de uma execução comparável quando o recurso depender de histórico. Uma semana não é automaticamente suficiente para todos os recursos.
6. Decidir se o recurso será mantido, ajustado ou retirado antes de acrescentar outra mudança que dificulte interpretar os resultados.

### Registro sugerido de avaliação

| Campo | O que registrar |
| --- | --- |
| Versão, data e testador | Qual entrega foi utilizada e por quem |
| Recurso e tarefa | O que a pessoa tentou realizar |
| Resultado | Concluiu sozinha, concluiu com ajuda ou não concluiu |
| Esforço de uso | Tempo, toques e erros, quando fizer sentido medir |
| Compreensão | O que a pessoa entendeu da orientação |
| Utilidade | Qual decisão ou dificuldade o recurso ajudou a resolver |
| Problema observado | Descrição concreta, exemplo e frequência |
| Próxima ação | Manter, corrigir, simplificar ou retirar |

### Como interpretar os resultados

- Dois testadores permitem descobrir problemas e avaliar utilidade nas duas rotinas observadas.
- Os resultados não demonstram eficácia científica do programa nem representam automaticamente outros públicos.
- Aceitar uma sugestão não comprova que ela era adequada; avaliar também sua justificativa e os registros usados.
- Critérios e metas de usabilidade devem ser definidos antes de cada rodada e ajustados com justificativa, sem convertê-los em alegações científicas.

## 6. Critérios comuns de conclusão de cada entrega

- [ ] Objetivo e critérios específicos do recurso atendidos.
- [ ] Dados anteriores preservados, com migração e recuperação verificadas quando aplicável.
- [ ] Uso confortável no celular e navegação por teclado nos controles envolvidos.
- [ ] Conteúdo e estados de erro disponíveis em português e inglês.
- [ ] Cenários relevantes cobertos: primeiro uso, ausência de dados, sessão em andamento, recarga e falha de persistência ou conexão quando pertinente.
- [ ] `npm run build` concluído com sucesso.
- [ ] Testes pertinentes adicionados aos fluxos de `tests/browser.mjs`, reaproveitando os testes existentes sem sobrescrever dados reais dos testadores.
- [ ] Conteúdo científico e regras de decisão revisados antes de serem apresentados como orientação.
- [ ] Evidências de uso dos dois testadores registradas e limitações conhecidas documentadas.
- [ ] README atualizado quando a entrega mudar o uso da aplicação.

## 7. Referências iniciais para a revisão de conteúdo

Estas referências foram levantadas durante a discussão do plano. Elas são pontos de partida para a revisão; não validam automaticamente todas as regras ou frases propostas. Conferir o texto completo, a população estudada, as limitações e a atualização da literatura antes de implementar orientações.

- [ACSM — Diretrizes de treinamento resistido de 2026](https://acsm.org/resistance-training-guidelines-update-2026/).
- [ACSM — Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews](https://pubmed.ncbi.nlm.nih.gov/41843416/).
- [Without Fail: Muscular Adaptations in Single-Set Resistance Training Performed to Failure or with Repetitions-in-Reserve](https://pubmed.ncbi.nlm.nih.gov/40249908/).
- [Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy](https://pubmed.ncbi.nlm.nih.gov/39205815/).

## 8. Próxima tarefa ao retomar o plano

Validar os **recursos 1 e 2 (Histórico completo por exercício e Registro simples de esforço com RIR)** no uso cotidiano dos dois testadores. Observar compreensão do RIR, frequência de uso, respostas "não sei" e facilidade de registro sem interrupção do descanso. Após a avaliação cotidiana e eventuais ajustes, avançar para o recurso 4 (catálogo e revisão de referências científicas) e para as etapas seguintes (recurso 5 e recurso 3).
