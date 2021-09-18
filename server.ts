import { Marked, Renderer, escape } from 'https://deno.land/x/markdown@v2.0.0/mod.ts';
import highlightJs from 'https://cdn.skypack.dev/highlight.js?dts';

import { App, Controller, Get, View } from "https://deno.land/x/alosaur_lite/dist/mod.js";
import { getHtmlPage } from "./html-page.ts";


const ADD_LINE_NUM = true
let HEADER_STORE: string[] = []


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
  let result = null;

  const text = await Deno.readTextFile(`${Deno.cwd()}/views/${path}`);
  const parsed = Marked.parse(text).content
  const side_texts = HEADER_STORE.join("<br><br>")
  HEADER_STORE = []

  result = getHtmlPage(parsed, side_texts);

  globalRenderCache.set(path, result);

  return result;
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(app.handleRequest(event.request));
});