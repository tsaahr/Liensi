import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          color: "#f8f4ff",
          background:
            "radial-gradient(circle at 18% 12%, rgba(192, 132, 252, 0.26), transparent 360px), linear-gradient(135deg, #11111a 0%, #0a0a0f 54%, #050507 100%)"
        }}
      >
        <div
          style={{
            fontSize: 112,
            letterSpacing: "0.32em",
            fontWeight: 300
          }}
        >
          LIENSI
        </div>
        <div
          style={{
            marginTop: 28,
            maxWidth: 760,
            fontSize: 34,
            lineHeight: 1.25,
            color: "rgba(248,244,255,0.72)"
          }}
        >
          Catálogo íntimo com curadoria sofisticada.
        </div>
        <div
          style={{
            marginTop: 56,
            width: 120,
            height: 2,
            background: "#c084fc",
            boxShadow: "0 0 32px rgba(192,132,252,0.72)"
          }}
        />
      </div>
    ),
    size
  );
}
