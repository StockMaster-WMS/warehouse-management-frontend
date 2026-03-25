import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Icon PWA / favicon — nguồn cho manifest & trình duyệt. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #4f46e5 0%, #312e81 100%)",
          borderRadius: "22%",
        }}
      >
        <span
          style={{
            fontSize: 280,
            fontWeight: 800,
            color: "white",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.05em",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size },
  );
}
