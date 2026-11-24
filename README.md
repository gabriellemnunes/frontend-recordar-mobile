<p align="center">
  <img src="assets/recordar-logo.png" alt="Logo do Recordar" width="180" />
</p>

# Recordar | Aplicativo Mobile

**React Native • Expo SDK 58 • JavaScript**

O **Recordar** é um aplicativo mobile para organização de cuidados de saúde, com áreas para pacientes, médicos e administradores.

## Instalar o APK no Android

Baixe o arquivo .apk publicado em [Releases](https://github.com/gabriellemnunes/frontend-recordar-mobile/releases) ou no link do EAS informado pela equipe. Abra o arquivo no Android e permita a instalação por essa fonte se o sistema solicitar. Abra o Recordar e entre com uma conta de teste da equipe. O APK funciona sem Expo Go e sem servidor Metro.

O perfil de build usa a [API publicada](https://recordar-backend-l5y2.onrender.com/api). Para conferir a disponibilidade, abra o [status da API](https://recordar-backend-l5y2.onrender.com/api/health).

## Gerar o APK de entrega

Depois de instalar as dependências, entre na conta Expo que tem acesso ao projeto e vincule o checkout ao projeto EAS da equipe, se necessário.

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

```bash
npx eas-cli@latest build --platform android --profile apk
```

Use a credencial de assinatura Android do projeto. Quando o build terminar, baixe o APK pelo link do EAS. Instale o arquivo em um Android antes de anexá-lo à Release do GitHub. Registre o commit compilado e o dispositivo usado.

Valide em um Android com uma conta fictícia da equipe:

- Abrir o APK, entrar, encerrar a sessão e entrar novamente.
- Navegar pelas abas e conferir texto ampliado, teclado e botão Voltar.
- Verificar agendamento, histórico, medicamentos e lembretes.
- Abrir o chat e conferir a resposta da API e o encaminhamento ao agendamento.

## Funcionalidades

- Cadastro, login, recuperação de senha e gerenciamento de perfis.
- Agendamento, remarcação e cancelamento de consultas, com pré-triagem integrada.
- Agenda, histórico de consultas, anamnese e acompanhamento de medicamentos.
- Registro de tomadas e lembretes locais.
- Área médica com horários, pacientes e prescrições.
- Área administrativa para clínicas, especialidades, usuários e consultas.
- Navegação Stack/Tabs, ajustes de texto e recursos de acessibilidade.

> O chatbot está integrado à rota autenticada `/api/chat`, com IA local, pré-triagem persistida e encaminhamento ao agendamento. Consulte [docs/CHATBOT.md](docs/CHATBOT.md). Alguns recursos nativos precisam de validação em aparelho físico.

## Tecnologias

React Native, Expo SDK 58, React 19, JavaScript, React Navigation, Expo Secure Store, AsyncStorage, Expo Notifications, Expo Speech, Expo Image Picker e React Native SVG.

## Requisitos

- Node.js 24 e npm
- Git
- Expo Go compatível com SDK 58 ou ambiente de desenvolvimento correspondente
- Acesso à API do Recordar

## Como rodar o frontend

### 1. Clonar o projeto

```bash
git clone https://github.com/gabriellemnunes/frontend-recordar-mobile.git
```

### 2. Entrar na pasta

```bash
cd frontend-recordar-mobile
```

### 3. Instalar as dependências

```bash
npm ci
```

### 4. Criar o arquivo de ambiente (PowerShell)

```powershell
Copy-Item .env.example .env
```

Configure o `.env`:

```dotenv
EXPO_PUBLIC_API_URL=https://recordar-backend-l5y2.onrender.com/api
EXPO_PUBLIC_CHAT_PATH=/chat
```

Para usar um backend local durante o desenvolvimento, troque a URL pelo IP da máquina que executa o backend, seguido de :3000/api. Em celular físico, `localhost` aponta para o próprio celular. Não inclua senhas ou segredos em variáveis `EXPO_PUBLIC_*`.

### 5. Iniciar o Expo

```bash
npm start
```

Abra o Expo Go e escaneie o QR Code. O computador e o celular devem conseguir se comunicar pela rede.

### Outras opções

Android com emulador configurado:

```bash
npm run android
```

Navegador:

```bash
npm run web
```

Limpar cache do Metro:

```bash
npx expo start --clear
```

## Backend local para demonstração

Em outra pasta:

```bash
git clone https://github.com/gabriellemnunes/backend-recordar-mobile.git
```

```bash
cd backend-recordar-mobile
```

```bash
npm ci
```

```bash
npm run demo
```

O ambiente de demonstração documentado utiliza a porta 3000 e um banco descartável. Contas fictícias: `paciente@demo.recordar` e `medico@demo.recordar`, ambas com a senha `RecordarDemo123!`. Não há administrador criado por padrão nessa demonstração. Não utilize essas credenciais em produção.

## Testes e qualidade

Na pasta do frontend, execute separadamente:

```bash
npm test
```

```bash
npm run check:format
```

```bash
npm run export
```

Para testar integração HTTP com o backend localizado em `../backend-recordar-mobile`:

```bash
npm run test:integration
```

Caso o backend esteja em outro diretório, configure a variável `RECORDAR_BACKEND_DIR`. Na primeira execução, os testes de integração podem baixar o MongoDB 7.0.24 (aproximadamente 600 MB). Os testes automatizados não substituem testes em dispositivos reais.

## Estrutura do projeto

```text
frontend-recordar-mobile/
├── assets/              # Recursos visuais
├── docs/                # Documentação
├── scripts/             # Utilitários e integração
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── screens/         # Telas por perfil
│   ├── api.js           # Comunicação com a API
│   └── ...              # Lembretes, armazenamento e utilitários
├── test/                # Testes automatizados
├── App.js               # Entrada, sessão e navegação
├── app.json             # Configuração do Expo
├── package.json         # Scripts e dependências
└── .env.example         # Exemplo de configuração
```

## Integração e documentação

- [Documentação de integração](docs/GABI-INTEGRACAO.md)
- [Histórico de commits por tarefa](docs/COMMITS-POR-TASK.md)
- [Backend](https://github.com/gabriellemnunes/backend-recordar-mobile)

**Recordar** — tecnologia para apoiar a organização do cuidado e o acesso a serviços de saúde.
