import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.profissional.nome} — ${site.profissional.assinatura}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagem de compartilhamento (Open Graph) gerada com a identidade do site. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#15120f",
          color: "#faf7f2",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 999,
            border: "2px solid #c3a06a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#c3a06a",
            fontSize: 62,
          }}
        >
          KW
        </div>
        <div style={{ marginTop: 44, fontSize: 76 }}>{site.profissional.nome}</div>
        <div style={{ marginTop: 14, fontSize: 26, letterSpacing: 8, color: "#c3a06a", textTransform: "uppercase" }}>
          {site.profissional.assinatura}
        </div>
        <div style={{ marginTop: 40, fontSize: 26, color: "rgba(250,247,242,0.65)" }}>
          {site.endereco.cidade} · {site.endereco.uf} — agende online
        </div>
      </div>
    ),
    size,
  );
}
