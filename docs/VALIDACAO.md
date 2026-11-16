# Revisão e validação — Recordar mobile

## Escopo entregue em código

| Task de Louise | Implementação |
|---|---|
| React Native + Expo | Base SDK 58, componentes nativos compartilhados, ícone e logo do PWA |
| Login, cadastro e recuperação | Contratos reais da API; três acessos, cadastro de paciente e recuperação para paciente/médico |
| Telas dos três perfis | Início e áreas de paciente, médico e administrador |
| Stack/Tabs | Abas por perfil e pilha para detalhes; retorno no fluxo de agendamento |
| Consultas, medicamentos, perfil e agenda | Listagem, edição de perfil, anamnese, tomada, prescrição, agenda diária e histórico |
| Chatbot e agendamento | Agendamento integrado; interface do chatbot com indisponibilidade explícita até existir serviço |
| Integração com backend | HTTP autenticado, sessão expirada, timeout, mensagens de erro e workflow com banco descartável |
| Acessibilidade | Texto maior/Modo claro no login, voz, rótulos, estados selecionados/desabilitados, controles grandes e seletores nativos de data/hora |

A exclusão administrativa usa a rota existente DELETE /consultas/:id. A confirmação explica o efeito sobre prescrições e a lista só muda após sucesso da API. Nenhuma alteração no código do backend foi necessária.

## Evidência automatizada

- Front-end: 19 testes passaram, zero falhas/ignorados. Contrato HTTP, expiração de sessão, filtros e lembretes; login dos três perfis; cadastro, confirmação de senha e recuperação; exclusão administrativa e erro de rede; tomada e desfazer; chatbot indisponível; agendamento direto com motivo/sintomas; conflito 409; bloqueio de pré-triagem urgente; atualização de perfil; preferências fora do perfil; criação de horários; cadastro de clínica.
- Backend clonado: 20 testes existentes passaram, zero falhas/ignorados. Incluem concorrência, vínculo de pré-triagem, autorização de serviço de IA, urgência, histórico e preservação de prescrições no cancelamento.
- Integração real HTTP: 21 verificações passaram contra Express e MongoDB temporário. O script usa o mesmo cliente src/api.js do app. Inclui cadastro e acesso dos três perfis, vínculos, anamnese, horários, pré-triagem, reserva, prescrição, agenda diária, tomada e desfazer, edição, troca, pacientes do médico, histórico, exclusão administrativa com prescrições, cancelamento, recuperação e restrição de acesso.
- Exportação final: bundles Android e iOS com Hermes e bundle web gerados com sucesso; não são APK/IPA.
- Formatação: Prettier passou.
- Dependências Expo: expo install --check informou Dependencies are up to date.

Os testes de componentes simulam as primitivas nativas. Eles exercitam os handlers e a renderização React, mas não comprovam posicionamento visual, teclado real, gestos, TalkBack/VoiceOver ou notificações no sistema operacional.

## Pendências que impedem homologação completa

1. Figma Make: as duas mudanças foram aplicadas e testadas na versão 3 do arquivo aberto por Louise (uGF9kF36Ri08GvOyWiogI1). A comparação visual integral entre app e protótipo continua pendente. Evidências e escopo em FIGMA.md.
2. Chatbot: não existe rota de conversa no backend clonado. A interface está pronta para um contrato proposto, condicionado à implementação e validação do serviço. Resultados de pré-triagem já existentes funcionam no agendamento.
3. Aparelhos: falta revisão visual e funcional em Android/iPhone, seletores nativos, leitura de voz, notificações e leitores de tela. Não foi gerado APK/IPA.
4. GitHub: o primeiro envio local falhou. O histórico foi reorganizado em commits por task para publicação pela conta de Louise Martins (louisemartinss). Consulte COMMITS-POR-TASK.md e o histórico da main para os identificadores remotos.

## Referências inspecionadas

PWA: 4484fecf01cad159abc769b08edab42e9f7dec84.
Backend: db93eb00d39f4707f95acb6dac30244ba457cb53.
Base mobile: 2f92c41.

Os testes usam exclusivamente dados fictícios e bancos temporários. O banco oficial não foi acessado.
