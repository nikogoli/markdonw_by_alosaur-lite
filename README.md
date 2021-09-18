## Markdown to Web page by Alosaur-lite with Deno Deploy
Alosaur-lite with Deno Deploy で markdown を webページにしようという話<br>

今のところ、[zenn のスクラップ](https://zenn.dev/nikogoli/scraps/6dd7ae9ea6ad4f)の markdown を使っている

### 内容物
- server.ts：もろもろの処理
- html-page.ts：HTML
- views/scrap.md：markdown ファイル
    <br>
　　　↓<br>
[結果 (deno deploy)](https://dead-donkey-18.deno.dev/)
<br>

### 使ってるもの
- [alosaur-lite](https://github.com/alosaur/alosaur-lite)
- [markdown](https://deno.land/x/markdown@v2.0.0)：パーサー