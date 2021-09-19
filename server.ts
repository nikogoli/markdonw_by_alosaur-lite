import { Marked, Renderer, escape } from 'https://deno.land/x/markdown@v2.0.0/mod.ts';
import highlightJs from 'https://cdn.skypack.dev/highlight.js?dts';

import { App, Controller, Get, View } from "https://deno.land/x/alosaur_lite/dist/mod.js";
import { getHtmlPage } from "./html-page.ts";


interface FtnoteInfo {
  index : number;
  text : string;
  is_tip_set : boolean;
}


const SCRAP_SEPARATION = "END_OF_SCRAP";
const ADD_LINE_NUM = true;
let INPAGE_FT_COUNT = 0;
let HEADER_STORE: string[] = [];
let FOOTNOTE_STORE = new Map<number, FtnoteInfo>();
let TOOLTIP_STORE= new Map<string, string>();

// -----------------------------

function addLineNumbers (inputHtml: string, use_singleLine=false, startFrom=1): string{
  var lines = inputHtml.split(/\r\n|\r|\n/g)

  if (lines[lines.length-1].trim() === '') {
      lines.pop();
  }

  if (lines.length > 1 || use_singleLine) {
    var html = '';

    lines.forEach((li, idx) => {
      let diff_prefix = "";
      let bc_color = "#f6f8fa";
      if (li.length) {
        if (li[0]=="-") {
          diff_prefix = " -";
          li = li.replace(/^-/g, "");
          bc_color = "#ffe6e6";
        } else if (li[0]=="+") {
          diff_prefix =" +";
          li = li.replace(/^\+/g, "");
          bc_color = "#c8f5d0";
        }
      }
      const num_text = `${idx + startFrom}${diff_prefix}`;
      html += `<tr style="border-top:0px; background-color:${bc_color}">`
        + `<td style="border:0px; border-right:1px solid #b9b9b9; padding:0px 7px 0px 0px" data-line-number="${idx + startFrom}">${num_text}</td>`
        + `<td style="border:0px;padding:0px 0px 0px 7px" data-line-number="${idx + startFrom}"> ${li.length > 0 ? li : ' '}</td></tr>`;
    })
  return `<table style="margin:0px;">${html}</table>`;
  }

  return inputHtml;
}


// html タグを消去しつつ文章を固定文字数に切り分ける関数
function chunk_text(text: string, num=33): string[]{
  text = text.replace(/&quot;/g, '"').replace(/<\/??\w.+?>/g, " ")
  let L: string[] = [];

  let count = 1;
  if (count*num > text.length) {
    return [text]
  }
  while (count*num <= text.length) {
    L.push(text.slice((count-1)*num, count*num));
    count++
  }
  L.push(text.slice((count-1)*num));
  return L
}


function get_refnumber_html (ft_count: number, content: string): string{
  let style_setting = ""
  if (content.length > 30) {
    style_setting = ' style="min_width=450px; white-space: break-spaces;"'
  }
  const ref_text = `
    <sup class="tooltip" id="fn_ref:${ft_count}">
      <a href="#fn:${ft_count}">(${ft_count})</a>
      <span class="tooltip-text"${style_setting}>${content}</span>
    </sup>`;
  return ref_text
}


function make_footnote(): string{
  const keys = [...FOOTNOTE_STORE.keys()].sort()
  const start_num = keys[0];
  const L = keys.map((idx:number) =>{
    const ft_info = FOOTNOTE_STORE.get(idx)
    if (ft_info !== undefined){
      const ft_text = `
        <li id="fn:${ft_info.index}" style="padding-top:120px; margin-top:-120px;">
          <font size="1">${ft_info.text}</font>
          <a href="#fn_ref:${ft_info.index}">  ↩</a>
        </li>`;
      if (!ft_info.is_tip_set) {
        TOOLTIP_STORE.set(`TEMP_TOOLTIP_${idx}`,ft_info.text);
      }
      return ft_text;
    } else {
      return ""
    }
  })
  INPAGE_FT_COUNT = INPAGE_FT_COUNT + Math.max(...keys);
  FOOTNOTE_STORE = new Map<number, FtnoteInfo>();
  if (L.length) {
    const ft_htmls = `
      <div style="border-bottom:1px solid #b9b9b9;font-size:90%">脚注</div>
      <ol start="${start_num}" style="color:dimgray;">
        ${L.join("\n")}
      </ol><br>
      `;
    return ft_htmls;
  } else {
    return ""
  }
}


// -----------------------------

class MyRenderer extends Renderer{

  code(code: string, lang?: string, escaped?: boolean, meta?: string): string {
    const [c, l, e] = [...arguments]
    const code_out = super.code(c, l, e);
    return code_out.replace(/\n<\/code>/, "</code>");
  }

  // インラインコードの処理
  codespan(text: string): string {
    const lang = "python";

    //コードブロックと同じ処理を行うことで、ハイライト処理を適用させる
    const code_out = super.code(text.replace(/\&quot\;/g, '"'), lang)
    const matched = code_out.match(/<pre>([\S\s]+)<\/pre>/)
    if (matched !== null) {
      return matched[1].replace(/\n<\/code>/, "</code>");  
    } else {
      return code_out
    }
  }

  heading(text: string, level: number, raw: string): string {
    const id: string = this.options.headerPrefix + String(text).trim().toLowerCase().replace(/\s+/g, '-');
    if (level==1) {
      HEADER_STORE.push(`<a href="#${id}">${text}</a>`);
    }
    return `<h${level} id="${id}">${text}</h${level}>\n`;
  }
  
  listitem(text: string): string {
    if (text.match(/[\^\d+]/g)) {
      //console.log(text);
    }
    return '<li>' + text + '</li>\n';
  }

  link(href: string, title: string, text: string): string {
    if (text.match(/\^(\d+)/) !== null) {
      let footnote_count = Number(text.match(/\^(\d+)/)![1]) + INPAGE_FT_COUNT
      /*if (FOOTNOTE_STORE.has(footnote_count)) {
        footnote_count = Math.max(...FOOTNOTE_STORE.keys()) +1
      }*/
      const ft_info: FtnoteInfo = {
        index: footnote_count,
        text: href,
        is_tip_set: true
      }
      FOOTNOTE_STORE.set(footnote_count, ft_info)
      return get_refnumber_html(footnote_count, href)
    }
    return super.link(href, title, text)
  }

  paragraph(text: string): string {
    // 注釈内容の html の追加
    if (text.includes(SCRAP_SEPARATION)) {
      let ft_html = ""
      if ([...FOOTNOTE_STORE.keys()].length) {
        ft_html = make_footnote()
      }
      return `${ft_html}<hr><hr>\n`
    }
    
    if ([...text.matchAll(/^\[\^(\d+)\]:/g)].length) {
      const text_lis =  text.split(/\n/g);
      text_lis.forEach((tx:string) => {
        const [num, ref_text] = [...tx.matchAll(/^\[\^(\d+)\]: ([\s\S]+)/g)][0].slice(1);
        const footnote_count = Number(num) + INPAGE_FT_COUNT;
        if (FOOTNOTE_STORE.has(footnote_count)) {
          FOOTNOTE_STORE.get(footnote_count)!.text = ref_text
        }  
      })
      return ""
    }

    if ([...text.matchAll(/\[\^(\d+)\]/g)].length) {
      [...text.matchAll(/\[\^(\d+)\]/g)].forEach( (matched: string[]) => {
          const footnote_count = Number(matched[1]) + INPAGE_FT_COUNT;
          const ft_info: FtnoteInfo = {
            index: footnote_count,
            text: `TEMP_TOOLTIP_${footnote_count}`,
            is_tip_set: false
          };
          FOOTNOTE_STORE.set(footnote_count, ft_info);
          const new_html = get_refnumber_html(footnote_count, `TEMP_TOOLTIP_${footnote_count}`);
          text = text.replace(matched[0], new_html);
      })
      return `<p>${text}</p>\n`
    }
    return super.paragraph(text);
  }
}


// -----------------------------

Marked.setOptions({
  renderer: new MyRenderer,
  highlight: function(code, lang) {
    const language = highlightJs.getLanguage(lang) ? lang : 'plaintext';
    const out = highlightJs.highlight(code, { language }).value;
    return ADD_LINE_NUM? addLineNumbers(out) : out
  },
})
// -----------------------------


@Controller()
export class MainController {
  @Get()
  indexPage() {
    return View("scrap.md", {});
  }
}


const app = new App({
  controllers: [MainController],
});

app.useViewRender({
  type: "markdown",
  basePath: `/views/`,
  getBody: async (path: string, model: Object, config: any) => {
    return await getMarkDownPage(path, config);
  },
});

const globalRenderCache = new Map();

async function getMarkDownPage(path: string, config: any) {
  if (globalRenderCache.has(path)) {
    return globalRenderCache.get(path);
  }
  let matchedt = null;

  const text = await Deno.readTextFile(`${Deno.cwd()}/views/${path}`);
  let parsed = Marked.parse(text).content;
  if ([...TOOLTIP_STORE.keys()].length) {
    TOOLTIP_STORE.forEach((tooltip_text: string, target_txt: string) => {
      if (tooltip_text.length > 30) {
        const syle_setting = ' style="min-width:450px; white-space: break-spaces;"';
        parsed = parsed.replace(`>${target_txt}`, `${syle_setting}}>${tooltip_text}`);
      } else {
        parsed = parsed.replace(target_txt, tooltip_text);
      }
    })
  }
  TOOLTIP_STORE = new Map<string, string>()
  const side_texts = HEADER_STORE.join("<br><br>");
  HEADER_STORE = [];

  matchedt = getHtmlPage(parsed, side_texts);

  globalRenderCache.set(path, matchedt);

  return matchedt;
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.handleRequest(event.request));
});