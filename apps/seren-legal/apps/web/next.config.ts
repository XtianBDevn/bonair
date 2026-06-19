import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // SAMEORIGIN for widget embedding
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com https://api.stripe.com https://api.twilio.com",
      "frame-ancestors 'self' https:", // Allow widget embedding
    ].join("; "),
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client"],
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes except the widget
        source: "/((?!widget|api/widget).*)",
        headers: securityHeaders,
      },
      {
        // Widget routes get relaxed frame-ancestors for embedding
        source: "/widget/:path*",
        headers: securityHeaders.filter(
          (h) => h.key !== "X-Frame-Options" && h.key !== "Content-Security-Policy"
        ).concat([
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.openai.com",
              "frame-ancestors *",
            ].join("; "),
          },
        ]),
      },
    ];
  },
};

export default nextConfig;
