import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
function configuredOrigin(
  name: string,
  value: string | undefined,
  productionProtocol: "https:" | "wss:",
) {
  if (!value) return null;
  const parsed = new URL(value);
  if (
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash ||
    (!isDevelopment && parsed.protocol !== productionProtocol)
  )
    throw new Error(`${name} must be an origin using ${productionProtocol}`);
  return parsed.origin;
}

const configuredApiOrigin = configuredOrigin(
  "NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN",
  process.env.NEXT_PUBLIC_PINKWARD_IDENTITY_ORIGIN,
  "https:",
);
const configuredWebsocketOrigin = configuredOrigin(
  "NEXT_PUBLIC_PINKWARD_WEBSOCKET_ORIGIN",
  process.env.NEXT_PUBLIC_PINKWARD_WEBSOCKET_ORIGIN,
  "wss:",
);
const connectSources = new Set(["'self'", "http://127.0.0.1:43991"]);
if (isDevelopment) {
  connectSources.add("http://localhost:8088");
  connectSources.add("ws://localhost:8088");
}
for (const value of [configuredApiOrigin, configuredWebsocketOrigin]) {
  if (value) connectSources.add(value);
}
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://ddragon.leagueoflegends.com",
  "font-src 'self'",
  `connect-src ${[...connectSources].join(" ")}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(!isDevelopment
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
