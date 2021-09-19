export function getHtmlPage(content: string, side_content: string) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Alosaur-Lite + Deno Deploy で Markdown をあれこれする</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/4.0.0/github-markdown.min.css">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/xcode.min.css">
  <style>
  body{
      box-sizing: border-box;
      min-width: 200px;
      max-width: 1100px;
      margin: 0 auto;
      padding: 45px;
      padding-left: 110px;
  }

  header {
    width: 100vw;
    padding: 10px;
    padding-left: 50px;
    background-color: #f0f8ff;
    position: absolute;
    display: flex;
    top: 0;
    left: 0;
    align-items: center;
    font-family: 'Kaisei Decol';
  }

  .container {
  display: -ms-flexbox;
  display: -webkit-box;
  display: -webkit-flex;
  display: flex;
  margin: 0 auto;
  }
  .markdown-body {
    max-width: 780px;
  }
  .sidebar {
    width: 230px;
    margin:100px 0px 0px 30px;
    font-family: 'Kaisei Decol';
  }
  .sidebar-fixed {
    position: sticky;
    top: 100px;
    font-size: 80%;
  }

  /* カーソルを重ねる要素 */
  .tooltip {
    position: relative; /* ツールチップの位置の基準に */
    cursor: pointer; /* カーソルを当てたときにポインターに */
    padding-top: 120px;
    margin-top: -120px;
  }

  /* ツールチップのテキスト */
  .tooltip-text {
    opacity: 0; /* はじめは隠しておく */
    visibility: hidden; /* はじめは隠しておく */
    position: absolute; /* 絶対配置 */
    left: 50%; /* 親に対して中央配置 */
    transform: translateX(-50%); /* 親に対して中央配置 */
    top: 150px; 
    display: inline-block;
    padding: 5px; /* 余白 */
    white-space: nowrap; /* テキストを折り返さない */
    font-size: 0.8rem; /* フォントサイズ */
    line-height: 1.3; /* 行間 */
    background: #333; /* 背景色 */
    color: #fff; /* 文字色 */
    border-radius: 3px; /* 角丸 */
    transition: 0.3s ease-in; /* アニメーション */
  }

  /* ホバー時にツールチップの非表示を解除 */
  .tooltip:hover .tooltip-text {
    opacity: 1;
    visibility: visible;
  }

  </style>
</head>
<header>
  <h3 style="margin-left:50px">Alosaur-Lite + Deno Deploy で Markdown をあれこれする</h3>
  <nav class="pc-nav">
    <ul style="list-style:none; display:flex;">
      <li style="margin: 0 0 0 15px;"><a href="#1">特に</a></li>
      <li style="margin: 0 0 0 15px;"><a href="#2">どこにも</a></li>
      <li style="margin: 0 0 0 15px;"><a href="#3">飛ばない</a></li>
    </ul>
  </nav>
</header>
<body>
  <div class="container">
    <div class="markdown-body" style="margin-top:100px;font-family:'Kosugi Maru'">
      ${content}
    </div>
    <aside class="sidebar">
      <div class="sidebar-fixed">${side_content}</div>
    </aside>
  </div>
</body>
</html>
`;
}