export function getHtmlPage(content: string) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Alosaur lite + markdown</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/4.0.0/github-markdown.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/xcode.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/highlight.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@500&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap" rel="stylesheet">
  <style>
  body{
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
  }

  header {
    width: 100vw;
    padding: 10px;
    padding-left: 50px;
    background-color: #f0f8ff;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    font-family: 'Kaisei Decol';
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

  .toggle-wrap .toggle-button {
  display: block;
  cursor: pointer;
  padding: 3px 10px;
  background-color: #fff;
  border: 1px solid #ddd;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1em;
  border-radius: 8px;
  }

  .toggle-wrap .toggle-button:hover {
  border-color: #999;
  background: #f5f5f5;
  }

  .toggle-wrap .toggle-button:after {
  content: " ▶"; /* 閉じている状態のときにラベルの後ろに続く文字 */
  }

  /*チェックは見えなくする*/
  .toggle-wrap .toggle-content,
  .toggle-wrap > input[type="checkbox"] {
  display: none;
  }

  .toggle-wrap > input[type="checkbox"]:checked ~ .toggle-button:after {
  content: " ▼"; /* 開いている状態のときにラベルの後ろに続く文字 */
  }

  /*クリックで中身表示*/
  .toggle-wrap > input[type="checkbox"]:checked ~ .toggle-content {
  display: block;
  height: auto;
  opacity: 1;
  padding: 10px 0;
  }
  </style>
</head>
<body>
  <header>
    <h3>Alosaur-lite + markdown</h3>
    <nav class="pc-nav">
      <ul style="list-style:none; display:flex;">
        <li style="margin: 0 0 0 15px;"><a href="#1">特に</a></li>
        <li style="margin: 0 0 0 15px;"><a href="#2">どこにも</a></li>
        <li style="margin: 0 0 0 15px;"><a href="#3">飛ばない</a></li>
      </ul>
    </nav>
  </header>
  <div class="markdown-body" style="margin-top:100px;font-family:'Kosugi Maru'">
    ${content}
  </div>
</body>
</html>
`;
}
