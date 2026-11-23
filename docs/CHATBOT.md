# Assistente e pré-triagem

A tela usa `POST /chat` na mesma API autenticada do app. Coleta sintomas, duração, intensidade e informações complementares, e recebe o ID da pré-triagem salva. O encaminhamento continua usando a Stack e a aba Agendamento existentes, sem mudar as rotas da Louise.

Ao terminar, “Agendar com esta pré-triagem” abre a recomendação, os médicos e os horários. Em urgência, a tela oferece contato com SAMU 192 e não oferece agendamento pela recomendação. O aviso de que a pré-triagem não substitui avaliação médica permanece visível. A leitura em voz alta e os ajustes de acessibilidade são os compartilhados do aplicativo.

O modelo gratuito Ollama roda no servidor/computador do backend, nunca dentro do APK. O `.env` público do app contém somente a URL da API (`EXPO_PUBLIC_API_URL`) e `/chat` (`EXPO_PUBLIC_CHAT_PATH`). Nenhuma chave de modelo deve ser incluída em `EXPO_PUBLIC_*`.

Para rodar tudo nesta máquina, use `Iniciar-Recordar-Mobile.bat` deste repositório. Ele inicia a IA em segundo plano, a demonstração do backend e o Expo. O Ollama e o modelo precisam ter sido instalados; os caminhos portáteis ficam no `.env` privado do backend. Para outras máquinas e publicação, consulte `docs/CHATBOT-ANDREZA.md` no backend.

A prévia web não é um APK. Exportação Android/web e testes de componentes não substituem teste em aparelho físico. Na rede local, o celular usa o IP do computador da API. Para usar fora da rede sem depender desse computador, é necessário hospedar backend e IA.

Validação desta implementação: 49 testes frontend; fluxo real na prévia web com modelo local, pré-triagem salva, especialidade, horários e confirmação de consulta fictícia.
