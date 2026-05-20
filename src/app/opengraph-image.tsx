import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          color: "#fafafa",
        }}
      >
        {process.env.APP_NAME ?? "Next.js Base"}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#71717a",
          marginTop: 24,
        }}
      >
        {process.env.APP_TAGLINE ??
          "Production-ready · TypeScript · Tailwind CSS v4 · shadcn v4"}
      </div>
    </div>,
    { ...size }
  );
}
