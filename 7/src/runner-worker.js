import { WASI, File, OpenFile, ConsoleStdout } from "@bjorn3/browser_wasi_shim";

self.onmessage = async ({ data }) => {
  const { module, stdinText = "" } = data;
  let stdout = "";
  let stderr = "";
  const decoderOut = new TextDecoder();
  const decoderErr = new TextDecoder();
  const fds = [
    new OpenFile(new File(new TextEncoder().encode(stdinText))),
    new ConsoleStdout(bytes => { stdout += decoderOut.decode(bytes, { stream: true }); }),
    new ConsoleStdout(bytes => { stderr += decoderErr.decode(bytes, { stream: true }); })
  ];
  const wasi = new WASI([], [], fds);
  try {
    const instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: wasi.wasiImport
    });
    const exitCode = wasi.start(instance);
    stdout += decoderOut.decode();
    stderr += decoderErr.decode();
    self.postMessage({ type: "done", stdout, stderr, exitCode });
  } catch (error) {
    stdout += decoderOut.decode();
    stderr += decoderErr.decode();
    self.postMessage({ type: "error", stdout, stderr, error: error?.message || String(error) });
  }
};
