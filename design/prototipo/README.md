# Protótipo da home

Um arquivo só, sem build. Serve pra bater o olho e aprovar a direção. É descartável: o site de verdade sai na F07, na stack da F02.

## Abrir

Abra `index.html` direto no navegador, ou sirva a pasta:

```sh
python3 -m http.server 8741 --directory design/prototipo
# http://127.0.0.1:8741/
```

Precisa de internet pras fontes (Google Fonts). Sem elas, cai numa fonte do sistema.

## O que testar

- Tudo em 360px de largura e em desktop.
- **Ouvir** em cada bloco (voz do navegador, pt-BR).
- **A+** no topo.
- Degraus do hero, cartões de módulo e o botão de módulo em "Como funciona": abrem o detalhe. `#m1` a `#m9` no endereço abre direto.
- "Ajuda solta" e "Caminho inteiro" no bloco do problema.
- Setas do teclado na trilha de "Como funciona".
- Transparência: "Agora" mostra o zero honesto; "Ver um exemplo" liga a demonstração ao vivo, com dados inventados. Clique em "Comprovante".
- Filtro "Funcionando" nos módulos: estado vazio.

## Trocar o nome

`const PROJECT_NAME` no começo do `<script>`. Troca a marca, o título da aba, o rodapé e o texto falado.

## Prints

Em [`prints/`](prints/): topo e página inteira em 360px e 1440px, o detalhe de um módulo no celular, o painel em modo exemplo e o comprovante.
