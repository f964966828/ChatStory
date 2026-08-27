# ChatStory

Turn chat exports into stories you can look at: who talks more, when you usually chat, which days were busy, and which words belong to the two of you.

聊天紀錄只在瀏覽器裡分析，不會上傳到伺服器。

Demo: [https://f964966828.github.io/ChatStory/](https://f964966828.github.io/ChatStory/)

## Features

- Import **LINE** (`.txt`) and **Meta** Messenger / Instagram / Threads (`.json`)
- Dashboard: totals, pie chart, timeline, heatmap, busy hours, initiative, word clouds
- Anonymous mode and image sharing
- Chinese / English UI

## Privacy

Chat files stay on your device. Parsing and charts run in the browser. This is not an official LINE or Meta product.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
```

Static export goes to `out/`. GitHub Pages deploys from `main` via `.github/workflows/pages.yml`.

Requires Node.js 22.

## Contributing

Please open issues and pull requests against `main`. Do not commit real chat exports.

## License

[MIT](LICENSE)
