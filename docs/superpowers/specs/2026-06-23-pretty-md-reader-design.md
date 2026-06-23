# Pretty MD Reader — 設計文件

- 日期：2026-06-23
- 狀態：設計完成，待實作

## 目標

做一個 VS Code extension，**提升內建 Markdown 預覽的閱讀美感**。重點是「順眼」——讓 AI agent 產生的文件（superpowers 的 plan/spec、repo README）讀起來舒服。不重寫預覽引擎、不加設定面板。

## 使用情境

- 使用者：發佈到 VS Code Marketplace，給一般使用者安裝。
- 主要內容：superpowers skill 產生的 plan/spec 文件、GitHub repo 的 README。
- 這類文件特徵：大量標題階層、巢狀清單、**任務清單核取方塊 `- [ ]`**、程式碼區塊、表格、**Graphviz `dot` 流程圖**（superpowers plan）、**mermaid 圖**（README）、Obsidian/GitHub 風格 callout `> [!note]`。

## 架構（路線：擴充內建預覽）

不自建 webview。透過 VS Code 的 markdown 擴充點，把樣式與功能「注入」內建預覽，免費繼承捲動同步、開啟預覽指令、預覽內搜尋。

```
pretty-md-reader/
├── package.json              # extension 宣告 + contributes 擴充點 + Marketplace metadata
├── src/
│   ├── extension.ts          # 進入點：extendMarkdownIt 註冊 plugins
│   └── markdown-it/
│       ├── callouts.ts       # 解析 > [!note] → callout HTML
│       ├── mermaid.ts        # ```mermaid → <pre class="mermaid">
│       └── graphviz.ts       # ```dot / ```graphviz → <pre class="graphviz">
├── media/
│   ├── preview.css           # ★ 外觀主體（Obsidian 風、淺色）
│   └── diagram-init.js       # 前端：載入並渲染 mermaid + graphviz
├── icon.png                  # Marketplace icon
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .vscodeignore
└── 建置/測試設定
```

### contributes 擴充點（package.json）
- `markdown.previewStyles` → `media/preview.css`
- `markdown.previewScripts` → `media/diagram-init.js`
- `markdown.markdownItPlugins` → `true`（啟用 `extendMarkdownIt`）

### 運作流程
1. 使用者開 markdown，按內建「開啟預覽」。
2. VS Code 載入 `preview.css` + `diagram-init.js`。
3. 解析時呼叫註冊的 markdown-it plugins，產生 callout / 圖表的目標 HTML。
4. 前端 `diagram-init.js` 掃描頁面，渲染 mermaid 與 graphviz 圖。

`extension.ts` 幾乎沒邏輯；工作量集中在 `preview.css`（美感）與三個小 plugin。

## 外觀規格（Obsidian 風、僅淺色）

- **整體**：現代、圓潤、留白適中、長時間閱讀舒適。**只做淺色**，不跟隨 VS Code 主題切換。
- **字體**：無襯線。Latin 用 `Inter` → 系統字 fallback；中文用跨平台 fallback 串（`PingFang TC`, `Microsoft JhengHei`, `Noto Sans CJK TC`, sans-serif）。等寬用 `JetBrains Mono` → `SF Mono` → `Consolas` → monospace。**不綁定單一平台字體**（Marketplace 跨平台）。
- **內文**：行距約 1.75，字級約 15.5–16px。
- **標題**：紫色強調、字重稍重、字距微縮。
- **程式碼區塊**：深色底 + 語法高亮（沿用內建 highlight 的 class，CSS 重新調色），圓角。
- **行內 code**：淡紫底、紫字。
- **表格**：表頭淺紫底、偶數列淺底、圓角、無重框線。
- **任務清單**：`- [ ]` / `- [x]` 核取方塊樣式化（圓角方框、勾選態），巢狀清單縮排清楚。
- **blockquote / 連結**：與整體紫色強調一致。

## markdown-it plugins

### callouts.ts
- 解析 Obsidian / GitHub 風 callout：`> [!note]`、`[!tip]`、`[!warning]`、`[!important]`、`[!caution]` 等。
- 輸出：色塊 + 左色條 + 圖示 + 類型標題的 HTML。
- **優先採用現成可靠的 plugin 套件**，不重造輪子；CSS 在 `preview.css` 中統一控管配色。

### mermaid.ts
- 把 ` ```mermaid ` fenced block 轉成 `<pre class="mermaid">…</pre>`，原始碼保留為文字。
- 實際渲染在前端 `diagram-init.js`。

### graphviz.ts
- 把 ` ```dot ` 與 ` ```graphviz ` fenced block 轉成 `<pre class="graphviz">…</pre>`。
- 前端用 `@hpcc-js/wasm`（Graphviz WASM）渲染成 SVG。

### diagram-init.js（前端）
- 載入 mermaid，對 `.mermaid` 元素渲染。
- 載入 Graphviz WASM，對 `.graphviz` 元素渲染成 SVG。
- 兩者皆採淺色配色，與整體外觀一致。
- 渲染失敗時，保留原始程式碼文字並顯示簡短錯誤，不讓整頁壞掉。

## 建置與測試

- **語言/打包**：TypeScript + `esbuild`（VS Code extension 標準）。
- **單元測試**：
  - `callouts.ts`：餵 markdown 字串 → 斷言輸出 HTML（各 callout 類型、無 callout 時不誤判）。
  - `mermaid.ts` / `graphviz.ts`：斷言 fenced block 正確轉成對應 `<pre class>`，其它語言的 code block 不受影響。
- **手動目視驗收**：提供一份「樣張 markdown」（涵蓋標題、巢狀清單、任務清單、表格、程式碼、五種 callout、mermaid 圖、dot 圖、中文長段落），在預覽中目視確認符合本規格。

### 驗收標準
1. 開啟樣張預覽，外觀符合 Obsidian 風淺色規格（字體、配色、表格、任務清單）。
2. 五種 callout 類型正確渲染成色塊。
3. mermaid 圖與 graphviz dot 圖皆能出圖；失敗時優雅降級為程式碼文字。
4. 中文內文排版舒適（字體 fallback 在非 macOS 也合理）。
5. `vsce package` 能成功打包，含 icon / README / CHANGELOG / LICENSE。

## 範圍外（YAGNI）

- 不做設定面板 / 偏好選項。
- 不做匯出（PDF/HTML）。
- 不做數學公式（KaTeX）。
- 不做深色模式與多主題切換。
- 不自建 webview。

## Marketplace 發佈需求

- `package.json`：`publisher`、`displayName`、`description`、`categories`、`keywords`、`engines.vscode`、`repository`。
- `icon.png`、`README.md`（含截圖）、`CHANGELOG.md`、`LICENSE`、`.vscodeignore`。
- semver 版本管理；`vsce` 打包與發佈。
