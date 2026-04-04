import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Conteo — Simple and private analytics for your website";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "white",
            marginBottom: 24,
            letterSpacing: "-2px",
          }}
        >
          conteo
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Simple and private analytics for your website
        </div>
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: 40,
            fontSize: 18,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <span>No cookies</span>
          <span>·</span>
          <span>GDPR compliant</span>
          <span>·</span>
          <span>Free up to 10k visits/mo</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
