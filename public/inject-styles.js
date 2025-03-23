// This script ensures CSS is loaded correctly
(function() {
  function injectCSS() {
    // Make sure Tailwind styles are loaded - try multiple possible paths for Next.js 15
    const possiblePaths = [
      '/_next/static/css/app/layout.css',
      '/_next/static/css/styles.css',
      '/_next/static/css/app/globals.css',
      '/_next/static/css/main.css'
    ];

    // Try to load from all possible paths
    possiblePaths.forEach(path => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = path;
      link.onerror = () => console.warn('Failed to load CSS from path:', path);
      link.onload = () => console.log('Successfully loaded CSS from path:', path);
      document.head.appendChild(link);
    });

    // Add our reset CSS
    const resetCSS = document.createElement('link');
    resetCSS.rel = 'stylesheet';
    resetCSS.href = '/reset.css';
    document.head.appendChild(resetCSS);

    // Add global CSS
    const globalCSS = document.createElement('link');
    globalCSS.rel = 'stylesheet';
    globalCSS.href = '/globals.css';
    document.head.appendChild(globalCSS);

    // Add component CSS
    const componentCSS = document.createElement('link');
    componentCSS.rel = 'stylesheet';
    componentCSS.href = '/components.module.css';
    document.head.appendChild(componentCSS);

    // Add inline fallback styles for critical UI components
    const inlineStyles = document.createElement('style');
    inlineStyles.textContent = `
      /* Critical fallback styles */
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #fff;
        color: #333;
      }
      .dark body {
        background-color: #111;
        color: #f9f9f9;
      }
      button, a { cursor: pointer; }
      .card { border: 1px solid #ddd; border-radius: 0.5rem; padding: 1rem; }
      .dark .card { border-color: #333; }
      input {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 0.25rem;
        width: 100%;
      }
      .dark input {
        background-color: #222;
        border-color: #555;
        color: #fff;
      }
    `;
    document.head.appendChild(inlineStyles);
  }

  // Try to run immediately
  injectCSS();

  // Ensure it's loaded after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  }

  // Fallback - try again after window load
  window.addEventListener('load', injectCSS);
})();
