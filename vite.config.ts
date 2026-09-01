import tailwindcss from "@tailwindcss/postcss";
import vinext from "vinext";
import { defineConfig } from "vite";

const localSecurityHeaders: Record<string, string> = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://ddragon.leagueoflegends.com",
    "font-src 'self'",
    "connect-src 'self' http://localhost:8088 ws://localhost:8088 http://127.0.0.1:43991 ws://127.0.0.1:43991",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "media-src 'none'",
    "object-src 'none'",
  ].join("; "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

function securityHeadersPlugin() {
  const install = (server: {
    middlewares: {
      use: (
        callback: (
          request: unknown,
          response: { setHeader: (key: string, value: string) => void },
          next: () => void,
        ) => void,
      ) => void;
    };
  }) => {
    server.middlewares.use((_request, response, next) => {
      for (const [key, value] of Object.entries(localSecurityHeaders))
        response.setHeader(key, value);
      next();
    });
  };
  return {
    name: "gyms-lol-security-headers",
    configureServer: install,
    configurePreviewServer: install,
  };
}

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  server: isCodexSeatbeltSandbox
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
  plugins: [securityHeadersPlugin(), vinext()],
});
