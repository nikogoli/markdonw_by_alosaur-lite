## Markdown to Web page by Alosaur-lite with Deno Deploy
Alosaur-lite with Deno Deploy で markdown を webページにしようという話<br>
とりあえず、McDoc につかった markdown を流用している

### 内容物
- server.ts：もろもろの処理
- html-page.ts：HTML
- views/index.md：markdown ファイル<br>

　　　↓
[結果 (deno deploy)](https://dash.deno.com/projects/strong-spider-60)
<br>

### 使ってるもの
- [alosaur-lite](https://github.com/alosaur/alosaur-lite)
- [markdown](https://deno.land/x/markdown@v2.0.0)：パーサー