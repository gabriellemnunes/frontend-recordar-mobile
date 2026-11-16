# Commits por task — Louise

O histórico foi reorganizado a partir da main 2f92c413b4f66d33fbcb6a59cf682ba8a776d47a, com um commit para cada task de Louise. A ordem de implementação segue as dependências; a numeração abaixo segue a lista original.

| Task | Mensagem do commit |
|---|---|
| 1. React Native + Expo | feat(task 1): estrutura aplicativo React Native com Expo |
| 2. Login, cadastro e recuperação | feat(task 2): adapta login cadastro e recuperacao de senha |
| 3. Paciente, médico e administrador | feat(task 3): cria areas de paciente medico e administrador |
| 4. Stack/Tabs | feat(task 4): conecta navegacao Stack e Tabs por perfil |
| 5. Consultas, medicamentos, perfil e agenda | feat(task 5): implementa consultas medicamentos perfil e agenda |
| 6. Chatbot e agendamento | feat(task 6): integra agendamento e interface do chatbot |
| 7. Integração com API e testes | feat(task 7): integra API e valida fluxos com testes automatizados |
| 8. Acessibilidade para idosos | feat(task 8): aplica acessibilidade para idosos e opcoes no login |

A exclusão de consultas pelo administrador está na task 3. As opções de acessibilidade no login estão na task 8. O chatbot tem interface e estado de indisponibilidade; a rota real de conversa continua pendente no backend.

Os arquivos de código finais são idênticos aos da versão validada, com 19 testes de front, 20 de backend e 21 verificações HTTP aprovadas, além das exportações Android/iOS/web. Mudaram o agrupamento dos commits e a documentação sobre o Figma e a publicação.

A main remota só é considerada atualizada após confirmação do envio. Se o conector ou a autenticação negarem gravação, este histórico permanece local. Para publicar, com conta autorizada autenticada, use git push origin HEAD:main sem force. Se a main tiver avançado, integre as alterações antes do envio.
