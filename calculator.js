
(() => {
  const exprEl = document.getElementById('expression');
  const dispEl = document.getElementById('display');
  const keys = document.getElementById('keys');

  let expr = '';        // full expression string shown in tiny line
  let lastResult = null;

  const sanitizeForEval = (s) => {
    // Replace visual operators with JS equivalents
    s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

    // Convert percentage operator: "50%" -> "50/100"
    // But handle things like "200+10%" -> "200+10/100"
    s = s.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

    // Disallow anything unexpected: only digits, math operators, parentheses, dot and spaces allowed
    if (!/^[0-9+\-*/().\s]+$/.test(s)) {
      throw new Error('Invalid characters in expression.');
    }
    return s;
  };

  const updateScreen = () => {
    exprEl.textContent = expr || '0';
    dispEl.textContent = lastResult === null ? '0' : String(lastResult);
  };

  const safeEval = (s) => {
    const js = sanitizeForEval(s);
    // Use Function constructor rather than eval — still executes locally in browser
    // Limit result precision and convert to number
    let value = Function('"use strict"; return (' + js + ')')();
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Math error');
    // Round to avoid long floating tails
    if (typeof value === 'number') {
      // show up to 12 significant digits but remove trailing zeros
      value = parseFloat(value.toPrecision(12));
    }
    return value;
  };

  function appendValue(v) {
    // Basic smart rules: if last action was equals and user types number, start new expr
    if (lastResult !== null && /^[0-9.]/.test(v) && expr === '') {
      lastResult = null;
      dispEl.textContent = '0';
    }
    expr += v;
    exprEl.textContent = expr;
  }

  function doClear() {
    expr = '';
    lastResult = null;
    exprEl.textContent = '0';
    dispEl.textContent = '0';
  }

  function doBackspace() {
    if (expr.length > 0) {
      expr = expr.slice(0, -1);
      exprEl.textContent = expr || '0';
    } else {
      // if expr empty but result present, clear it
      lastResult = null;
      dispEl.textContent = '0';
    }
  }

  function doEquals() {
    if (!expr.trim()) return;
    try {
      const value = safeEval(expr);
      lastResult = value;
      expr = '';
      exprEl.textContent = '';
      dispEl.textContent = String(value);
    } catch (e) {
      dispEl.textContent = 'Error';
      lastResult = null;
    }
  }

  // Button clicks
  keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const val = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');

    if (action === 'clear') return doClear();
    if (action === 'back') return doBackspace();
    if (action === 'equals') return doEquals();

    if (val) {
      appendValue(val);
    }
  });

  // Keyboard support
  window.addEventListener('keydown', (e) => {
    // prevent default for keys we handle
    const allowed = ['0','1','2','3','4','5','6','7','8','9','.','(',')','+','-','*','/','%','Enter','Backspace','Escape'];
    if (!allowed.includes(e.key)) {
      // also handle Numpad operators:
      const numpad = ['NumpadEnter','NumpadAdd','NumpadSubtract','NumpadMultiply','NumpadDivide'];
      if (!numpad.includes(e.code)) return;
    }
    if (e.key === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault();
      doEquals();
      return;
    }
    if (e.key === 'Backspace') { e.preventDefault(); doBackspace(); return; }
    if (e.key === 'Escape') { e.preventDefault(); doClear(); return; }

    // Map keyboard characters to our expression format
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); appendValue(e.key); return; }
    if (e.key === '.') { e.preventDefault(); appendValue('.'); return; }
    if (e.key === '+') { e.preventDefault(); appendValue('+'); return; }
    if (e.key === '-') { e.preventDefault(); appendValue('−'); return; } // uses visual minus
    if (e.key === '*') { e.preventDefault(); appendValue('×'); return; }
    if (e.key === '/') { e.preventDefault(); appendValue('÷'); return; }
    if (e.key === '%') { e.preventDefault(); appendValue('%'); return; }
    if (e.key === '(' || e.key === ')') { e.preventDefault(); appendValue(e.key); return; }
  });

  // Initialize
  doClear();
})();