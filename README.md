# sonar

Player de música local com estética de terminal — roda direto no navegador, com botões clicáveis, temas de cor e capa exibida em ASCII.

## Recursos

- **Visual de terminal**: fonte monospace, bordas com caracteres box-drawing (`┌─┐│└┘`), efeito de scanlines/CRT, glow no tema ativo
- **Importar músicas**: arquivos avulsos ou pastas inteiras (com subpastas)
- **5 temas de cor**: red, blue, yellow, green (CRT clássico) e purple
- **Biblioteca persistente**: as músicas ficam salvas no IndexedDB e recarregam ao abrir de novo
- **Capa em ASCII**: se o arquivo tiver capa embutida (ID3 APIC / FLAC / MP4), ela é renderizada como arte ASCII na cor do tema
- **Visualizador de barras** em tempo real (Web Audio API)
- **Controles completos**: play/pause, anterior/próxima, seek, volume

## Como rodar

Basta abrir o `index.html` no navegador. Recomenda-se servir via HTTP local (evita restrições de `file://` em alguns navegadores):

```bash
# com Python
python3 -m http.server 8080

# ou com o script
./start.sh
```

Depois abra <http://localhost:8080>.

## Atalhos de teclado

| Tecla     | Ação              |
|-----------|-------------------|
| `Espaço`  | play / pause      |
| `←` / `→` | −10s / +10s       |
| `↑` / `↓` | volume            |
| `N`       | próxima faixa     |
| `P`       | faixa anterior    |

## Formatos suportados

mp3, ogg, wav, flac, m4a, aac, opus e outros que o navegador suportar. Capas são lidas de MP3 (ID3), FLAC e MP4.

## Estrutura

```
index.html            layout principal
css/base.css          layout, botões, CRT, sliders
css/themes.css        5 temas via CSS variables
js/app.js             bootstrap e wiring
js/db.js              IndexedDB (com fallback em memória)
js/importer.js        import de arquivos/pastas + extração de capa
js/player.js          motor de reprodução
js/playlist.js        render da playlist
js/cover-ascii.js     capa → arte ASCII
js/visualizer.js      equalizador em canvas
js/themes.js          troca e persistência de tema
vendor/               jsmediatags (leitura de tags)
```
