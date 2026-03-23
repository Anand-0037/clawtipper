import { ImageResponse } from "next/og";

export const alt = "ClawTipper — Autonomous Capital Allocator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0B0B0B 0%, #0f172a 50%, #0B0B0B 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 48,
            borderRadius: 24,
            border: "1px solid rgba(34, 197, 94, 0.35)",
            background: "rgba(0,0,0,0.5)",
            boxShadow: "0 0 80px rgba(34, 197, 94, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#fafafa",
              letterSpacing: "-0.02em",
            }}
          >
            Autonomous Capital Allocator
          </div>
          <div style={{ fontSize: 28, color: "#4ade80" }}>
            Reward OSS with USDT
          </div>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 24,
              fontSize: 18,
              color: "#64748b",
              fontFamily: "monospace",
            }}
          >
            <span>ClawTipper</span>
            <span style={{ color: "#3b82f6" }}>·</span>
            <span>Tether WDK · Polygon</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
