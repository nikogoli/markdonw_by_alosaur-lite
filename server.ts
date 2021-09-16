import { Marked, Renderer, escape, unescape } from 'https://deno.land/x/markdown@v2.0.0/mod.ts';
import highlightJs from 'https://cdn.skypack.dev/highlight.js?dts';

import { App, Controller, Get, View } from "https://deno.land/x/alosaur_lite/dist/mod.js";
import { getHtmlPage } from "./html-page.ts";

// 脚注の保存場所：{1:1の部分の脚注, 2:2の部分の脚注,...}
let FOOTNOTE_STORE = new Map<string, string>()
// ツールチップとして差し替える内容の保存場所：{1:1の部分の脚注, 2:2の部分の脚注,...}
let TO_REPLACE_STORE = new Map<string, string>()
// McDoc 固有の文法としてコードブロックを処理するかどうか
let MINIBLOCK_FLAG : boolean = false


// html タグを消去しつつ文章を固定文字数に切り分ける関数
function chunk_text(text: string, num=33): string[]{
  text = text.replace(/&quot;/g, '"').replace(/<\/??\w.+?>/g, " ")
  let L: string[] = [];

  let count = 1;
  while (count*num <= text.length) {
    L.push(text.slice((count-1)*num, count*num));
    count++
  }
  if (count==1) {
    L.push(text);
  } else {
    L.push(text.slice((count-1)*num));
  }
  return L
}


// 脚注として html を作る
function make_footnote(ft_map: any) :string{
  const keys = [...ft_map.keys()].sort();
  let L :string[] = [];
  keys.forEach( idx =>{
    L.push(ft_map.get(idx));
    ft_map.delete(idx);
  })
  const ft_htmls = `
    <br>脚注
    <ol start="${Number(keys[0])}" style="color:dimgray;">
      ${L.join("\n")}
    </ol><br>
    `;
  return ft_htmls;
}


// 脚注の内容を保存する　差し替えに使うものならそれ用の場所にも保存する
function push_footnote({content, ft_idx, not_store}
    :{content: string, ft_idx: string, not_store: boolean})
    :void{
  const ft_text = `
        <li id="fn:${ft_idx}" style="padding-top:120px; margin-top:-120px;">
          <font size="1">${content}</font>
          <a href="#fnref:${ft_idx}">  ↩</a>
        </li>`;
  FOOTNOTE_STORE.set(ft_idx, ft_text);
  if (!not_store) {
    TO_REPLACE_STORE.set(ft_idx, content);
  }
  return
}


// <a href="脚注の内容">[^1]</a>になるのを修正し、脚注の内容を保存する
//  is_linked：脚注の内容が適切なものなら ture、仮のものなら false
function get_ft_ref_text({text, content, is_linked, with_parenc = false}
    : {text: string, content: string, is_linked: boolean, with_parenc?: boolean})
     :string{
  let ft_count = text.slice(1)
  // text="[^2]"などで呼ばれた場合 (=脚注が取れていない場合)
  if (with_parenc) {
    ft_count = text.slice(2, -1);
  }
  // ツールチップ表示用に文字列を適当な数で切り分け、<br>を差し込む
  const bred_content = chunk_text(content).join("<br>");
  const ref_text = `
    <sup class="tooltip" id="fnref:${ft_count}">
      <a href="#fn:${ft_count}"> (${ft_count})</a>
      <span class="tooltip-text">${bred_content}</span>
    </sup>`;
  if (is_linked) {
    // 脚注が取れている場合はその内容を保存する
    // ツールチップの差し替えは不要なので、not_store=true
    push_footnote({content: content, ft_idx: ft_count, not_store: true});
  }
  return ref_text;
}


// Override markdown-rendering-method
class MyRenderer extends Renderer{

  // 見出しの処理
  heading(text: string, level: number, raw: string): string {
    const id: string = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w]+/g, '-');

    // 前節の脚注を <h>--</h>の前に差し込む
    if (level==2 && [...FOOTNOTE_STORE.keys()].length) {
      const footnote = make_footnote(FOOTNOTE_STORE)
      return footnote + `<h${level} id="${id}">${text}</h${level}>\n`
    } else {
      return `<h${level} id="${id}">${text}</h${level}>\n`;  
    }
  }

  //コードブロックの処理
  code(code: string, lang?: string, escaped?: boolean, meta?: string): string {
    // McDoc 固有文法の部分はコードブロックとして評価され、中身は未パース
    // 　→ タブを取り除いて無理やりパースさせる
    if (MINIBLOCK_FLAG) {
      const out = Marked.parse(code.replace(/\t/g, "")).content
      MINIBLOCK_FLAG = false
      return out + "<hr></div></div><br>\n"
    }
    // 以下は本来の実装そのまま
    if (this.options.highlight) {
      const out = this.options.highlight(code, lang);
      if (out != null && out !== code) {
        escaped = true;
        code = out;
      }
    }
    const escapedCode = (escaped ? code : escape(code, true));
    if (!lang) {
      return `\n<pre><code>${escapedCode}\n</code></pre>\n`;
    }
    const className = this.options.langPrefix + escape(lang, true);
    return `\n<pre><code class="${className}">${escapedCode}\n</code></pre>\n`;
  }

  // インラインコードの処理
  codespan(text: string): string {
    let escaped = false
    const lang = "python"
    let code = text.replace(/\&quot\;/g, '"');

    //コードブロックと同じ処理を行うことで、ハイライト処理を適用させる
    if (this.options.highlight) {
      const out = this.options.highlight(code, lang);
      if (out != null && out !== code) {
        escaped = true;
        code = out;
      }
    }
    const escapedCode = (escaped ? code : escape(code, true));
    const className = this.options.langPrefix + escape(lang, true);

    return `<code class="${className}">${escapedCode}</code>`;
  }

  // リンクの処理
  link(href: string, title: string, text: string): string {
    if (this.options.sanitize) {
      let prot: string;
      try {
        prot = decodeURIComponent(unescape(href))
          .replace(/[^\w:]/g, '')
          .toLowerCase();
      } catch (e) {
        return text;
      }
      if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
        return text;
      }
    }

    // 脚注がリンクにパースされた場合、href=脚注の内容、text="^1"
    if (text.includes("^")) {
      const out = get_ft_ref_text({text:text, content:href, is_linked:true})
      return out
    } else {
      // 普通のリンク
      let out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += '>' + text + '</a>';
      return out;      
    }
  }

  // 普通の文字列の処理
  paragraph(text: string): string {
    // McDoc 固有の文法(の開始部分)
    //トグルされるミニページとして html を設定
    if (text.includes("!!!") || text.includes("???")) {
      MINIBLOCK_FLAG = true
      const [block_code, block_name, title] = [...text.replace(/\&quot\;/g, '"').matchAll(/^([!\?:]{3}\+*) (.+) "(.+)"/g)][0].slice(1)
      // タイプに応じて色を変更
      let block_color = "#d2691e"
      if (block_name=="info") {
        block_color = "#228b22";
      } else if (block_name=="note") {
        block_color = "#0000cd";
      } else if (block_name=="warning") {
        block_color = "#dc143c";
      } else if (block_name=="abstract") {
        block_color = "#ba55d3"
      }
      // 初期状態として展開しておくかどうか
      const is_open = block_code.includes("+") || block_code == "!!!";
      return `
        <div class="toggle-wrap">
          <input type="checkbox" id="${title}"${is_open? ', checked': ''}>
          <label class="toggle-button" for="${title}" style="border-color:${block_color};">
            ${title}</label>
          <div class="toggle-content">
      `;
    }
    // 脚注のパース失敗への対処：
    if (text.match(/\[\^\d+\]\:/g) !== null) {
      //　文中に [^1]: が残っている場合
      //脚注として保存 + 差し替え用のSTOREにも保存(not_store=false)
      const matched = text.match(/\[\^\d+\]\:/g)![0]
      const ft_count = matched.slice(2,-2);
      push_footnote({content:text.replace(matched, ''), ft_idx:ft_count, not_store:false})
      return ""
    } else if (text.match(/\[\^\d+\]/g) !== null) {
      //　文中に [^1] が残っている場合
      //リンク化された html を作成し、置き換える
      const matched = text.match(/\[\^\d+\]/g)![0]
      const out = get_ft_ref_text({text:matched, content:matched, is_linked:false, with_parenc:true})
      return '<p>' + text.replace(matched, out) + '</p>\n';
    }
    // 普通の文字列
    return '<p>' + text + '</p>\n';
  }
}


Marked.setOptions({
  // override した renderer の利用
  renderer: new MyRenderer,
  // highlightJs によるハイライトの設定
  highlight: function(code, lang) {
    const language = highlightJs.getLanguage(lang) ? lang : 'plaintext';
    return highlightJs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-'
})


@Controller()
export class MainController {
  @Get()
  indexPage() {
    return View("index.md", {});
  }
}

const app = new App({
  controllers: [MainController],
});

app.useViewRender({
  type: "markdown",
  basePath: `/views/`,
  getBody: async (path: string, model: Object, config: any) => {
    return await getMarkDownPage(path);
  },
});

const globalRenderCache = new Map();

async function getMarkDownPage(path: string) {
  if (globalRenderCache.has(path)) {
    return globalRenderCache.get(path);
  }
  let result = "";

  const text = await Deno.readTextFile(`${Deno.cwd()}/views/${path}`);
  const parsed = Marked.parse(text).content
  result = getHtmlPage(parsed);

  // 未処理の脚注がある場合、html 化して result に追加する
  if ([...FOOTNOTE_STORE.keys()].length) {
    const footnote = make_footnote(FOOTNOTE_STORE)
    result = result + footnote;
  }
  // 仮の内容([^1]など)のツールチップがある場合、適切な内容に差し替える
  if ([...TO_REPLACE_STORE.keys()].length) {
    TO_REPLACE_STORE.forEach((text, idx) => {
      const eped_contents = chunk_text(text)
      result = result.replace(`[^${idx}]`, eped_contents.join("<br>"))
    })
  }

  globalRenderCache.set(path, result);

  return result;
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.handleRequest(event.request));
});
