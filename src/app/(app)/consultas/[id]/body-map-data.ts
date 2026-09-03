import type { BodySide, BodyView } from "@/types/database";

export type RegionShape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx: number }
  | { kind: "circle"; cx: number; cy: number; r: number };

export interface BodyRegionDef {
  key: string;
  region: string;
  side: BodySide;
  shape: RegionShape;
}

export const VIEW_LABELS: Record<BodyView, string> = {
  anterior: "Anterior",
  posterior: "Posterior",
  lateral_esquerda: "Lateral esquerda",
  lateral_direita: "Lateral direita",
};

export const VIEW_BOX: Record<BodyView, { w: number; h: number }> = {
  anterior: { w: 240, h: 560 },
  posterior: { w: 240, h: 560 },
  lateral_esquerda: { w: 180, h: 560 },
  lateral_direita: { w: 180, h: 560 },
};

// Regiões decorativas — preenchem a silhueta visualmente, não são clicáveis.
export const DECORATIVE_SHAPES: Record<BodyView, RegionShape[]> = {
  anterior: [{ kind: "rect", x: 84, y: 222, w: 72, h: 34, rx: 14 }],
  posterior: [{ kind: "rect", x: 84, y: 222, w: 72, h: 34, rx: 14 }],
  lateral_esquerda: [],
  lateral_direita: [],
};

function frontBackRegions(mode: "anterior" | "posterior"): BodyRegionDef[] {
  const torsoLabel = mode === "anterior" ? "Peito" : "Dorsal";
  const bellyLabel = mode === "anterior" ? "Abdómen" : "Lombar";
  const hipLabel = mode === "anterior" ? "Anca" : "Glúteo";
  const shinLabel = mode === "anterior" ? "Perna" : "Gémeo";

  const shared: BodyRegionDef[] = [
    { key: "cabeca", region: "Cabeça", side: "central", shape: { kind: "ellipse", cx: 120, cy: 38, rx: 28, ry: 32 } },
    { key: "cervical", region: "Cervical", side: "central", shape: { kind: "rect", x: 106, y: 66, w: 28, h: 20, rx: 6 } },
    { key: "torso", region: torsoLabel, side: "central", shape: { kind: "rect", x: 82, y: 86, w: 76, h: 80, rx: 14 } },
    { key: "belly", region: bellyLabel, side: "central", shape: { kind: "rect", x: 90, y: 166, w: 60, h: 56, rx: 10 } },

    { key: "ombro-e", region: "Ombro", side: "esquerdo", shape: { kind: "ellipse", cx: 58, cy: 96, rx: 24, ry: 18 } },
    { key: "ombro-d", region: "Ombro", side: "direito", shape: { kind: "ellipse", cx: 182, cy: 96, rx: 24, ry: 18 } },

    { key: "braco-e", region: "Braço", side: "esquerdo", shape: { kind: "rect", x: 40, y: 110, w: 20, h: 86, rx: 10 } },
    { key: "braco-d", region: "Braço", side: "direito", shape: { kind: "rect", x: 180, y: 110, w: 20, h: 86, rx: 10 } },

    { key: "cotovelo-e", region: "Cotovelo", side: "esquerdo", shape: { kind: "circle", cx: 50, cy: 202, r: 13 } },
    { key: "cotovelo-d", region: "Cotovelo", side: "direito", shape: { kind: "circle", cx: 190, cy: 202, r: 13 } },

    { key: "antebraco-e", region: "Antebraço", side: "esquerdo", shape: { kind: "rect", x: 40, y: 212, w: 18, h: 78, rx: 9 } },
    { key: "antebraco-d", region: "Antebraço", side: "direito", shape: { kind: "rect", x: 182, y: 212, w: 18, h: 78, rx: 9 } },

    { key: "mao-e", region: "Mão", side: "esquerdo", shape: { kind: "ellipse", cx: 49, cy: 300, rx: 15, ry: 19 } },
    { key: "mao-d", region: "Mão", side: "direito", shape: { kind: "ellipse", cx: 191, cy: 300, rx: 15, ry: 19 } },

    { key: "anca-e", region: hipLabel, side: "esquerdo", shape: { kind: "circle", cx: 96, cy: 250, r: 16 } },
    { key: "anca-d", region: hipLabel, side: "direito", shape: { kind: "circle", cx: 144, cy: 250, r: 16 } },

    { key: "coxa-e", region: "Coxa", side: "esquerdo", shape: { kind: "rect", x: 84, y: 266, w: 28, h: 108, rx: 13 } },
    { key: "coxa-d", region: "Coxa", side: "direito", shape: { kind: "rect", x: 128, y: 266, w: 28, h: 108, rx: 13 } },

    { key: "joelho-e", region: "Joelho", side: "esquerdo", shape: { kind: "circle", cx: 98, cy: 382, r: 15 } },
    { key: "joelho-d", region: "Joelho", side: "direito", shape: { kind: "circle", cx: 142, cy: 382, r: 15 } },

    { key: "perna-e", region: shinLabel, side: "esquerdo", shape: { kind: "rect", x: 86, y: 398, w: 22, h: 92, rx: 10 } },
    { key: "perna-d", region: shinLabel, side: "direito", shape: { kind: "rect", x: 132, y: 398, w: 22, h: 92, rx: 10 } },

    { key: "pe-e", region: "Pé", side: "esquerdo", shape: { kind: "ellipse", cx: 97, cy: 508, rx: 17, ry: 13 } },
    { key: "pe-d", region: "Pé", side: "direito", shape: { kind: "ellipse", cx: 143, cy: 508, rx: 17, ry: 13 } },
  ];

  if (mode === "posterior") {
    shared.push(
      { key: "omoplata-e", region: "Omoplata", side: "esquerdo", shape: { kind: "ellipse", cx: 100, cy: 112, rx: 15, ry: 20 } },
      { key: "omoplata-d", region: "Omoplata", side: "direito", shape: { kind: "ellipse", cx: 140, cy: 112, rx: 15, ry: 20 } }
    );
  }

  return shared;
}

function lateralRegions(view: "lateral_esquerda" | "lateral_direita"): BodyRegionDef[] {
  const side: BodySide = view === "lateral_esquerda" ? "esquerdo" : "direito";
  return [
    { key: "cabeca", region: "Cabeça", side: "central", shape: { kind: "circle", cx: 90, cy: 38, r: 30 } },
    { key: "cervical", region: "Cervical", side: "central", shape: { kind: "rect", x: 76, y: 66, w: 28, h: 20, rx: 6 } },
    { key: "ombro", region: "Ombro", side, shape: { kind: "ellipse", cx: 48, cy: 100, rx: 20, ry: 16 } },
    { key: "braco", region: "Braço", side, shape: { kind: "rect", x: 30, y: 114, w: 20, h: 84, rx: 10 } },
    { key: "toracica", region: "Torácica", side: "central", shape: { kind: "rect", x: 60, y: 86, w: 60, h: 90, rx: 14 } },
    { key: "lombar", region: "Lombar", side: "central", shape: { kind: "rect", x: 62, y: 176, w: 56, h: 56, rx: 10 } },
    { key: "anca", region: "Anca", side, shape: { kind: "circle", cx: 90, cy: 246, r: 18 } },
    { key: "coxa", region: "Coxa", side, shape: { kind: "rect", x: 74, y: 264, w: 32, h: 108, rx: 14 } },
    { key: "joelho", region: "Joelho", side, shape: { kind: "circle", cx: 90, cy: 380, r: 16 } },
    { key: "perna", region: "Perna", side, shape: { kind: "rect", x: 76, y: 396, w: 28, h: 92, rx: 12 } },
    { key: "pe", region: "Pé", side, shape: { kind: "ellipse", cx: 90, cy: 506, rx: 20, ry: 14 } },
  ];
}

export const BODY_REGIONS: Record<BodyView, BodyRegionDef[]> = {
  anterior: frontBackRegions("anterior"),
  posterior: frontBackRegions("posterior"),
  lateral_esquerda: lateralRegions("lateral_esquerda"),
  lateral_direita: lateralRegions("lateral_direita"),
};

// Escala de dor (§8 do documento de arquitetura) — mesma cor no mapa e no slider.
export function painColor(intensity: number): string {
  if (intensity <= 0) return "#4c9a6a";
  if (intensity <= 3) return "#8fb84c";
  if (intensity <= 6) return "#d9a441";
  if (intensity <= 9) return "#d9713f";
  return "#a5333f";
}

export const SYMPTOM_TYPE_LABELS: Record<string, string> = {
  dor: "Dor",
  rigidez: "Rigidez",
  limitacao_movimento: "Limitação de movimento",
  formigueiro: "Formigueiro",
  dormencia: "Dormência",
  fraqueza: "Fraqueza",
  outro: "Outro",
};

export const PAIN_TYPE_LABELS: Record<string, string> = {
  dor: "Dor",
  pressao: "Pressão",
  queimacao: "Queimação",
  formigueiro: "Formigueiro",
  dormencia: "Dormência",
  rigidez: "Rigidez",
  outro: "Outro",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  constante: "Constante",
  intermitente: "Intermitente",
};

export const SIDE_LABELS: Record<string, string> = {
  esquerdo: "Esquerdo",
  direito: "Direito",
  bilateral: "Bilateral",
  central: "Central",
};
