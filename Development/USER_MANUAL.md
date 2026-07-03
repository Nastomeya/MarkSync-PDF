# MarkSync PDF — User Manual 🚀

Welcome to **MarkSync PDF**, a premium Windows desktop application designed to convert Markdown documents into professional, print-ready PDF files. This manual provides an overview of the application's features, a guide on how to use it, and a syntax cheat sheet for advanced features.

---

## 1. Key Features

* **Sleek Side-by-Side Interface:** A modern, distraction-free split screen showing your raw Markdown code on the left and a live, beautifully rendered preview on the right.
* **Dynamic Typography Controls:** Instantly adjust **Font Size**, **Line Spacing**, and **Paragraph Gaps** using sliders in the toolbar. Changes apply immediately to the preview and carry over to your exported PDF.
* **Drag-and-Drop File Import:** Drag any `.md` or `.txt` file from your computer and drop it anywhere on the app window to import its contents instantly.
* **Advanced Markdown Support:**
  * **Code Blocks:** Syntax highlighting for major programming languages (via *highlight.js*).
  * **Math Equations:** Full support for LaTeX block equations (`$$...$$`) and inline math (`$...$`) (via *KaTeX*).
  * **Mermaid Diagrams:** Write diagram scripts (flowcharts, sequence diagrams, state diagrams) directly in code blocks and see them render as graphics.
  * **Tables:** Beautifully aligned columns and headers.
  * **Task Checklists:** Interactive checkboxes (`[x]` and `[ ]`).
* **Clean PDF Exporting:** Hides the editor interface, sliders, and buttons during conversion so only your structured document appears in the final PDF.
* **Smart Page Breaks:** Automatically prevents headings, code blocks, tables, and diagrams from breaking awkwardly across page seams.

---

## 2. Getting Started & How to Use

### Writing and Importing Content
1. **Type directly** in the left editor panel. The preview on the right updates instantly.
2. **Drag & Drop:** Find any `.md` or `.txt` file on your PC, drag it over the application window, and drop it. The editor will load its content.

### Adjusting the Layout
Use the **Format Preview & PDF** toolbar at the top to customize the layout:
* **Font Size Slider:** Adjust text sizing between `12px` and `28px`.
* **Line Spacing Slider:** Fine-tune spacing between lines from tight (`1.2`) to wide (`3.0`).
* **Paragraph Gap Slider:** Increase or decrease spacing between paragraphs, lists, tables, and code blocks from `4px` to `40px`.

### Exporting to PDF
1. Click the **Preview & Export** button in the top-right corner.
2. The application will render a print-ready PDF and display it in a native overlay window so you can review it before saving.
3. If it looks correct, click **Save to PC**, choose a filename and location, and click **Save**.
4. Click **Close Preview** to return to the editor.

---

## 3. Markdown Syntax Cheat Sheet

Here are examples of standard and advanced Markdown syntax you can use in **MarkSync PDF**:

### Standard Formatting
```markdown
# Header 1
## Header 2
### Header 3

This is standard paragraph text. You can make it **bold**, *italicized*, or ~~struck-through~~.

> This is a blockquote for callouts or quotes.
```

### Lists and Checklists
```markdown
* Bullet item A
* Bullet item B
  * Indented item

1. Numbered item 1
2. Numbered item 2

- [x] Completed task item
- [ ] Uncompleted task item
```

### Tables
```markdown
| Feature | Supported | Technology |
| :--- | :---: | :--- |
| Live Preview | Yes | Electron |
| Math Equations | Yes | KaTeX |
| Diagrams | Yes | Mermaid |
```

### LaTeX Math Equations
Write inline math using single dollar signs, or block equations using double dollar signs:

```markdown
Here is an inline equation: $E = mc^2$

And a block math equation:
$$
\int_{a}^{b} x^2 \, dx = \left[ \frac{x^3}{3} \right]_{a}^{b}
$$
```

### Mermaid Diagrams
Render diagrams by wrapping your scripts in a code block labeled `mermaid`:

```markdown
\`\`\`mermaid
graph TD
    Start["Start Application"] --> Import["Import Markdown File"]
    Import --> Sliders["Adjust Spacing Sliders"]
    Sliders --> Export["Preview & Export PDF"]
    Export --> Save["Save PDF to PC"]
    
    style Start fill:#3b82f6,stroke:#1d4ed8,color:#fff
    style Save fill:#10b981,stroke:#047857,color:#fff
\`\`\`
```

---

## 4. Troubleshooting & Best Practices

* **Mermaid Syntax Errors:** If a diagram isn't rendering, check that your Mermaid syntax is correct. The preview pane will display a detailed syntax error report if there is a parsing issue.
* **Page Layout Tweaks:** If a heading or table is positioned awkwardly near page breaks, adjust the **Paragraph Gap** slider in the toolbar. A slight adjustment often moves elements onto the next page perfectly.
* **Large Files:** For extremely long documents (100+ pages), PDF generation may take a few seconds. A loading text will show on the button to indicate progress.
