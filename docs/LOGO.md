# Logo do aplicativo

A logo ativa é o arquivo recordar-logo.svg fornecido pelo usuário. Foi copiada para assets/recordar-logo.svg, preservando os caminhos e as cores. BrandLogo usa react-native-svg para renderizar o próprio SVG, sem redesenhar. Apenas a margem transparente externa é enquadrada na tela. Cada instância usa identificadores próprios nos gradientes. A sombra permanece suave e exclusiva do modo escuro.

O script scripts/build-brand-icon.cjs gera assets/recordar-logo-source.js para o mobile e assets/recordar-icon.png para o ícone nativo e favicon, usando a mesma fonte vetorial. Execute node scripts/build-brand-icon.cjs após substituir o SVG. O conversor @resvg/resvg-js é uma dependência de desenvolvimento.

As imagens PNG e variantes de estudos anteriores permanecem guardadas, mas não são usadas pela marca nas telas.
