# Design inclusivo do Recordar

Aplicação em 17/11/2026. Preserva a paleta por perfil, os modos claro/escuro, componentes, rotas e contratos da API. A logo usa a imagem original fornecida pela equipe, preservando o desenho. O enquadramento remove as margens externas e o fundo segue o tema.

## Referências e decisões

- [Cadabra: UX for Elderly Users](https://cadabra.studio/blog/ux-for-elderly/): reduzir distrações, escrever orientações claras e manter navegação consistente. Aplicação: instrução sobre pré-triagem em linguagem cotidiana, hierarquia uniforme, ações com nomes visíveis e confirmação antes de operações destrutivas já existente.
- [W3C: Developing Websites for Older People](https://www.w3.org/WAI/older-users/developing/): texto legível, contraste, orientação e recuperação de erros. Aplicação: apoio com mínimo de 16 unidades, corpo de 18, entrelinha mínima de 1,5, rótulos permanentes, foco visível e erro com opção de tentar novamente.
- [W3C: Target Size Enhanced](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced): referência de 44 × 44 CSS px. Botões compartilhados mantêm mínimo de 56 × 56 unidades de layout e espaçamento entre ações. Unidades nativas não equivalem automaticamente a CSS px.
- [W3C: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): ampliação até 200% sem perder conteúdo ou funções. Aplicação: escala do sistema habilitada, opção Texto maior no login e perfil, cartões flexíveis e datas em linhas que se ajustam à largura; sem corte de texto nos componentes compartilhados. A opção interna amplia 25%; não representa, sozinha, o atendimento ao critério de 200%.

## Padrões preservados

As referências visuais inspiram organização e espaço livre; não são copiadas com cores novas, ícones sem legenda ou texto pequeno. Os ícones vetoriais usam react-native-svg na versão compatível com o Expo, conforme a documentação oficial: https://docs.expo.dev/versions/latest/sdk/svg/. Mantêm rótulos de texto; o desenho é decorativo para leitores de tela. Campos mantêm os formatos aceitos pela API, com exemplos de preenchimento na prévia web. No celular, permanecem os seletores nativos de data e hora. Preferências são salvas no aparelho.

## Validação e limites

Testes cobrem contraste textual nas três paletas e nos dois modos, ampliação, foco e alteração das preferências, além dos fluxos existentes. A checagem visual na prévia não substitui teste com pessoas idosas, TalkBack/VoiceOver, fonte do sistema ampliada e aparelhos reais. Não é uma certificação WCAG. Antes da entrega, validar cadastro, agendamento e cancelamento com participantes idosos, observando erros, entendimento e autonomia sem presumir familiaridade com tecnologia.


## Leitura em voz alta e perfil

O componente Page oferece Ler em voz alta e Parar leitura no início de todas as telas: login, cadastro, recuperação de senha, início de cada perfil, agendamento em todas as etapas, medicamentos, agenda do dia, histórico, chatbot, atendimento, pacientes e cadastros administrativos. A confirmação de ações tem leitura própria. A leitura usa o conteúdo montado da tela, atualizado no momento do toque, e os valores dos campos não sigilosos. Senhas não são lidas. Textos extensos são divididos em trechos; a voz é interrompida ao mudar de tela, de etapa ou ao colocar o aplicativo em segundo plano. Não inicia automaticamente. Depende de voz e áudio disponíveis no dispositivo; uma falha é apresentada em texto.

O perfil tem cabeçalho com foto e nome completo, idade calculada pela API a partir do nascimento e seções de dados pessoais, saúde, segurança e aparência. A foto é escolhida na galeria e preparada como JPEG de 400 × 400; o backend aceita até 200 KB e permite remover com foto_perfil: null em PUT /api/users/me. A foto não é retornada nas listagens públicas. Para usar a foto com outro ambiente, atualizar também o backend. O usuário escolhe e envia a imagem apenas ao acionar o botão.

Validação adicional: testes de conteúdo dinâmico da leitura, exclusão de senhas, cancelamento e erros de voz; testes HTTP de salvamento, leitura, isolamento por conta, limite e remoção da foto. Na prévia web, foram exercitados leitura/parada e seleção, nova entrada e remoção de imagem de teste. Continuam necessários testes de áudio e navegação com TalkBack/VoiceOver e pessoas idosas nos aparelhos finais.

## Acabamento visual e acesso da equipe

Barra com ícones e nomes centralizados verticalmente, controles de voz em cores invertidas, botões arredondados, check mais estreito em selo verde e gradiente diagonal suave, renderizado com SVG nos ambientes nativo e web. O painel de login tem sombra discreta. A logo original é preservada; a tipografia e as superfícies ao redor seguem a paleta do perfil e o tema atual.

O login abre no acesso de paciente. Médico e administrador ficam dentro de Área de profissionais e administração. Fechar essa área restaura o tipo paciente. Não há restrição por idade: a separação evita confusão de navegação. A autorização real continua no backend, que consulta o papel salvo da conta e exige administrador nas rotas administrativas. Testes verificam rejeição de login de paciente como administrador, alteração do campo tipo do token, acesso administrativo com conta paciente e cadastro público de administrador.

Acabamento final: cabeçalho do login sem bloco de cor forte, formulário sem caixas aninhadas de acesso, sombra reduzida e gradiente com menor opacidade. Os controles de voz mantêm contraste alto.

## Revisão final da interface

A logo fornecida em SVG tem o símbolo centralizado a partir dos limites reais dos pixels roxos, sem considerar o fundo do ícone. Os caminhos não são redesenhados. O gerador produz uma variante centrada e o ícone da aplicação a partir da mesma fonte.

O fundo do modo escuro é sólido. Bordas e campos têm contraste reforçado. Todas as telas baseadas em Page mantêm leitura de voz, parada e um botão Acessibilidade que permite abrir os ajustes de texto e tema no mesmo lugar. Sem foto, o perfil de paciente apresenta um avatar minimalista e neutro de pessoa idosa.

A saudação mostra o nome completo registrado e acompanha alterações salvas no perfil. A demonstração possui dados fictícios registrados no backend. O compilado tem 16 capturas, em claro e escuro, na pasta outputs/galeria-ui-recordar da área de trabalho. Capturas web não substituem validação em aparelho físico com TalkBack/VoiceOver e pessoas idosas.

Atualização de acessibilidade: há somente uma entrada Acessibilidade em cada tela. A leitura de voz, a parada, o texto maior e os modos claro/escuro ficam no painel aberto por esse botão. Foram retirados os controles repetidos do login e do perfil. Fechar o painel interrompe a leitura em andamento.
