import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import { compile } from "browsercc";
import "./style.css";

globalThis.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === "css" || label === "scss" || label === "less") return new CssWorker();
    return new EditorWorker();
  }
};

const $ = (id) => document.getElementById(id);

const examples = {
  c: {
    file: "main.c",
    hello: `#include <stdio.h>

int main(void) {
    printf("Hello from FundzyCompiler!\\n");
    return 0;
}
`,
    sum: `#include <stdio.h>

int main(void) {
    int a, b;
    printf("Enter two numbers: ");
    if (scanf("%d %d", &a, &b) == 2) {
        printf("Sum = %d\\n", a + b);
    }
    return 0;
}
`,
    factorial: `#include <stdio.h>

int main(void) {
    int n;
    long long fact = 1;
    if (scanf("%d", &n) != 1 || n < 0 || n > 20) {
        printf("Enter an integer from 0 to 20.\\n");
        return 0;
    }
    for (int i = 1; i <= n; ++i) fact *= i;
    printf("Factorial = %lld\\n", fact);
    return 0;
}
`,
    fibonacci: `#include <stdio.h>

int main(void) {
    int n, a = 0, b = 1;
    if (scanf("%d", &n) != 1 || n < 0 || n > 45) return 0;
    for (int i = 0; i < n; ++i) {
        printf("%d ", a);
        int next = a + b; a = b; b = next;
    }
    printf("\\n");
    return 0;
}
`,
    prime: `#include <stdio.h>

int main(void) {
    int n, prime = 1;
    if (scanf("%d", &n) != 1 || n < 2) prime = 0;
    for (int i = 2; i <= n / i; ++i) { if (n % i == 0) { prime = 0; break; } }
    printf(prime ? "Prime\\n" : "Not prime\\n");
    return 0;
}
`
  },
  cpp: {
    file: "main.cpp",
    hello: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from FundzyCompiler!" << endl;
    return 0;
}
`,
    sum: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cout << "Enter two numbers: ";
    if (cin >> a >> b) cout << "Sum = " << a + b << endl;
    return 0;
}
`,
    factorial: `#include <iostream>
using namespace std;

int main() {
    int n;
    long long fact = 1;
    if (!(cin >> n) || n < 0 || n > 20) return 0;
    for (int i = 1; i <= n; ++i) fact *= i;
    cout << "Factorial = " << fact << endl;
    return 0;
}
`,
    fibonacci: `#include <iostream>
using namespace std;

int main() {
    int n, a = 0, b = 1;
    if (!(cin >> n) || n < 0 || n > 45) return 0;
    for (int i = 0; i < n; ++i) {
        cout << a << " ";
        int next = a + b; a = b; b = next;
    }
    cout << endl;
    return 0;
}
`,
    prime: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    bool prime = n >= 2;
    for (int i = 2; i <= n / i; ++i) { if (n % i == 0) { prime = false; break; } }
    cout << (prime ? "Prime" : "Not prime") << endl;
    return 0;
}
`
  },
  css: {
    file: "styles.css",
    hello: `body {
  font-family: system-ui, sans-serif;
  background: #101321;
  color: #f7f7ff;
}
.card {
  padding: 2rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, #21143d, #121d37);
  border: 1px solid #51417c;
}
h1 { color: #c4a5ff; }
button {
  background: #a855f7;
  color: white;
  border: 0;
  padding: .8rem 1rem;
  border-radius: .8rem;
}
`
  }
};

let language = "c";
let selectedExample = "hello";
let isRunning = false;
let activeOutputTab = "output";
const output = $("out");

function executeModule(module, stdinText, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./runner-worker.js", import.meta.url), { type: "module" });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Run stopped after 3 seconds. Check whether your program has an infinite loop or needs a smaller input."));
    }, timeoutMs);
    worker.onmessage = ({ data }) => {
      clearTimeout(timeout);
      worker.terminate();
      if (data.type === "error") {
        const error = new Error(data.error || "The program could not finish.");
        error.stdout = data.stdout || "";
        error.stderr = data.stderr || "";
        reject(error);
      } else {
        resolve(data);
      }
    };
    worker.onerror = event => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || "The code runner worker failed."));
    };
    worker.postMessage({ module, stdinText });
  });
}
const editor = monaco.editor.create($("editor"), {
  value: examples.c.hello,
  language: "c",
  theme: "vs-dark",
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: 23,
  tabSize: 4,
  scrollBeyondLastLine: false,
  wordWrap: "on",
  padding: { top: 14, bottom: 14 },
  ariaLabel: "Fundzy Compiler code editor"
});

function setOutput(text) {
  output.textContent = text;
}
function setTab(tab) {
  activeOutputTab = tab;
  document.querySelectorAll(".tab[data-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
}
function setLanguage(next, loadExample = true) {
  language = next;
  document.querySelectorAll(".lang").forEach(button => {
    button.classList.toggle("active", button.dataset.lang === next);
  });
  monaco.editor.setModelLanguage(editor.getModel(), next === "cpp" ? "cpp" : next === "css" ? "css" : "c");
  $("filename").textContent = examples[next].file;
  $("editor-label").textContent = `${next.toUpperCase()} · ${examples[next].file}`;
  $("stdin").disabled = next === "css";
  $("stdin").placeholder = next === "css" ? "CSS uses the live preview, not standard input." : "Enter input for scanf() or cin here...";
  $("css-wrap").hidden = next !== "css";
  if (loadExample) editor.setValue(examples[next][selectedExample] || examples[next].hello);
  if (next === "css") updateCssPreview();
  else setOutput("Ready to run. Press Run Code to compile your program.");
}
function updateCssPreview() {
  const css = editor.getValue().replace(/<\/style/gi, "<\\/style");
  $("preview").srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}
    body{margin:0;padding:24px;min-height:90vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#101321;color:#f7f7ff}
    .demo{max-width:420px;width:100%;padding:28px;border-radius:22px;background:#191d2d;border:1px solid #343952}
    button{padding:10px 15px;border-radius:10px;border:0;background:#8b5cf6;color:white}
    ${css}
  </style></head><body><section class="demo card"><h1>Fundzy CSS Playground</h1><p>Edit CSS and see your styles update.</p><button>Example button</button></section></body></html>`;
  setOutput("CSS preview updated live.");
}
function showCelebration(isKnownExample = false) {
  const overlay = $("celebration");
  $("celebration-kicker").textContent = isKnownExample ? "EXAMPLE COMPLETED" : "RUN SUCCESSFUL";
  $("celebration-title").textContent = isKnownExample ? "HURRY! YOU'RE DOING GOOD! 🎉" : "NICE RUN! 🎉";
  $("celebration-message").textContent = isKnownExample
    ? "Your example ran successfully. You're building real coding skills."
    : "Your program ran without a compilation or runtime error. Keep testing your logic.";
  $("celebration-xp").textContent = isKnownExample ? "✨  +10 CODE XP · SESSION REWARD  ✨" : "✨  +5 CODE XP · SESSION REWARD  ✨";
  const layer = $("confetti");
  layer.replaceChildren();
  const colors = ["#d879ff", "#8b8bff", "#60a5fa", "#f0abfc", "#a7f3d0", "#fde68a"];
  for (let i = 0; i < 58; i++) {
    const bit = document.createElement("i");
    bit.className = "bit";
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = `${Math.random() * 0.55}s`;
    bit.style.setProperty("--dx", `${Math.random() * 180 - 90}px`);
    layer.appendChild(bit);
  }
  overlay.hidden = false;
}
function closeCelebration() {
  $("celebration").hidden = true;
}

async function runCode() {
  if (language === "css") {
    updateCssPreview();
    return;
  }
  if (isRunning) return;
  isRunning = true;
  $("run").disabled = true;
  $("run").textContent = "◌ Compiling…";
  setTab("output");
  setOutput("Compiling in your browser… The first run may take longer while compiler assets load.");

  try {
    const source = editor.getValue();
    if (!source.trim()) throw new Error("Write some code before running it.");
    const isKnownExample = selectedExample === "hello" && source.trim() === (examples[language].hello || "").trim();
    const result = await compile({
      source,
      fileName: examples[language].file,
      flags: language === "cpp" ? ["-std=c++20"] : ["-std=c17"]
    });

    if (!result.module) {
      setOutput(result.compileOutput || "Compilation failed. Check the compiler messages and try again.");
      setTab("errors");
      return;
    }

    const runResult = await executeModule(result.module, $("stdin").value);
    const stdout = runResult.stdout || "";
    const stderr = runResult.stderr || "";
    const outputParts = [];
    if (result.compileOutput?.trim()) outputParts.push(result.compileOutput.trim());
    if (stdout.trimEnd()) outputParts.push(stdout.trimEnd());
    if (stderr.trimEnd()) outputParts.push(`stderr:\n${stderr.trimEnd()}`);
    const programOutput = outputParts.join("\n\n") || "Program finished successfully with no output.";
    setOutput(programOutput);
    if (typeof runResult.exitCode === "number" && runResult.exitCode !== 0) {
      setOutput(`${programOutput}\n\nProgram exited with code ${runResult.exitCode}.`);
      setTab("errors");
      return;
    }
    if (stderr.trim()) {
      setTab("errors");
    } else {
      setTab("output");
      showCelebration(isKnownExample);
    }
  } catch (error) {
    const details = [error?.stdout?.trim(), error?.stderr?.trim(), error?.message || String(error)].filter(Boolean).join("\n\n");
    setOutput(`${details}\n\nIf this is your first run, the compiler may still be downloading its assets. Otherwise, review the message above and try again.`);
    setTab("errors");
  } finally {
    isRunning = false;
    $("run").disabled = false;
    $("run").innerHTML = "▶ Run Code";
  }
}

document.querySelectorAll(".lang").forEach(button => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});
document.querySelectorAll(".example").forEach(button => {
  button.addEventListener("click", () => {
    selectedExample = button.dataset.example;
    document.querySelectorAll(".example").forEach(item => item.classList.toggle("active", item === button));
    setLanguage(language);
  });
});
document.querySelectorAll(".learn-load").forEach(button => button.addEventListener("click", () => {
  selectedExample = button.dataset.example;
  document.querySelectorAll(".example").forEach(item => item.classList.toggle("active", item.dataset.example === selectedExample));
  setLanguage(button.dataset.lang);
  document.querySelector("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}));
document.querySelectorAll(".tab[data-tab]").forEach(button => button.addEventListener("click", () => setTab(button.dataset.tab)));
$("run").addEventListener("click", runCode);
$("clear").addEventListener("click", () => { editor.setValue(""); setOutput("Editor cleared."); });
$("clearstdin").addEventListener("click", () => { $("stdin").value = ""; });
$("clearout").addEventListener("click", () => setOutput(""));
$("newfile").addEventListener("click", () => {
  editor.setValue("");
  $("filename").textContent = `untitled.${language === "cpp" ? "cpp" : language === "css" ? "css" : "c"}`;
});
$("download").addEventListener("click", () => {
  const blobUrl = URL.createObjectURL(new Blob([editor.getValue()], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = examples[language].file;
  anchor.click();
  URL.revokeObjectURL(blobUrl);
});
$("fullscreen").addEventListener("click", async () => {
  const target = $(".content");
  if (!document.fullscreenElement) await target.requestFullscreen?.();
  else await document.exitFullscreen?.();
  editor.layout();
});
$("theme").addEventListener("click", () => document.body.classList.toggle("light-mode"));
$("close").addEventListener("click", closeCelebration);
$("continue").addEventListener("click", closeCelebration);
$("celebration").addEventListener("click", event => {
  if (event.target.id === "celebration") closeCelebration();
});
editor.onDidChangeModelContent(() => {
  if (language === "css") updateCssPreview();
});
window.addEventListener("resize", () => editor.layout());
setLanguage("c", false);
