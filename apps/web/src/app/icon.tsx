import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#5C1A4B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#E8B33C",
          fontSize: 20,
          fontWeight: 800,
        }}
      >
        P
      </div>
    ),
    size,
  );
}
