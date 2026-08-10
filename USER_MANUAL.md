# MarkSync PDF — User Manual & Reference Guide 🚀

Welcome to **MarkSync PDF**, a modern desktop studio designed to convert Markdown documents into publication-ready, professional PDF files. MarkSync PDF combines a live split-view editor with dynamic typography sliders, KaTeX mathematical typesetting, Mermaid diagram generation, GitHub-style callouts, and pixel-perfect Chromium PDF export.

---

## 1. Key Features & Capabilities

* **Real-Time Split-Pane Workspace:** Distraction-free editing on the left with instant, synchronized rendering on the right.
* **Dynamic Typography Controls:** Real-time toolbar sliders for **Font Size**, **Title Size**, **Line Spacing**, and **Paragraph Gaps** with immediate preview feedback and PDF carry-over.
* **Table Border Customization:** Easily toggle between bordered and clean borderless table layouts.
* **Drag-and-Drop File Import:** Drop any `.md` or `.txt` file onto the window to open its contents instantly.
* **Advanced Markdown Formatting:**
  * **Code Blocks:** Multi-language syntax highlighting powered by *highlight.js*.
  * **LaTeX Mathematics:** High-speed inline (`$...$`) and block (`$$...$$`) math equations powered by *KaTeX*.
  * **Mermaid Diagrams:** Vector-rendered flowcharts, sequence diagrams, state charts, and class diagrams.
  * **GitHub-Style Alerts:** Distinct callout boxes (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`).
  * **Task Checklists:** Interactive task checkboxes (`[x]` and `[ ]`).
* **Standalone Print-Ready PDF:** Hides editor controls, generates crisp vector graphics, and preserves styling in standalone PDF output.
* **Smart Page Breaks:** Automatically prevents headers, code blocks, tables, and diagrams from breaking awkwardly across page seams.

---

## 2. Getting Started & How to Use

### Writing and Importing Content
1. **Type directly** into the left editor pane. The preview pane on the right updates instantaneously.
2. **Drag & Drop:** Drag any `.md` or `.txt` file from Windows Explorer and drop it anywhere over the application window to load it.
3. **Auto-Save:** Your current document is automatically preserved locally across application sessions.

### Adjusting Layout with Dynamic Sliders
Use the **Format Preview & PDF** toolbar at the top of the window to fine-tune your document layout:
* **Font Size Slider (`12px` – `28px`):** Scales the base body text size.
* **Title Size Slider (`1.2em` – `3.5em`):** Adjusts heading scale proportionally from `H1` down to `H4`.
* **Line Spacing Slider (`1.2` – `3.0`):** Fine-tunes line height for compact or airy reading.
* **Paragraph Gap Slider (`4px` – `40px`):** Modulates vertical breathing room between paragraphs, tables, quotes, and code blocks.
* **Hide Table Borders:** Check this box for minimalist, borderless tables.

### Previewing and Exporting to PDF
1. Click the **Preview & Export** button in the top-right corner.
2. A high-resolution PDF will be rendered and shown in the native preview overlay modal.
3. If everything looks balanced, click **Save to PC** to choose your save location.
4. Click **Close Preview** to return to editing.

---

## 3. Application Workflow & Architecture

The diagram below illustrates how MarkSync PDF transforms your Markdown content into a clean PDF:

```mermaid
flowchart TD
    A["Raw Markdown Input"] --> B["MarkSync Real-Time Parser"]
    B --> C{"Content Type"}
    
    C -->|Code Blocks| D["highlight.js Engine"]
    C -->|LaTeX Math| E["KaTeX Typesetting"]
    C -->|Diagrams| F["Mermaid.js Renderer"]
    C -->|Callouts| G["GitHub Alert Processor"]
    
    D --> H["Dynamic Typography Engine"]
    E --> H
    F --> H
    G --> H
    
    H --> I["Live Split Preview"]
    I --> J["Chromium Print-to-PDF Pipeline"]
    J --> K["Print-Ready PDF Document"]

    style A fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff
    style H fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style K fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
```

### Export Pipeline Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as MarkSync UI
    participant Main as Electron Main
    participant Chrome as Chromium Print Engine

    User->>UI: Click "Preview & Export"
    UI->>Main: Request PDF generation with active styles
    Main->>Chrome: Render headless print layout
    Chrome-->>Main: Return temporary PDF buffer
    Main-->>UI: Display PDF in interactive preview modal
    User->>UI: Click "Save to PC"
    UI->>Main: Save file to local storage
```

---

## 4. Markdown Syntax & Features Cheat Sheet

### GitHub-Style Alerts & Callouts

MarkSync PDF natively renders all five GitHub alert types with custom icons and styled borders:

> [!NOTE]
> Useful background information that users should know.

> [!TIP]
> Helpful advice or shortcuts to improve productivity.

> [!IMPORTANT]
> Crucial information required to achieve your goal.

> [!WARNING]
> Urgent info that needs immediate attention to prevent problems.

> [!CAUTION]
> Advises about potential risks, hazards, or negative outcomes.

#### Alert Syntax:
```markdown
> [!NOTE]
> Useful background information.

> [!TIP]
> Helpful advice or shortcuts.

> [!IMPORTANT]
> Key information you should know.

> [!WARNING]
> Warning about potential issues.

> [!CAUTION]
> Critical caution regarding risks.
```

---

### LaTeX Mathematical Equations (KaTeX)

Write inline formulas with single dollar signs `$ ... $` or centered display equations with double dollar signs `$$ ... $$`.

#### Live Formula Examples:
* **Inline Math:** The Euler identity $e^{i\pi} + 1 = 0$ and limit $\lim_{x \to 0} \frac{\sin x}{x} = 1$.
* **Gaussian Normal Distribution:**
$$f(x \mid \mu, \sigma^2) = \frac{1}{\sigma \sqrt{2\pi}} \exp\left( -\frac{(x - \mu)^2}{2\sigma^2} \right)$$

* **Definite Integral & Series:**
$$\int_{a}^{b} x^2 \, dx = \left[ \frac{x^3}{3} \right]_{a}^{b}, \quad \sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$

* **Coordinate Transformation Matrix:**
$$\begin{pmatrix} x' \\ y' \\ 1 \end{pmatrix} = \begin{bmatrix} \cos\theta & -\sin\theta & t_x \\ \sin\theta & \cos\theta & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{pmatrix} x \\ y \\ 1 \end{pmatrix}$$

#### Math Syntax:
```markdown
Inline formula: $E = mc^2$

Block equation:
$$
f(x) = \int_{-\infty}^{\infty} \hat{f}(\xi)\,e^{2 \pi i \xi x}\,d\xi
$$
```

---

### Mermaid Diagrams

Generate visual diagrams by labeling code blocks with `mermaid`:

```mermaid
flowchart LR
    Draft["Drafting .md"] --> Review["Live Preview"]
    Review --> Adjust["Adjust Sliders"]
    Adjust --> PDF["Export PDF"]
    
    style Draft fill:#1e293b,stroke:#3b82f6,color:#fff
    style PDF fill:#064e3b,stroke:#10b981,color:#fff
```

#### Diagram Syntax:
````markdown
```mermaid
flowchart TD
    Start["Start"] --> Process["Process Data"]
    Process --> Done["Finish"]
```
````

---

### Code Blocks & Syntax Highlighting

Powered by *highlight.js* with support for major programming languages:

```javascript
// Synchronizing typography variables with DOM
function setDocumentTheme(fontSize, lineHeight) {
  const container = document.getElementById('previewOutput');
  container.style.setProperty('--md-font-size', `${fontSize}px`);
  container.style.setProperty('--md-line-height', lineHeight);
}
```

```python
# Batch export script
import pathlib

def find_markdown_files(directory: str) -> list[str]:
    """Return all Markdown files in a directory."""
    return [str(p) for p in pathlib.Path(directory).glob("*.md")]
```

---

### Tables & Task Lists

| Feature | Supported | Engine / Technology |
| :--- | :---: | :--- |
| **Live Split Preview** | ✅ Yes | Electron + DOM Parser |
| **Dynamic Spacing Sliders** | ✅ Yes | Dynamic CSS Variables |
| **LaTeX Math** | ✅ Yes | KaTeX Library |
| **Mermaid Diagrams** | ✅ Yes | Mermaid.js Engine |
| **GitHub Callout Alerts** | ✅ Yes | Custom Marked Renderer |
| **Borderless Tables** | ✅ Yes | CSS Table Border Switch |

#### Task Checklist:
- [x] Write rich Markdown documentation
- [x] Embed mathematical formulas and vector diagrams
- [x] Adjust typography sliders for clean layout
- [ ] Export final document to PDF

---

## 5. Pro Tips & Best Practices for PDF Export

1. **Avoid Orphaned Headings:** If a heading appears near the very bottom of a page, increase the **Paragraph Gap** slider slightly. This will smoothly push the heading to the top of the next page.
2. **Table Density:** For wide tables, decrease the **Font Size** slider to `14px` or `15px` to keep all columns comfortably within the printable margins.
3. **Diagram Sizing:** Keep Mermaid diagrams focused and use `flowchart TD` or `flowchart LR` orientation for optimal fit on standard portrait A4 / Letter pages.
4. **Valid Math & Mermaid Syntax:** If a diagram or formula shows an error message, check for missing closing brackets or unescaped characters.
