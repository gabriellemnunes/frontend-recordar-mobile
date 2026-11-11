# Recordar mobile — agendamento

Parte da Gabi em React Native + Expo SDK 58, adaptada do fluxo oficial de https://github.com/louisemartinss/recordar.frontend.

## Executar

```sh
npm ci
```

Copie `.env.example` para `.env` e informe a URL da **cópia** da API, terminando em `/api`. Em celular físico use o IP do computador na rede. Depois:

```sh
npm start
```

Use um cliente Expo Go compatível com SDK 58 ou uma versão Android de desenvolvimento. Entre com uma conta de paciente da cópia do backend. Para demonstrar com dados fictícios, use `npm run demo` no backend; conta: `paciente@demo.recordar`, senha: `RecordarDemo123!`.

## Escopo

Agenda, seleção de pré-triagem concluída, busca por especialidade recomendada, filtros, confirmação, cancelamento, troca de horário e lembretes locais. O login mínimo permite validar a entrega isoladamente. O app completo de Louise deve incorporar esse fluxo ao login e à navegação compartilhados.

O chatbot deve persistir a pré-triagem no backend antes de utilizá-la. Resultados urgentes não podem ser usados no agendamento comum. O aplicativo não calcula diagnóstico nem gera recomendações.

## Testar

```sh
npm test
npx expo export --platform android --output-dir dist
```

Os testes cobrem o contrato das requisições e o cálculo dos lembretes. A exportação verifica o bundle Android; não gera um APK e não substitui teste em aparelho.

## Lembretes

Ativação explícita pelo paciente; 24h e 1h antes no horário de Brasília. São locais, com até 60 notificações futuras. Recalculados após alterações e ao retornar ao aplicativo. Ao sair da conta, as notificações deste módulo são removidas. Alterações realizadas em outro dispositivo dependem da próxima sincronização. Não são notificações push.

## Integração

`src/api.js` centraliza autenticação, timeout e mensagens de erro. `src/reminderPlan.js` calcula os horários sem depender do Expo. `src/reminders.js` opera notificações locais. `App.js` contém o fluxo de agenda/horários/confirmação e o acesso mínimo de paciente para validação.

Nenhum endereço de produção, token ou credencial oficial está embutido. Cadastro, recuperação de senha, telas de médico/admin e chatbot ficam com os respectivos responsáveis.
