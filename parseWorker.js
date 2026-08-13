/**
 * parseWorker.js — Off-Main-Thread Markdown Parser
 * 
 * Runs marked.parse() + highlight.js + KaTeX in a Web Worker so the main
 * thread stays 100% responsive for keyboard input, regardless of document size.
 * Mermaid rendering is NOT done here because it needs DOM access; the main
 * thread handles it after receiving the parsed HTML.
 */

// Workers in Electron with nodeIntegrationInWorker can use require()
// but marked is loaded via script tag on the main thread. We need to load
// our own copies here.
let markedModule, hljsModule, katexModule;
let isReady = false;

// Use importScripts for browser-compatible loading in the worker context
try {
  // In Electron workers, we can use require
  markedModule = require('marked');
  hljsModule = require('highlight.js');
  katexModule = require('katex');
  isReady = true;
} catch (e) {
  // Fallback: signal that worker couldn't load modules
  self.postMessage({ type: 'error', message: 'Failed to load modules: ' + e.message });
}

if (isReady) {
  // Configure marked with the same extensions as renderer.js

  const blockMathExtension = {
    name: 'blockMath',
    level: 'block',
    start(src) {
      const match = src.match(/(?:^|\n)\s*\$\$/);
      return match ? match.index : undefined;
    },
    tokenizer(src, tokens) {
      const rule = /^(?:\r?\n)?\s*\$\$([\s\S]+?)\$\$\s*(?:\r?\n|$)/;
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
        return katexModule.renderToString(token.text, {
          displayMode: true,
          throwOnError: false
        });
      } catch (e) {
        return `<span class="katex-error">${e.message}</span>`;
      }
    }
  };

  const inlineMathExtension = {
    name: 'inlineMath',
    level: 'inline',
    start(src) {
      const match = src.match(/\$(?!\$)/);
      return match ? match.index : undefined;
    },
    tokenizer(src, tokens) {
      const rule = /^\$((?!\$)[^\$\n]+?)\$/;
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
        return katexModule.renderToString(token.text, {
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
        const id = raw.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
      code(code, infostring, escaped) {
        if (infostring === 'mermaid') {
          return `<div class="mermaid">${code}</div>\n`;
        }
        const language = hljsModule.getLanguage(infostring) ? infostring : 'plaintext';
        const highlighted = hljsModule.highlight(code, { language }).value;
        return `<div class="code-block-wrapper">
          <button class="copy-code-btn" type="button" aria-label="Copy syntax" title="Copy syntax">
            <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span class="copy-text">Copied!</span>
          </button>
          <pre><code class="hljs language-${language}">${highlighted}</code></pre>
        </div>\n`;
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

  markedModule.use({ extensions: [blockMathExtension, inlineMathExtension] });
  markedModule.use(customRendererExtension);
  markedModule.use({ breaks: true });

  // Signal readiness
  self.postMessage({ type: 'ready' });

  // Listen for parse requests
  self.onmessage = function(e) {
    if (e.data.type === 'parse') {
      try {
        const html = markedModule.parse(e.data.markdown);
        self.postMessage({
          type: 'parsed',
          html: html,
          version: e.data.version
        });
      } catch (err) {
        self.postMessage({
          type: 'error',
          message: err.message,
          version: e.data.version
        });
      }
    }
  };
}
