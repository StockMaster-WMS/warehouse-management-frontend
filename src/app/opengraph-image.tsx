import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";

export const alt = "StockMaster WMS - warehouse management dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rootStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  background: "#0f172a",
  color: "#f8fafc",
  fontFamily: "Inter, Arial, sans-serif",
  padding: 64,
  position: "relative",
  overflow: "hidden",
};

const backdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(79,70,229,0.38), rgba(14,165,233,0.18) 42%, rgba(15,23,42,0.94))",
};

const contentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  width: "100%",
  gap: 54,
  alignItems: "center",
};

const titleColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 450,
};

const logoStyle: CSSProperties = {
  width: 74,
  height: 74,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#4f46e5",
  color: "white",
  fontSize: 42,
  fontWeight: 800,
};

const previewPanelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: 520,
  borderRadius: 28,
  background: "rgba(248,250,252,0.96)",
  color: "#0f172a",
  padding: 28,
  gap: 20,
  boxShadow: "0 28px 80px rgba(15,23,42,0.38)",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const panelTitleStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const statusStyle: CSSProperties = {
  width: 84,
  height: 84,
  borderRadius: 18,
  background: "#dcfce7",
  color: "#166534",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 800,
};

const metricRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  padding: "18px 20px",
};

const metricLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const metricBarStyle: CSSProperties = {
  width: 14,
  height: 54,
  borderRadius: 10,
};

const metrics = [
  ["Inbound receipts", "124", "#2563eb"],
  ["Picking tasks", "318", "#7c3aed"],
  ["Cycle count lines", "1,842", "#0891b2"],
] as const;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={rootStyle}>
        <div style={backdropStyle} />
        <div style={contentStyle}>
          <div style={titleColumnStyle}>
            <div style={logoStyle}>S</div>
            <div style={{ marginTop: 42, fontSize: 72, fontWeight: 800, lineHeight: 1 }}>
              StockMaster WMS
            </div>
            <div style={{ marginTop: 26, fontSize: 30, color: "#cbd5e1", lineHeight: 1.28 }}>
              Inventory, inbound, outbound, picking and reporting in one workspace.
            </div>
          </div>

          <div style={previewPanelStyle}>
            <div style={panelHeaderStyle}>
              <div style={panelTitleStyle}>
                <span style={{ fontSize: 18, color: "#64748b", fontWeight: 700 }}>
                  Warehouse overview
                </span>
                <span style={{ fontSize: 34, fontWeight: 800 }}>98.4% stock accuracy</span>
              </div>
              <div style={statusStyle}>OK</div>
            </div>
            {metrics.map(([label, value, color]) => (
              <div key={label} style={metricRowStyle}>
                <div style={metricLabelStyle}>
                  <span style={{ ...metricBarStyle, background: color }} />
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{label}</span>
                </div>
                <span style={{ fontSize: 30, fontWeight: 800 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
