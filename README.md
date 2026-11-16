# Recordar — aplicativo mobile de Louise

Migração do front-end PWA para React Native + Expo, com áreas de paciente, médico e administrador. Histórico organizado em um commit por task para a `main`.

## Rodar o aplicativo

Requisitos: Node.js 24 e npm; Expo Go compatível com SDK 58 ou um development build correspondente.

```powershell
npm ci
Copy-Item .env.example .env
```

Edite `.env` e configure `EXPO_PUBLIC_API_URL` com a URL da API terminando em `/api`. Em celular físico, use o IP do computador na mesma rede, por exemplo `http://192.168.0.10:3000/api`. `localhost` no celular aponta para o próprio celular. Para a API hospedada da equipe, use o endereço fornecido pela equipe. Nenhuma credencial ou URL de produção foi embutida.

```powershell
npm start
```

Escaneie o QR no Expo Go. Alternativas: `npm run android` para emulador; `npm run web` para navegador. A exportação gera bundles, não um APK.

## Backend local para demonstração

Em uma pasta ao lado da pasta do app:

```powershell
git clone https://github.com/gabriellemnunes/backend-recordar-mobile.git backend
cd backend
npm ci
npm run demo
```

A demonstração existente na API sobe na porta 3000 e usa banco descartável. Paciente: `paciente@demo.recordar`; médico: `medico@demo.recordar`; senha fictícia: `RecordarDemo123!`. A demonstração existente não cria administrador. O script de integração abaixo cria os três perfis em um banco independente e encerra o banco ao terminar.

## Testar

```powershell
npm test
npm run check:format
npm run export
```

Integração HTTP com a cópia do backend em `../backend`:

```powershell
npm run test:integration
```

Se o backend estiver em outra pasta:

```powershell
$env:RECORDAR_BACKEND_DIR='C:\caminho\backend-recordar-mobile'
npm run test:integration
```

A integração baixa MongoDB 7.0.24 na primeira execução (aproximadamente 600 MB). Cria banco temporário e dados fictícios, sem usar o banco oficial. Os testes de componentes usam controles nativos simulados; não substituem testes de aparelho, TalkBack ou VoiceOver.

## Funcionalidades

- Login dos três perfis; cadastro de paciente e recuperação de senha de paciente/médico.
- Navegação Stack/Tabs, retorno de tela e sessão nativa em armazenamento protegido.
- Paciente: agenda diária, remédios e tomada, anamnese, perfil, consultas e histórico.
- Agendamento: pré-triagem concluída ou direto, filtros, confirmação, troca, cancelamento, conflitos e lembretes locais.
- Médico: horários por clínica, pacientes, anamnese, prescrições, aviso de troca, consulta realizada e histórico.
- Administrador: cadastro/edição/exclusão de clínicas e especialidades; gestão de pacientes, médicos e administradores; exclusão de consultas com confirmação e aviso sobre as prescrições vinculadas.
- Texto maior e modo claro no login, aplicados ao app; leitura de instruções; controles de pelo menos 56 pontos; seletores nativos de data e horário.

## Chatbot: dependência externa pendente

O backend clonado não expõe uma rota de conversa. A interface mostra essa indisponibilidade e permite ir ao agendamento. Para ativar o envio, a equipe precisa disponibilizar uma rota autenticada e configurar `EXPO_PUBLIC_CHAT_PATH` com um caminho relativo na mesma API. Contrato proposto: POST `{ mensagem, id_conversa }` retorna `{ resposta, id_conversa }`. Esse contrato precisa ser confirmado com quem implementa o serviço de IA. Não há respostas médicas simuladas nem segredo de serviço no aplicativo. As pré-triagens já persistidas são lidas e usadas pelo agendamento existente.

## Limites da validação

As duas mudanças foram aplicadas e testadas na versão 3 do arquivo Figma que Louise abriu: https://www.figma.com/make/uGF9kF36Ri08GvOyWiogI1/Mobile-version-of-Recordar. Consulte `docs/FIGMA.md`. A igualdade visual completa de todas as telas ainda não foi auditada. Não houve revisão visual em aparelho físico nem validação real de notificações, voz e leitores de tela.

O primeiro envio por Git local falhou por bloqueio do gerenciador de credenciais. O histórico foi reorganizado por task para envio pelo conector GitHub autorizado. Consulte o histórico da main e `docs/COMMITS-POR-TASK.md` para os commits publicados. Os hashes do pacote local anterior são diferentes dos commits reorganizados.

## Estrutura

`App.js`: sessão e navegação por papel. `src/components`: controles, temas e acessibilidade. `src/screens`: autenticação e áreas funcionais. `src/api.js`: HTTP autenticado e erros. `src/reminders.js`: notificações locais existentes. `test`: testes de contrato e componentes. `scripts/integration.cjs`: integração com MongoDB descartável.
