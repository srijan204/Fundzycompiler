# Fundzy Compiler — GitHub Pages project

A beginner-friendly online C/C++ compiler interface with a Monaco editor, working sample programs, standard-input support, an explanatory Learn section, a line-by-line Code Basics guide, CSS live preview, downloadable source files, and a game-style success celebration.

C and C++ are compiled to WebAssembly in the browser using `browsercc`; programs run in a Web Worker using `@bjorn3/browser_wasi_shim`. The worker is terminated after 3 seconds so a simple infinite loop is less likely to freeze the editor. This is an educational tool, not a hardened public execution sandbox.

## Run locally

Requirements: Node.js 22+ and internet access for installing npm packages and the first compiler-toolchain download.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Test both C and C++, sample programs, standard input, compiler errors, the CSS preview, the theme toggle, and the success animation. Build for deployment with:

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Create a repository such as `FundzyCompiler`.
2. Extract this ZIP and upload the **contents of this folder** to the repository root. The root should contain `index.html`, `package.json`, `vite.config.js`, `src/`, and `.github/`. Do not upload only `index.html`.
3. Push the files to the `main` branch. The included `.github/workflows/pages.yml` installs dependencies, builds the site, and deploys `dist/`.
4. In the repository, open **Settings → Pages** and set the source to **GitHub Actions**.
5. Open the Actions tab and wait for **Deploy FundzyCompiler** to finish successfully. Use the published URL shown by the workflow.

The Vite config uses a relative asset base so the app can run from a GitHub Pages project path. If you want it under an existing `fundzy.co.in/compiler/` path, integrate the built `dist/` contents into the existing Fundzy site's deployment rather than assigning the same custom domain to a second repository.

## Important limitations

- The first compiler run may download a sizeable toolchain; a working internet connection is required.
- Standard input is supplied before execution; interactive prompts do not accept new input mid-run.
- The runner has a 3-second runtime limit. Browser/WASI programs may not support all native operating-system features, threads, or networking.
- The celebration confirms successful compilation/execution, not that arbitrary code is logically correct. The “HURRY! YOU'RE DOING GOOD!” message is used for the unchanged Hello World example; custom programs get a more general successful-run message.
- Do not use this as a hardened service for untrusted workloads without additional security review and stronger isolation.
- I could not complete npm installation and a full browser compile test in the generation environment. Let the included GitHub Actions build run and test the published C and C++ examples before announcing the site as production-ready.
