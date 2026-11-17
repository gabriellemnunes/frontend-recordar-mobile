# Agendamento integrado — revisão de 17/11/2026

Base analisada: `f4755c30ac4879eaf9a0bf825ba33faea05edae3` (frontend) e `db93eb00d39f4707f95acb6dac30244ba457cb53` (backend). Foram aproveitadas a navegação Stack/Tabs, as telas, a acessibilidade, a rota protegida de pré-triagem e o histórico acrescentados por Louise e Bia.

## Correções da parte da Gabi

- O backend de pré-triagem retorna `id`, sem `_id`. A seleção, a busca recomendada e a confirmação agora usam esse contrato; `_id` continua aceito para resultados antigos.
- O chatbot abre a aba `Agendamento` dentro da tela `Recordar` da Stack. Quando o serviço retornar `id_pre_triagem`, o aplicativo busca o resultado em `GET /pre-triagens/:id`, confirma que está concluído e apresenta a recomendação/urgência antes de buscar horários. O aplicativo não aceita especialidades ou urgência inventadas pelo cliente.
- Duração, intensidade e alertas já fornecidos pelo serviço são exibidos. Os sintomas persistidos preenchem o formulário; não são inferidos pelo aplicativo.
- Reagendamento envia `id_consulta_atual` na busca de horários. O servidor valida a consulta do paciente, mantém o médico e a pré-triagem e permite outro horário no mesmo dia sem tratar a própria reserva como conflito.
- O servidor oculta horários que conflitam com outras consultas do paciente. O bloqueio transacional permanece na confirmação para proteger contra reservas simultâneas.
- Cancelamento confirmado atualiza a lista local e os lembretes antes de tentar recarregar a API. Uma falha de conexão posterior não é exibida como falha do cancelamento.
- Lembretes sincronizam ao entrar na sessão e retornar ao aplicativo, mesmo sem abrir a aba de agendamento. Consultas realizadas saem do plano; o histórico não gera lembretes. Operações são serializadas e uma leitura antiga não sobrescreve um reagendamento mais recente. A saída da conta remove os lembretes deste módulo.
- No navegador, o módulo não tenta acessar notificações nativas; a ativação orienta usar o aplicativo do celular.

## Contrato com o chatbot

`POST EXPO_PUBLIC_CHAT_PATH` continua sendo responsabilidade do serviço de IA. O contrato existente `{ mensagem, id_conversa }` / `{ resposta, id_conversa }` foi preservado. Para encaminhar um resultado específico ao agendamento, o serviço pode acrescentar `id_pre_triagem` na resposta, depois de persistir o resultado pela rota privada do backend. Sem esse campo, o paciente pode escolher entre suas pré-triagens concluídas.

Nenhum segredo do serviço de IA é colocado no aplicativo. A rota real de conversa ainda precisa ser fornecida por Andreza; esta revisão não cria um chatbot médico simulado.

## Validação

- 31 testes de contrato, componentes e lembretes do frontend.
- 25 verificações de integração HTTP entre o cliente mobile e um replica set descartável.
- 25 testes do backend, incluindo os testes de Bia e as regressões de vínculo/histórico/reagendamento da Gabi.

Os controles nativos são simulados nos testes de componentes. Continua pendente a validação de notificações, navegação e acessibilidade em aparelho físico. Alterações feitas por outro dispositivo só atualizam os lembretes quando o aplicativo volta a sincronizar.

Exportação Android (Hermes) e web concluída. A verificação de formatação passa nos arquivos alterados; o comando global ainda sinaliza oito arquivos de Louise não alterados nesta revisão (`Accessibility.js`, `ui.js`, `reminderPlan.js`, `Areas.js`, `Auth.js`, `Care.js`, `storage.js` e `flow.test.js`).
