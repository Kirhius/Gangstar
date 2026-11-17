// Gerado a partir das ilustracoes do mapa (cidade abandonada x cidade construida).
// Base = cidade abandonada; cada predio comprado ganha por cima o recorte da versao construida.
// Ordem: da FRENTE para TRAS. Coordenadas no espaco 1220x1361.

export interface Recorte { x: number; y: number; w: number; h: number }

export interface CamadaPredioMapa {
  id: string;
  predio: Recorte;
  poligono: [number, number][];
}

export const MAPA_W = 1220;
export const MAPA_H = 1361;

export const CAMADAS_MAPA: CamadaPredioMapa[] = [
  {
    id: "boate",
    predio: { x: 753, y: 955, w: 277, h: 307 },
    poligono: [[756, 1018], [882, 958], [1002, 1008], [1026, 1100], [1026, 1198], [895, 1258], [756, 1202]],
  },
  {
    id: "fabrica-bebidas",
    predio: { x: 9, y: 847, w: 267, h: 339 },
    poligono: [[12, 965], [40, 895], [55, 850], [165, 850], [180, 915], [242, 950], [272, 1000], [272, 1105], [140, 1182], [12, 1140]],
  },
  {
    id: "fabrica-armas",
    predio: { x: 927, y: 849, w: 285, h: 327 },
    poligono: [[930, 922], [1065, 852], [1200, 912], [1208, 1105], [1100, 1172], [930, 1120]],
  },
  {
    id: "fabrica-drogas",
    predio: { x: 183, y: 779, w: 273, h: 313 },
    poligono: [[186, 875], [250, 840], [290, 825], [292, 782], [345, 782], [348, 840], [400, 870], [452, 905], [452, 1030], [330, 1088], [186, 1020]],
  },
  {
    id: "fabrica-medicamentos",
    predio: { x: 355, y: 715, w: 281, h: 291 },
    poligono: [[358, 798], [475, 718], [632, 790], [632, 937], [500, 1002], [358, 945]],
  },
  {
    id: "gestao",
    predio: { x: 543, y: 579, w: 274, h: 337 },
    poligono: [[548, 690], [640, 615], [662, 582], [690, 612], [775, 668], [812, 770], [812, 840], [700, 912], [548, 850]],
  },
  {
    id: "loja-bebidas",
    predio: { x: 15, y: 503, w: 266, h: 331 },
    poligono: [[18, 575], [145, 506], [277, 567], [277, 747], [150, 830], [20, 772]],
  },
  {
    id: "loja-farmacia",
    predio: { x: 200, y: 405, w: 261, h: 337 },
    poligono: [[203, 478], [330, 408], [457, 470], [457, 662], [335, 738], [205, 680]],
  },
  {
    id: "loja-armas",
    predio: { x: 933, y: 393, w: 278, h: 327 },
    poligono: [[936, 465], [1062, 396], [1207, 460], [1207, 645], [1095, 716], [936, 652]],
  },
  {
    id: "hotel-1",
    predio: { x: 119, y: 0, w: 430, h: 362 },
    poligono: [[122, 0], [545, 0], [545, 200], [518, 215], [518, 245], [300, 358], [122, 272]],
  },
  {
    id: "hotel-2",
    predio: { x: 830, y: 0, w: 390, h: 306 },
    poligono: [[862, 0], [1220, 0], [1220, 232], [1085, 302], [862, 196]],
  },
  {
    id: "recrutamento",
    predio: { x: 460, y: 171, w: 483, h: 422 },
    poligono: [[467, 445], [605, 378], [605, 280], [705, 204], [721, 204], [816, 280], [816, 378], [941, 448], [717, 584]],
  },
];
