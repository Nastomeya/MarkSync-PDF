const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const hljs = require('highlight.js');
const katex = require('katex');

async function init() {
  // marked is available globally from script tag

  // Custom extension for KaTeX block math blocks
  const blockMathExtension = {
    name: 'blockMath',
    level: 'block',
    start(src) { return src.match(/\$\$/)?.index; },
    tokenizer(src, tokens) {
      const rule = /^\$\$([\s\S]+?)\$\$/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: 'blockMath',
          raw: match[0],
          text: match[1].trim()
        };
      }
    },
    renderer(token) {
      try {
        return katex.renderToString(token.text, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        return `<span class="katex-error">${e.message}</span>`;
      }
    }
  };

  // Custom extension for KaTeX inline math blocks
  const inlineMathExtension = {
    name: 'inlineMath',
    level: 'inline',
    start(src) { return src.match(/\$/)?.index; },
    tokenizer(src, tokens) {
      const rule = /^\$([^$]+?)\$/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: 'inlineMath',
          raw: match[0],
          text: match[1].trim()
        };
      }
    },
    renderer(token) {
      try {
        return katex.renderToString(token.text, {
          displayMode: false,
          throwOnError: false
        });
      } catch (e) {
        return `<span class="katex-error">${e.message}</span>`;
      }
    }
  };

  const customRendererExtension = {
    renderer: {
      heading(text, depth, raw) {
        // Convert heading text to GitHub-style slug for internal links
        const id = raw.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      code(code, infostring, escaped) {
        if (infostring === 'mermaid') {
          return `<div class="mermaid">${code}</div>\n`;
        }
        const language = hljs.getLanguage(infostring) ? infostring : 'plaintext';
        const highlighted = hljs.highlight(code, { language }).value;
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>\n`;
      },
      blockquote(quote) {
        const match = quote.match(/^<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br>\n?|<\/p>\n?<p>)?/i);
        if (match) {
          const type = match[1].toLowerCase();
          const title = type.charAt(0).toUpperCase() + type.slice(1);
          const processedQuote = quote.replace(match[0], '<p>');
          
          const alertIcons = {
            note: '<svg viewBox="0 0 16 16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>',
            tip: '<svg viewBox="0 0 16 16"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
            important: '<svg viewBox="0 0 16 16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
            warning: '<svg viewBox="0 0 16 16"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.397c.65 1.215-.224 2.756-1.543 2.756H1.918c-1.319 0-2.193-1.541-1.543-2.756Zm1.763 1.24a.25.25 0 0 0-.44 0L1.698 13.684a.25.25 0 0 0 .22.366h12.164a.25.25 0 0 0 .22-.366Zm.53 3.963a.75.75 0 0 1-.75.75.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 1 1.5 0v2.5Zm0 3.25a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
            caution: '<svg viewBox="0 0 16 16"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
          };
          const icon = alertIcons[type] || '';

          return `<blockquote class="markdown-alert markdown-alert-${type}">
            <p class="markdown-alert-title">${icon}${title}</p>
            ${processedQuote}
          </blockquote>\n`;
        }
        return `<blockquote>\n${quote}</blockquote>\n`;
      }
    }
  };

  marked.use({ extensions: [blockMathExtension, inlineMathExtension] });
  marked.use(customRendererExtension);
  marked.use({ breaks: true });

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function ensureMermaidLoaded() {
    if (typeof mermaid === 'undefined') {
      await loadScript('node_modules/mermaid/dist/mermaid.min.js');
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true
        }
      });
    }
  }

  const input = document.getElementById('markdownInput');
  const output = document.getElementById('previewOutput');
  const exportBtn = document.getElementById('exportBtn');
  const helpBtn = document.getElementById('helpBtn');
  const pdfModal = document.getElementById('pdfModal');
  const helpModal = document.getElementById('helpModal');
  const pdfWebview = document.getElementById('pdfWebview');
  const savePdfBtn = document.getElementById('savePdfBtn');
  const closePdfBtn = document.getElementById('closePdfBtn');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const helpContent = document.getElementById('helpContent');
  let currentTempPath = null;

  const appVersionElement = document.getElementById('appVersion');
  if (appVersionElement) {
    try {
      const pkgPath = path.join(__dirname, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      appVersionElement.innerText = `v${pkg.version}`;
    } catch (e) {
      console.error('Failed to load version:', e);
    }
  }

  async function updatePreview() {
    output.innerHTML = marked.parse(input.value);
    
    if (document.querySelector('.mermaid')) {
      try {
        await ensureMermaidLoaded();
        await mermaid.run({
          querySelector: '.mermaid'
        });
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    }
  }

  // Load saved text if available
  const savedContent = localStorage.getItem('savedMarkdown');
  if (savedContent !== null) {
    input.value = savedContent;
  }

  input.addEventListener('input', () => {
    localStorage.setItem('savedMarkdown', input.value);
    updatePreview();
  });

  exportBtn.addEventListener('click', async () => {
    // Add loading state
    exportBtn.classList.add('loading');
    exportBtn.innerText = 'Generating PDF...';
    
    const result = await ipcRenderer.invoke('preview-pdf');
    
    exportBtn.classList.remove('loading');
    exportBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      Preview & Export
    `;
    
    if (result.success) {
      currentTempPath = result.tempPath;
      pdfWebview.src = `file://${result.tempPath}`;
      pdfModal.classList.remove('hidden');
    } else {
      alert('Failed to preview PDF: ' + result.message);
    }
  });

  closePdfBtn.addEventListener('click', () => {
    pdfModal.classList.add('hidden');
    pdfWebview.src = 'about:blank'; // Clear memory
  });

  savePdfBtn.addEventListener('click', async () => {
    if (!currentTempPath) return;
    savePdfBtn.innerText = 'Saving...';
    
    const result = await ipcRenderer.invoke('save-pdf', currentTempPath);
    savePdfBtn.innerText = 'Save to PC';
    
    if (result.success) {
      // Successfully saved
      pdfModal.classList.add('hidden');
      pdfWebview.src = 'about:blank';
    } else if (result.message !== 'Cancelled') {
      alert('Failed to save PDF: ' + result.message);
    }
  });

  // Help Modal Actions
  helpBtn.addEventListener('click', async () => {
    try {
      const manualPath = path.join(__dirname, 'USER_MANUAL.md');
      if (fs.existsSync(manualPath)) {
        const manualContent = fs.readFileSync(manualPath, 'utf8');
        helpContent.innerHTML = marked.parse(manualContent);
        
        // Render Mermaid inside help modal if there are diagrams
        if (helpContent.querySelector('.mermaid')) {
          try {
            await ensureMermaidLoaded();
            await mermaid.run({
              querySelector: '#helpContent .mermaid'
            });
          } catch (me) {
            console.error('Mermaid render error inside help modal:', me);
          }
        }
      } else {
        helpContent.innerHTML = '<p>User Manual file not found.</p>';
      }
    } catch (e) {
      console.error('Failed to read user manual:', e);
      helpContent.innerHTML = '<p>Failed to load User Manual.</p>';
    }
    helpModal.classList.remove('hidden');
  });

  closeHelpBtn.addEventListener('click', () => {
    helpModal.classList.add('hidden');
    helpContent.innerHTML = ''; // Clear memory/DOM
  });

  // Drag and drop support
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.opacity = '0.7';
  });

  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.opacity = '1';
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.body.style.opacity = '1';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const content = fs.readFileSync(file.path, 'utf8');
        input.value = content;
        localStorage.setItem('savedMarkdown', content);
        updatePreview();
      } else {
        alert('Please drop a .md or .txt file.');
      }
    }
  });

  // Formatting Sliders
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  const fontSizeVal = document.getElementById('fontSizeVal');
  const lineHeightSlider = document.getElementById('lineHeightSlider');
  const lineHeightVal = document.getElementById('lineHeightVal');
  const paraGapSlider = document.getElementById('paraGapSlider');
  const paraGapVal = document.getElementById('paraGapVal');

  function updateTypography() {
    const fontSize = fontSizeSlider.value;
    const lineHeight = (lineHeightSlider.value / 10).toFixed(1);
    const paraGap = paraGapSlider.value;

    fontSizeVal.innerText = `${fontSize}px`;
    lineHeightVal.innerText = lineHeight;
    paraGapVal.innerText = `${paraGap}px`;

    output.style.setProperty('--md-font-size', `${fontSize}px`);
    output.style.setProperty('--md-line-height', lineHeight);
    output.style.setProperty('--md-para-gap', `${paraGap}px`);
  }

  fontSizeSlider.addEventListener('input', updateTypography);
  lineHeightSlider.addEventListener('input', updateTypography);
  paraGapSlider.addEventListener('input', updateTypography);

  // Set initial slider values
  updateTypography();

  // Initial render
  updatePreview();
}

init();
