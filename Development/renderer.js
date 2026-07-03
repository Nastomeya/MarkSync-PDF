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
