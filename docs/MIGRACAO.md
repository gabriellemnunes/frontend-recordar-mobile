# Plano de migração de Louise

Base: PWA louisemartinss/recordar.frontend (snapshot clonado em 16/11/2026).
Destino: branch louise/mobile-completo; preservar main e o módulo de agendamento existente.

1. Base React Native + Expo e componentes compartilhados.
2. Login, cadastro e recuperação com os contratos do PWA.
3. Áreas de paciente, médico e administrador.
4. Stack/Tabs e retorno Android.
5. Consultas, medicamentos, perfil e agenda diária.
6. Chatbot e incorporação do agendamento existente.
7. Integração e testes de contrato contra API de demonstração.
8. Acessibilidade no login (retirada dos perfis), revisão e documentação.

Mudança solicitada: exclusão de consultas pelo admin usa DELETE /consultas/:id já autorizado pela API. Confirmação deve explicar que prescrições vinculadas também são excluídas.

Ordem: app primeiro, Figma depois, para documentar telas e comportamento validados.

