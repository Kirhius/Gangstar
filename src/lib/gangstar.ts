// Gangstar: modo "construcao de imperio do crime", totalmente separado do engine do FutOnze.
// Fase 1 (MVP): personagem, terrenos vazios da cidade, roubos solo progressivos,
// mercado negro de armas, prisao/fianca e ranking PvE contra gangues de IA.
// Fase 2: construcao de predios nos lotes (fabricas, loja, boate, hotel, gestao) que
// rendem dinheiro com o tempo, e os servicos da Cidade (hospital, banco com CDI,
// escola, academia e boates) ficam funcionais.
// Fase 3: crew de NPCs contratados (roubos em equipe), gangues rivais de IA com
// territorio (guerra de zonas), mercado negro dinamico + eventos aleatorios da cidade,
// e Prestigio (reset voluntario por um bonus permanente).
// Mapa v6: a cidade e uma ilustracao fixa com 11 predios abandonados a venda; cada um
// tem uma funcao definida (hotel, loja, fabrica, boate, gestao) e ao comprar ele ja vem
// construido (nao existe mais lote vazio nem expansao de quarteiroes).
// Tudo isolado em sua propria chave de save, suas proprias classes e seu proprio RNG
// (nao reaproveita o engine nem o rng do jogo de futebol).

import { ITENS, ITENS_RAROS, RARIDADES, ehConsumivel, itemPorId, itensDaFabrica, type FabricaItem, type ItemDef, type Raridade, type TipoBonusEspecial } from "./gangstarItens";

const CHAVE_GANGSTAR = "gangstar:save:v10";
const CHAVE_GANGSTAR_V9 = "gangstar:save:v9";
const CHAVE_GANGSTAR_V8 = "gangstar:save:v8";
const CHAVE_GANGSTAR_V7 = "gangstar:save:v7";
const CHAVE_GANGSTAR_V6 = "gangstar:save:v6";
const CHAVE_GANGSTAR_V5 = "gangstar:save:v5";

// ---------- Tipos ----------

export type ClasseId = "assaltante" | "empresario" | "matador" | "traficante";

export interface Atributos {
  forca: number;
  inteligencia: number;
  resistencia: number;
  carisma: number;
}

export interface Personagem {
  nome: string;
  classe: ClasseId;
  gangue: string | null;
  nivel: number;
  xp: number;
  atributos: Atributos;
  vida: number;
  vidaMax: number;
  energia: number;
  energiaMax: number;
  vicio: number;
  dinheiro: number;
  respeito: number;
  armas: string[];
  armaEquipada: string | null;
  vezesPreso: number;
  // preso (ou internado no hospital, com hospital: true): nao pode jogar ate "ate"
  preso: { ate: number; motimFalhou?: boolean; hospital?: boolean } | null;
  banco: { saldo: number };
}

export interface PredioInstancia {
  tipo: TipoPredio;
  nivel: number;
  construidoEm: number;
  ultimaColeta: number;
  // fabricas: item que esta sendo produzido (id em ITENS) na linha 1
  produto?: string;
  // fabricas: linhas de producao extras (2 a 5), liberadas a cada 2 niveis
  linhas?: { produto?: string; ultimaColeta: number }[];
  // lojas: estoque a venda (chave "id@qualidade"), caixa acumulado e ultima simulacao
  estoque?: Record<string, number>;
  caixa?: number;
  ultimaVenda?: number;
  vendidosHoje?: { dia: string; qtd: number };
}

export type Especialidade = "atirador" | "motorista" | "hacker" | "negociador";

export interface MembroCrew {
  id: string;
  nome: string;
  especialidade: Especialidade;
  nivel: number;
  xp: number;
  lealdade: number;
}

export interface EventoAtivo {
  id: string;
  expiraEm: number;
}

export interface TreinosDia {
  data: string;
  escola: number;
  academia: number;
}

export interface ExtorsaoInstancia {
  conquistadoEm: number;
  ultimaColeta: number;
}

// Bandidos da gangue (contratados no Ponto de Recrutamento, o coreto do mapa)
export type ClasseBandido = "assaltante" | "piloto" | "contrabandista";

export interface Bandido {
  id: string;
  nome: string;
  classe: ClasseBandido;
  nivel: number;
  poder: number;
  lealdade: number;
  contratadoEm: number;
  // v4.62: xp ganho nos roubos em equipe (sobe de nivel e de poder)
  xp?: number;
}

export interface OcorrenciaGangue {
  quando: number;
  texto: string;
}

export interface EquipamentoExtra {
  colete: string | null;
  especial: string | null;
  // usos restantes de cada item raro (quebra no zero; conserta no Mercado Negro)
  durabilidade?: Record<string, number>;
}

export interface Navio {
  id: string;
  destino: string;
  emoji: string;
  partida: number;
  chegada: number;
  recompensa: number;
  respeito: number;
  risco: number;
}

export interface TorneioPoker {
  dia: string;
  fichas: number;
  maos: number;
  terminado: boolean;
  posicao: number;
  premio: number;
}

export interface GangstarSave {
  versao: 10;
  criadoEm: number;
  ultimaAtualizacao: number;
  // sobra de tempo (ms) que ainda nao virou ponto de energia/vida/vicio
  regenResto?: { energia: number; vida: number; vicio: number };
  // carteira na bolsa de valores: quantidade e preco medio por acao
  acoes?: Record<string, { qtd: number; precoMedio: number }>;
  // temporada mensal: mes atual ("2026-11"), trofeus ganhos e o resultado da ultima temporada
  temporada?: { mes: string };
  trofeus?: Trofeu[];
  ultimaTemporada?: { mes: string; posicao: number; titulo: string | null; respeito: number; visto: boolean };
  // centavos de juros do banco que ainda nao viraram real (o jogo atualiza a cada 10s)
  jurosResto?: number;
  // ultima vez que a lealdade dos bandidos caiu (1 ponto a cada 3h)
  quedaLealdadeEm?: number;
  personagem: Personagem;
  // chave = id do predio no mapa (ver PREDIOS_CIDADE)
  predios: Record<string, PredioInstancia>;
  crew: MembroCrew[];
  territorios: Record<string, string>;
  eventoAtivo: EventoAtivo | null;
  prestigio: number;
  treinosHoje: TreinosDia;
  // estabelecimentos extorquidos (chave = id em EXTORSOES)
  extorsoes: Record<string, ExtorsaoInstancia>;
  bandidos: Bandido[];
  // historico de mortes, prisoes e traicoes dos bandidos (mais recente primeiro)
  registroGangue: OcorrenciaGangue[];
  // itens (chave "id@qualidade" -> quantidade; qualidade 1 a 5 estrelas)
  inventario: Record<string, number>;
  // slots extras do Perfil (a arma continua em personagem.armaEquipada)
  equipamento: EquipamentoExtra;
  // compras feitas na visita atual do Mercador
  mercador: { visita: string; comprados: Record<string, number> };
  // contratos do Porto concluidos na janela atual e navios em viagem
  porto: { janela: number; concluidos: string[]; navios: Navio[] };
  // alvos de emboscada atacados na janela atual e o capo da semana
  emboscadas: {
    janela: number;
    feitas: string[];
    // capo da semana: dano acumulado na semana, vida total e a batalha em andamento (3 rodadas)
    capo: { semana: string; derrotado: boolean; dano?: number; vidaMax?: number; batalha?: BatalhaCapo | null };
  };
  cassino: { jackpot: number; torneio: TorneioPoker | null };
  agiota: { divida: number; venceEm: number } | null;
  // contadores para missoes e conquistas
  estatisticas: Record<string, number>;
  historia: { capitulo: number; caminho?: CaminhoHistoria };
  conquistas: string[];
}

// ---------- Eventos diarios (dia da semana real) ----------

export type EventoDiarioId = "academia-dobro" | "escola-dobro" | "lucro" | "recuperacao" | "operacao-policial" | "noite-boate" | "domingo-tranquilo";

export interface EventoDiarioDef {
  id: EventoDiarioId;
  dia: string;
  nome: string;
  emoji: string;
  descricao: string;
}

// indice = Date.getDay() (0 = domingo)
const EVENTOS_DIARIOS: EventoDiarioDef[] = [
  { id: "domingo-tranquilo", dia: "Domingo", nome: "Domingo tranquilo", emoji: "😴", descricao: "Polícia de folga: metade da chance de ser preso." },
  { id: "academia-dobro", dia: "Segunda", nome: "Academia 2x", emoji: "🏋️", descricao: "Treinos na academia dão o dobro de XP e de força." },
  { id: "escola-dobro", dia: "Terça", nome: "Escola 2x", emoji: "🎓", descricao: "Estudos na escola dão o dobro de XP e de intelecto." },
  { id: "lucro", dia: "Quarta", nome: "Coleta +20%", emoji: "💰", descricao: "Dinheiro coletado (prédios e extorsões) rende 20% a mais." },
  { id: "recuperacao", dia: "Quinta", nome: "Regeneração 2x", emoji: "💚", descricao: "Energia, vida e vício se recuperam no dobro da velocidade." },
  { id: "operacao-policial", dia: "Sexta", nome: "Operação policial", emoji: "🚨", descricao: "Operação na cidade: chance de ser preso em dobro." },
  { id: "noite-boate", dia: "Sábado", nome: "Noite da boate", emoji: "🪩", descricao: "Sua boate recebe o dobro de clientes." },
];

// os 7 dias, de segunda a domingo (para o pop-up do cabecalho)
export function eventosDaSemana(): EventoDiarioDef[] {
  return [1, 2, 3, 4, 5, 6, 0].map((i) => EVENTOS_DIARIOS[i]);
}

export function eventoDiario(data: Date = new Date()): EventoDiarioDef {
  return EVENTOS_DIARIOS[data.getDay()];
}

function eventoDiarioAtivo(id: EventoDiarioId): boolean {
  return eventoDiario().id === id;
}

// multiplicador da chance de prisao conforme o dia
export function fatorPrisaoDoDia(): number {
  const id = eventoDiario().id;
  if (id === "operacao-policial") return 2;
  if (id === "domingo-tranquilo") return 0.5;
  return 1;
}

function fatorColetaDoDia(): number {
  return eventoDiarioAtivo("lucro") ? 1.2 : 1;
}

// ---------- Classes jogaveis ----------

export const CLASSES: Record<ClasseId, { nome: string; emoji: string; descricao: string }> = {
  assaltante: { nome: "Assaltante", emoji: "🔪", descricao: "+15% na grana dos roubos solo." },
  empresario: { nome: "Empresário", emoji: "💼", descricao: "-10% no preço dos terrenos da cidade." },
  matador: { nome: "Matador", emoji: "🎯", descricao: "+15% de poder nos roubos." },
  traficante: { nome: "Traficante", emoji: "💊", descricao: "-10% no preço das armas do mercado negro." },
};

// ---------- Armas (mercado negro) ----------

export interface Arma {
  id: string;
  nome: string;
  emoji: string;
  preco: number;
  poder: number;
}

export const ARMAS: Arma[] = [
  { id: "faca", nome: "Faca", emoji: "🔪", preco: 150, poder: 3 },
  { id: "soqueira", nome: "Soqueira de Latão", emoji: "👊", preco: 300, poder: 5 },
  { id: "revolver", nome: "Revólver .38", emoji: "🔫", preco: 900, poder: 10 },
  { id: "pistola", nome: "Pistola 9mm", emoji: "🔫", preco: 2200, poder: 18 },
  { id: "espingarda", nome: "Espingarda Serrada", emoji: "💥", preco: 5000, poder: 30 },
  { id: "rifle", nome: "Fuzil de Assalto", emoji: "🧨", preco: 12000, poder: 48 },
];

// ---------- Prédios (construção nos lotes da cidade) ----------

export type TipoPredio =
  | "recrutamento"
  | "hotel"
  | "loja-bebidas"
  | "loja-farmacia"
  | "loja-armas"
  | "fabrica-bebidas"
  | "fabrica-drogas"
  | "fabrica-medicamentos"
  | "fabrica-armas"
  | "boate"
  | "gestao";

export interface PredioDef {
  tipo: TipoPredio;
  nome: string;
  emoji: string;
  corTema: string;
  custoConstrucao: number;
  rendaPorHora: number;
  estoqueMaxHoras: number;
  unico?: boolean;
}

export const PREDIOS: Record<TipoPredio, PredioDef> = {
  "fabrica-armas": { tipo: "fabrica-armas", nome: "Fábrica de Armas", emoji: "⚙️", corTema: "#e04b4b", custoConstrucao: 3000, rendaPorHora: 0, estoqueMaxHoras: 12 },
  "fabrica-bebidas": { tipo: "fabrica-bebidas", nome: "Destilaria", emoji: "🍺", corTema: "#4caf7a", custoConstrucao: 2000, rendaPorHora: 0, estoqueMaxHoras: 12 },
  "fabrica-drogas": { tipo: "fabrica-drogas", nome: "Fábrica de Drogas", emoji: "🧪", corTema: "#a259ff", custoConstrucao: 4000, rendaPorHora: 0, estoqueMaxHoras: 12 },
  "fabrica-medicamentos": { tipo: "fabrica-medicamentos", nome: "Fábrica de Medicamentos", emoji: "💊", corTema: "#8be9ff", custoConstrucao: 3000, rendaPorHora: 0, estoqueMaxHoras: 12 },
  "loja-bebidas": { tipo: "loja-bebidas", nome: "Loja de Bebidas", emoji: "🍾", corTema: "#ffb020", custoConstrucao: 1200, rendaPorHora: 0, estoqueMaxHoras: 12 },
  "loja-farmacia": { tipo: "loja-farmacia", nome: "Drogaria", emoji: "💉", corTema: "#4caf7a", custoConstrucao: 1400, rendaPorHora: 0, estoqueMaxHoras: 12 },
  "loja-armas": { tipo: "loja-armas", nome: "Loja de Armas", emoji: "🔫", corTema: "#e04b4b", custoConstrucao: 1800, rendaPorHora: 0, estoqueMaxHoras: 12 },
  boate: { tipo: "boate", nome: "Boate", emoji: "🪩", corTema: "#ff4fd8", custoConstrucao: 3500, rendaPorHora: 0, estoqueMaxHoras: 12 },
  hotel: { tipo: "hotel", nome: "Hotel", emoji: "🏨", corTema: "#3ab0ff", custoConstrucao: 6000, rendaPorHora: 320, estoqueMaxHoras: 12 },
  recrutamento: { tipo: "recrutamento", nome: "Ponto de Recrutamento", emoji: "🎯", corTema: "#8be9ff", custoConstrucao: 6000, rendaPorHora: 0, estoqueMaxHoras: 0, unico: true },
  gestao: { tipo: "gestao", nome: "Prédio de Gestão", emoji: "🏢", corTema: "#fff0c2", custoConstrucao: 5000, rendaPorHora: 0, estoqueMaxHoras: 0, unico: true },
};

export function ehFabrica(tipo: TipoPredio): boolean {
  return tipo === "fabrica-armas" || tipo === "fabrica-bebidas" || tipo === "fabrica-drogas" || tipo === "fabrica-medicamentos";
}

// fabricas evoluem ate o nivel 10 (cada nivel libera um produto); os demais ate o 3
export function nivelMaxPredio(tipo: TipoPredio): number {
  return ehFabrica(tipo) ? 10 : 3;
}

export function custoUpgrade(tipo: TipoPredio, nivelAtual: number): number {
  // v4.61: evoluir ficou 3x mais caro
  if (ehFabrica(tipo)) return Math.round((PREDIOS[tipo].custoConstrucao * Math.pow(nivelAtual, 1.45) * 2.7) / 50) * 50;
  return Math.round((PREDIOS[tipo].custoConstrucao * nivelAtual * 2.4) / 50) * 50;
}

// Os 11 predios do mapa da cidade. A ordem e so de referencia (o desenho usa os ids).
export interface PredioCidade {
  id: string;
  tipo: TipoPredio;
}

export const PREDIOS_CIDADE: PredioCidade[] = [
  { id: "hotel-1", tipo: "hotel" },
  { id: "hotel-2", tipo: "hotel" },
  { id: "loja-bebidas", tipo: "loja-bebidas" },
  { id: "loja-farmacia", tipo: "loja-farmacia" },
  { id: "loja-armas", tipo: "loja-armas" },
  { id: "fabrica-bebidas", tipo: "fabrica-bebidas" },
  { id: "fabrica-drogas", tipo: "fabrica-drogas" },
  { id: "fabrica-medicamentos", tipo: "fabrica-medicamentos" },
  { id: "gestao", tipo: "gestao" },
  { id: "boate", tipo: "boate" },
  { id: "fabrica-armas", tipo: "fabrica-armas" },
  { id: "recrutamento", tipo: "recrutamento" },
];

// preco de compra do predio abandonado (ja reformado e funcionando)
export function precoPredio(save: GangstarSave, predioId: string): number {
  const slot = PREDIOS_CIDADE.find((p) => p.id === predioId);
  if (!slot) return 0;
  const desconto = save.personagem.classe === "empresario" ? 0.9 : 1;
  return Math.round((PREDIOS[slot.tipo].custoConstrucao * 1.25 * desconto) / 10) * 10;
}

export function predioDoLote(save: GangstarSave, predioId: string): PredioInstancia | null {
  return save.predios[predioId] ?? null;
}

export function temGestaoConstruida(save: GangstarSave): boolean {
  return Object.values(save.predios).some((p) => p.tipo === "gestao");
}

export function producaoPendente(instancia: PredioInstancia, save?: GangstarSave): number {
  const def = PREDIOS[instancia.tipo];
  if (def.rendaPorHora <= 0) return 0;
  const horas = Math.min(def.estoqueMaxHoras, (Date.now() - instancia.ultimaColeta) / 3600000);
  let bruto = horas * def.rendaPorHora * instancia.nivel;
  if (save) {
    bruto *= 1 + bonusZonasProducao(save);
    if (instancia.tipo === "fabrica-drogas" && eventoEstaAtivo(save, "escassez-droga")) bruto *= 3;
  }
  return Math.floor(bruto * fatorColetaDoDia() * (save ? fatorContrabando(save) : 1));
}

// quanto a cidade inteira rende por hora (soma dos predios, com bonus de territorio e evento)
export function rendaPorHoraCidade(save: GangstarSave): number {
  return Math.floor(
    Object.values(save.predios).reduce((soma, inst) => {
      const def = PREDIOS[inst.tipo];
      let r = def.rendaPorHora * inst.nivel * (1 + bonusZonasProducao(save));
      if (inst.tipo === "fabrica-drogas" && eventoEstaAtivo(save, "escassez-droga")) r *= 3;
      return soma + r;
    }, 0) * fatorContrabando(save),
  );
}

export function producaoTotalPendente(save: GangstarSave): number {
  return Object.values(save.predios).reduce((soma, inst) => soma + producaoPendente(inst, save), 0);
}

// ---------- Roubos (lista progressiva) ----------

export interface Roubo {
  id: string;
  nome: string;
  emoji: string;
  nivelMin: number;
  energiaCusto: number;
  dificuldade: number;
  dinheiroMin: number;
  dinheiroMax: number;
  respeito: number;
  xp: number;
  chancePrisaoBase: number;
  prisaoMinutos: number;
  fiancaBase: number;
}

const ROUBOS_BASE: Roubo[] = [
  { id: "carteira", nome: "Roubar carteira de pedestre", emoji: "👛", nivelMin: 1, energiaCusto: 4, dificuldade: 6, dinheiroMin: 30, dinheiroMax: 70, respeito: 2, xp: 15, chancePrisaoBase: 0.14, prisaoMinutos: 2, fiancaBase: 80 },
  { id: "celular", nome: "Furtar celular no metrô", emoji: "📱", nivelMin: 1, energiaCusto: 5, dificuldade: 9, dinheiroMin: 45, dinheiroMax: 110, respeito: 3, xp: 20, chancePrisaoBase: 0.16, prisaoMinutos: 3, fiancaBase: 110 },
  { id: "conveniencia", nome: "Furtar loja de conveniência", emoji: "🏪", nivelMin: 1, energiaCusto: 6, dificuldade: 12, dinheiroMin: 70, dinheiroMax: 150, respeito: 4, xp: 25, chancePrisaoBase: 0.18, prisaoMinutos: 4, fiancaBase: 150 },
  { id: "bilhete", nome: "Golpe do bilhete premiado", emoji: "🎟️", nivelMin: 5, energiaCusto: 14, dificuldade: 16, dinheiroMin: 110, dinheiroMax: 240, respeito: 5, xp: 32, chancePrisaoBase: 0.19, prisaoMinutos: 5, fiancaBase: 220 },
  { id: "posto", nome: "Assaltar posto de gasolina", emoji: "⛽", nivelMin: 5, energiaCusto: 16, dificuldade: 19, dinheiroMin: 150, dinheiroMax: 300, respeito: 7, xp: 40, chancePrisaoBase: 0.2, prisaoMinutos: 6, fiancaBase: 280 },
  { id: "farmacia", nome: "Assaltar farmácia", emoji: "💊", nivelMin: 7, energiaCusto: 18, dificuldade: 23, dinheiroMin: 200, dinheiroMax: 420, respeito: 9, xp: 50, chancePrisaoBase: 0.22, prisaoMinutos: 8, fiancaBase: 380 },
  { id: "carro", nome: "Roubar carro", emoji: "🚗", nivelMin: 7, energiaCusto: 22, dificuldade: 27, dinheiroMin: 280, dinheiroMax: 550, respeito: 12, xp: 65, chancePrisaoBase: 0.23, prisaoMinutos: 10, fiancaBase: 500 },
  { id: "caixa", nome: "Assaltar caixa eletrônico", emoji: "🏧", nivelMin: 9, energiaCusto: 26, dificuldade: 36, dinheiroMin: 550, dinheiroMax: 1100, respeito: 18, xp: 100, chancePrisaoBase: 0.25, prisaoMinutos: 15, fiancaBase: 900 },
  { id: "eletronicos", nome: "Assaltar loja de eletrônicos", emoji: "📺", nivelMin: 9, energiaCusto: 28, dificuldade: 40, dinheiroMin: 700, dinheiroMax: 1400, respeito: 22, xp: 120, chancePrisaoBase: 0.26, prisaoMinutos: 18, fiancaBase: 1100 },
  { id: "joalheria", nome: "Assaltar joalheria", emoji: "💎", nivelMin: 10, energiaCusto: 32, dificuldade: 46, dinheiroMin: 1100, dinheiroMax: 2300, respeito: 28, xp: 160, chancePrisaoBase: 0.28, prisaoMinutos: 25, fiancaBase: 1800 },
  { id: "sequestro-relampago", nome: "Sequestro relâmpago", emoji: "🕶️", nivelMin: 10, energiaCusto: 34, dificuldade: 50, dinheiroMin: 1300, dinheiroMax: 2700, respeito: 32, xp: 180, chancePrisaoBase: 0.3, prisaoMinutos: 30, fiancaBase: 2200 },
  { id: "banco-local", nome: "Assaltar banco local", emoji: "🏦", nivelMin: 13, energiaCusto: 38, dificuldade: 58, dinheiroMin: 2400, dinheiroMax: 4800, respeito: 42, xp: 250, chancePrisaoBase: 0.3, prisaoMinutos: 40, fiancaBase: 3500 },
  { id: "blindado", nome: "Assaltar carro-forte", emoji: "🚐", nivelMin: 15, energiaCusto: 40, dificuldade: 62, dinheiroMin: 2600, dinheiroMax: 5200, respeito: 38, xp: 220, chancePrisaoBase: 0.3, prisaoMinutos: 35, fiancaBase: 3000 },
  { id: "mansao", nome: "Assaltar mansão de luxo", emoji: "🏰", nivelMin: 15, energiaCusto: 42, dificuldade: 66, dinheiroMin: 3200, dinheiroMax: 6400, respeito: 45, xp: 260, chancePrisaoBase: 0.31, prisaoMinutos: 45, fiancaBase: 4200 },
  { id: "carga", nome: "Roubo de carga (caminhão)", emoji: "🚚", nivelMin: 18, energiaCusto: 48, dificuldade: 76, dinheiroMin: 5000, dinheiroMax: 10000, respeito: 60, xp: 380, chancePrisaoBase: 0.32, prisaoMinutos: 60, fiancaBase: 7000 },
  { id: "galeria", nome: "Roubar galeria de arte", emoji: "🖼️", nivelMin: 18, energiaCusto: 46, dificuldade: 72, dinheiroMin: 4500, dinheiroMax: 9000, respeito: 55, xp: 340, chancePrisaoBase: 0.32, prisaoMinutos: 55, fiancaBase: 6000 },
  { id: "trem", nome: "Assaltar trem de carga", emoji: "🚆", nivelMin: 20, energiaCusto: 50, dificuldade: 82, dinheiroMin: 9000, dinheiroMax: 18000, respeito: 80, xp: 480, chancePrisaoBase: 0.32, prisaoMinutos: 75, fiancaBase: 9000 },
  { id: "banco-central", nome: "Assaltar o Banco Central", emoji: "🏛️", nivelMin: 22, energiaCusto: 66, dificuldade: 100, dinheiroMin: 12000, dinheiroMax: 24000, respeito: 100, xp: 600, chancePrisaoBase: 0.38, prisaoMinutos: 120, fiancaBase: 15000 },
  { id: "cassino-solo", nome: "Limpar o cofre do cassino", emoji: "🎲", nivelMin: 22, energiaCusto: 60, dificuldade: 92, dinheiroMin: 10000, dinheiroMax: 20000, respeito: 90, xp: 540, chancePrisaoBase: 0.36, prisaoMinutos: 100, fiancaBase: 12000 },
  { id: "reserva-federal", nome: "Invadir a Reserva Federal", emoji: "🔐", nivelMin: 23, energiaCusto: 75, dificuldade: 120, dinheiroMin: 20000, dinheiroMax: 40000, respeito: 150, xp: 900, chancePrisaoBase: 0.4, prisaoMinutos: 150, fiancaBase: 20000 },
  { id: "falso-pix", nome: "Golpe do falso PIX", emoji: "📲", nivelMin: 5, energiaCusto: 14, dificuldade: 17, dinheiroMin: 130, dinheiroMax: 260, respeito: 5, xp: 34, chancePrisaoBase: 0.18, prisaoMinutos: 5, fiancaBase: 230 },
  { id: "moto", nome: "Roubar moto esportiva", emoji: "🏍️", nivelMin: 7, energiaCusto: 20, dificuldade: 25, dinheiroMin: 240, dinheiroMax: 480, respeito: 10, xp: 58, chancePrisaoBase: 0.22, prisaoMinutos: 9, fiancaBase: 450 },
  { id: "cambio-solo", nome: "Assaltar casa de câmbio", emoji: "💱", nivelMin: 13, energiaCusto: 36, dificuldade: 54, dinheiroMin: 1900, dinheiroMax: 3800, respeito: 38, xp: 220, chancePrisaoBase: 0.29, prisaoMinutos: 35, fiancaBase: 2800 },
  { id: "iate", nome: "Saquear iate no porto", emoji: "🛥️", nivelMin: 20, energiaCusto: 52, dificuldade: 86, dinheiroMin: 8000, dinheiroMax: 16000, respeito: 75, xp: 460, chancePrisaoBase: 0.33, prisaoMinutos: 70, fiancaBase: 8500 },
  { id: "leilao", nome: "Roubar leilão de joias", emoji: "👑", nivelMin: 23, energiaCusto: 70, dificuldade: 112, dinheiroMin: 17000, dinheiroMax: 34000, respeito: 130, xp: 820, chancePrisaoBase: 0.38, prisaoMinutos: 130, fiancaBase: 18000 },
];

// v4.58: roubos solo ficaram 30% mais dificeis e pagam 15% menos dinheiro e respeito
// v4.60: mais um aperto - dificuldade 45% acima da base
export const ROUBOS: Roubo[] = ROUBOS_BASE.map((r) => ({
  ...r,
  dificuldade: Math.round(r.dificuldade * 1.45),
  dinheiroMin: Math.round((r.dinheiroMin * 0.85) / 5) * 5,
  dinheiroMax: Math.round((r.dinheiroMax * 0.85) / 5) * 5,
  respeito: Math.max(1, Math.round(r.respeito * 0.85)),
})).sort((a, b) => a.nivelMin - b.nivelMin || a.dificuldade - b.dificuldade);

// ---------- Gangues rivais de IA, território e ranking PvE (Fase 3) ----------

export type EstiloGangue = "agressiva" | "economica" | "discreta";

export interface GangueRivalDef {
  id: string;
  nome: string;
  estilo: EstiloGangue;
  forcaBase: number;
  respeitoBase: number;
}

export const ESTILOS_GANGUE: Record<EstiloGangue, { nome: string; emoji: string; descricao: string }> = {
  agressiva: { nome: "Agressiva", emoji: "💥", descricao: "Ataca seu território com mais frequência." },
  economica: { nome: "Econômica", emoji: "💰", descricao: "Foca em dominar o mercado negro." },
  discreta: { nome: "Discreta", emoji: "🕵️", descricao: "Raramente ataca, mas é difícil de tomar território dela." },
};

export const GANGUES_RIVAIS: GangueRivalDef[] = [
  { id: "ratos-beco", nome: "Os Ratos de Beco", estilo: "discreta", forcaBase: 20, respeitoBase: 5000 },
  { id: "bonde-viela", nome: "Bonde da Viela", estilo: "agressiva", forcaBase: 32, respeitoBase: 5500 },
  { id: "irmandade-asfalto", nome: "Irmandade do Asfalto", estilo: "agressiva", forcaBase: 45, respeitoBase: 6050 },
  { id: "corvos-cinza", nome: "Corvos Cinza", estilo: "discreta", forcaBase: 58, respeitoBase: 6650 },
  { id: "cartel-sete-estrelas", nome: "Cartel Sete Estrelas", estilo: "economica", forcaBase: 72, respeitoBase: 7300 },
  { id: "punho-vermelho", nome: "Punho Vermelho", estilo: "agressiva", forcaBase: 88, respeitoBase: 8000 },
  { id: "mao-de-ferro", nome: "Mão de Ferro", estilo: "economica", forcaBase: 105, respeitoBase: 8800 },
  { id: "viboras-porto", nome: "Víboras do Porto", estilo: "discreta", forcaBase: 122, respeitoBase: 9700 },
  { id: "lobos-zona-sul", nome: "Os Lobos da Zona Sul", estilo: "agressiva", forcaBase: 140, respeitoBase: 10650 },
  { id: "familia-moretti", nome: "Família Moretti", estilo: "economica", forcaBase: 160, respeitoBase: 11700 },
  { id: "sindicato-prata", nome: "Sindicato Prata", estilo: "discreta", forcaBase: 180, respeitoBase: 12850 },
  { id: "tigres-neon", nome: "Tigres de Neon", estilo: "agressiva", forcaBase: 202, respeitoBase: 14100 },
  { id: "clube-dos-doze", nome: "Clube dos Doze", estilo: "economica", forcaBase: 225, respeitoBase: 15500 },
  { id: "serpentes-jade", nome: "Serpentes de Jade", estilo: "discreta", forcaBase: 250, respeitoBase: 17050 },
  { id: "coroa-negra", nome: "Coroa Negra", estilo: "agressiva", forcaBase: 276, respeitoBase: 18700 },
  { id: "legiao-fantasma", nome: "Legião Fantasma", estilo: "discreta", forcaBase: 305, respeitoBase: 20550 },
  { id: "dinastia-dourada", nome: "Dinastia Dourada", estilo: "economica", forcaBase: 335, respeitoBase: 22600 },
  { id: "horda-norte", nome: "Horda do Norte", estilo: "agressiva", forcaBase: 368, respeitoBase: 24850 },
  { id: "conselho-sombras", nome: "Conselho das Sombras", estilo: "discreta", forcaBase: 405, respeitoBase: 27300 },
  { id: "imperio-escarlate", nome: "Império Escarlate", estilo: "agressiva", forcaBase: 450, respeitoBase: 30000 },
];

// as gangues rivais crescem 1,5% por dia ao longo da temporada (que comeca no dia 1 de cada mes)
function fatorCrescimentoGangues(save: GangstarSave, agora = Date.now()): number {
  const inicio = Math.max(save.criadoEm, inicioDoMes(agora));
  const dias = Math.max(0, (agora - inicio) / 86400000);
  return 1 + dias * 0.015;
}

export function respeitoEfetivo(gang: GangueRivalDef, save: GangstarSave): number {
  return Math.round(gang.respeitoBase * fatorCrescimentoGangues(save));
}

export function forcaEfetiva(gang: GangueRivalDef, save: GangstarSave): number {
  return Math.round(gang.forcaBase * fatorCrescimentoGangues(save) * 10) / 10;
}

export function rankingGangues(save: GangstarSave): { nome: string; respeito: number; voce: boolean }[] {
  const p = save.personagem;
  const rivais = GANGUES_RIVAIS.map((g) => ({ nome: g.nome, respeito: respeitoEfetivo(g, save), voce: false }));
  const jogador = { nome: p.gangue ? `${p.gangue} (você)` : `${p.nome} (você)`, respeito: p.respeito, voce: true };
  return [...rivais, jogador].sort((a, b) => b.respeito - a.respeito);
}

// ---------- Território (zonas da Cidade pública) ----------

export interface ZonaDef {
  id: string;
  nome: string;
  bonusTipo: "desconto-mercado" | "producao-extra";
  bonusValor: number;
  forcaDefesaBase: number;
  donoInicial: string;
}

export const ZONAS_CIDADE: ZonaDef[] = [
  { id: "zona-porto", nome: "Porto Velho", bonusTipo: "desconto-mercado", bonusValor: 0.04, forcaDefesaBase: 10, donoInicial: "ratos-beco" },
  { id: "zona-centro", nome: "Centro", bonusTipo: "producao-extra", bonusValor: 0.05, forcaDefesaBase: 16, donoInicial: "irmandade-asfalto" },
  { id: "zona-industrial", nome: "Distrito Industrial", bonusTipo: "producao-extra", bonusValor: 0.08, forcaDefesaBase: 26, donoInicial: "cartel-sete-estrelas" },
  { id: "zona-docas", nome: "Docas", bonusTipo: "desconto-mercado", bonusValor: 0.06, forcaDefesaBase: 34, donoInicial: "mao-de-ferro" },
  { id: "zona-boemia", nome: "Zona Boêmia", bonusTipo: "producao-extra", bonusValor: 0.07, forcaDefesaBase: 48, donoInicial: "lobos-zona-sul" },
  { id: "zona-financeiro", nome: "Distrito Financeiro", bonusTipo: "desconto-mercado", bonusValor: 0.1, forcaDefesaBase: 62, donoInicial: "sindicato-prata" },
  { id: "zona-alta", nome: "Cidade Alta", bonusTipo: "producao-extra", bonusValor: 0.12, forcaDefesaBase: 78, donoInicial: "coroa-negra" },
];

function territoriosIniciais(): Record<string, string> {
  const t: Record<string, string> = {};
  for (const z of ZONAS_CIDADE) t[z.id] = z.donoInicial;
  return t;
}

export interface ZonaView {
  zona: ZonaDef;
  donoId: string;
  donoNome: string;
  ehJogador: boolean;
  forcaDefesa: number;
}

export function territoriosView(save: GangstarSave): ZonaView[] {
  return ZONAS_CIDADE.map((zona) => {
    const donoId = save.territorios[zona.id] ?? zona.donoInicial;
    if (donoId === "jogador") {
      return { zona, donoId, donoNome: save.personagem.gangue || save.personagem.nome, ehJogador: true, forcaDefesa: 0 };
    }
    const gang = GANGUES_RIVAIS.find((g) => g.id === donoId) ?? GANGUES_RIVAIS[0];
    return { zona, donoId, donoNome: gang.nome, ehJogador: false, forcaDefesa: forcaEfetiva(gang, save) };
  });
}

export function descontoZonasMercado(save: GangstarSave): number {
  const total = ZONAS_CIDADE.filter((z) => save.territorios[z.id] === "jogador" && z.bonusTipo === "desconto-mercado").reduce(
    (soma, z) => soma + z.bonusValor,
    0,
  );
  return Math.min(0.3, total);
}

export function bonusZonasProducao(save: GangstarSave): number {
  const total = ZONAS_CIDADE.filter((z) => save.territorios[z.id] === "jogador" && z.bonusTipo === "producao-extra").reduce(
    (soma, z) => soma + z.bonusValor,
    0,
  );
  return Math.min(0.5, total);
}

function poderCrewBonus(save: GangstarSave): number {
  return save.crew.reduce((soma, m) => soma + m.nivel * 4 + m.lealdade * 0.05, 0);
}

const CUSTO_ENERGIA_ATAQUE = 25;

export type ResultadoAtaqueZona =
  | { tipo: "sucesso"; respeito: number; ocorrencias?: string[] }
  | { tipo: "falha"; ocorrencias?: string[] }
  | { tipo: "falha-preso"; minutos: number; fianca: number; ocorrencias?: string[] };

function atacarZonaBase(save: GangstarSave, zonaId: string): { save: GangstarSave; resultado?: ResultadoAtaqueZona; erro?: string } {
  const zona = ZONAS_CIDADE.find((z) => z.id === zonaId);
  if (!zona) return { save, erro: "Zona não encontrada." };
  const p = save.personagem;
  if (p.preso) return { save, erro: msgBloqueado(p) };
  const donoAtual = save.territorios[zonaId] ?? zona.donoInicial;
  if (donoAtual === "jogador") return { save, erro: "Você já controla essa zona." };
  if (p.energia < CUSTO_ENERGIA_ATAQUE) return { save, erro: "Energia insuficiente." };

  const gang = GANGUES_RIVAIS.find((g) => g.id === donoAtual) ?? GANGUES_RIVAIS[0];
  const forcaDefesa = forcaEfetiva(gang, save) * (gang.estilo === "discreta" ? 1.2 : 1);
  const poderAtaque = poderDeRoubo(save) + poderCrewBonus(save) + poderTotalBandidos(save) * 0.3;
  const chance = Math.max(0.05, Math.min(0.9, 0.5 + (poderAtaque - forcaDefesa) * 0.012));
  const energiaRestante = p.energia - CUSTO_ENERGIA_ATAQUE;

  if (Math.random() < chance) {
    const respeito = 15 + Math.round(zona.forcaDefesaBase / 4);
    const baixas = baixasDeGuerra({ ...save, personagem: { ...p, energia: energiaRestante, respeito: p.respeito + respeito }, territorios: { ...save.territorios, [zonaId]: "jogador" } }, 0.04);
    return {
      save: baixas.save,
      resultado: { tipo: "sucesso", respeito, ocorrencias: baixas.ocorrencias },
    };
  }
  const baixasFalha = baixasDeGuerra(save, 0.12);
  save = baixasFalha.save;

  const chancePrisao = Math.max(0.03, 0.22 - p.atributos.resistencia * 0.003) * fatorPrisaoDoDia() * fatorPiloto(save);
  if (Math.random() < chancePrisao) {
    const minutos = 15 + Math.round(zona.forcaDefesaBase / 3);
    const ate = Date.now() + minutos * 60 * 1000;
    const novoP: Personagem = { ...p, energia: energiaRestante, vezesPreso: p.vezesPreso + 1, preso: { ate } };
    return { save: { ...save, personagem: novoP }, resultado: { tipo: "falha-preso", minutos, fianca: custoFianca(novoP), ocorrencias: baixasFalha.ocorrencias } };
  }

  return { save: { ...save, personagem: { ...p, energia: energiaRestante } }, resultado: { tipo: "falha", ocorrencias: baixasFalha.ocorrencias } };
}

function processarAtaquesIA(save: GangstarSave, decorridoMs: number): GangstarSave {
  const horas = decorridoMs / 3600000;
  if (horas <= 0) return save;
  const territorios = { ...save.territorios };
  let mudou = false;
  for (const zona of ZONAS_CIDADE) {
    if (territorios[zona.id] !== "jogador") continue;
    const gangOriginal = GANGUES_RIVAIS.find((g) => g.id === zona.donoInicial) ?? GANGUES_RIVAIS[0];
    const fatorEstilo = gangOriginal.estilo === "agressiva" ? 1.8 : gangOriginal.estilo === "economica" ? 1 : 0.5;
    const chancePorHora = 0.015 * fatorEstilo;
    const chanceTotal = 1 - Math.pow(1 - chancePorHora, horas);
    if (Math.random() < chanceTotal) {
      territorios[zona.id] = zona.donoInicial;
      mudou = true;
    }
  }
  return mudou ? { ...save, territorios } : save;
}

// ---------- Crew de NPCs contratados (Fase 3) ----------

export const ESPECIALIDADES: Record<Especialidade, { nome: string; emoji: string }> = {
  atirador: { nome: "Atirador", emoji: "🔫" },
  motorista: { nome: "Motorista", emoji: "🚗" },
  hacker: { nome: "Hacker", emoji: "💻" },
  negociador: { nome: "Negociador", emoji: "🗣️" },
};

export interface CandidatoCrew {
  id: string;
  nome: string;
  especialidade: Especialidade;
  custo: number;
}

export const CANDIDATOS_CREW: CandidatoCrew[] = [
  { id: "cand-tony", nome: "Tony Mão Leve", especialidade: "atirador", custo: 1200 },
  { id: "cand-renan", nome: "Renan Veloz", especialidade: "motorista", custo: 1000 },
  { id: "cand-vik", nome: "Vik", especialidade: "hacker", custo: 1800 },
  { id: "cand-dora", nome: "Dora Lábia", especialidade: "negociador", custo: 1400 },
  { id: "cand-bruno", nome: "Bruno Cano Longo", especialidade: "atirador", custo: 2600 },
  { id: "cand-sil", nome: "Sil Rampa", especialidade: "motorista", custo: 2300 },
  { id: "cand-zero", nome: "Zero Cold", especialidade: "hacker", custo: 3200 },
  { id: "cand-marta", nome: "Marta Visto", especialidade: "negociador", custo: 2800 },
];

export function candidatosDisponiveis(save: GangstarSave): CandidatoCrew[] {
  const contratados = new Set(save.crew.map((m) => m.id));
  return CANDIDATOS_CREW.filter((c) => !contratados.has(c.id));
}

export function contratarMembro(save: GangstarSave, candidatoId: string): { save: GangstarSave; erro?: string } {
  const cand = CANDIDATOS_CREW.find((c) => c.id === candidatoId);
  if (!cand) return { save, erro: "Candidato não encontrado." };
  if (save.crew.some((m) => m.id === candidatoId)) return { save, erro: "Esse membro já está na sua crew." };
  if (save.personagem.dinheiro < cand.custo) return { save, erro: "Dinheiro insuficiente." };
  const novoMembro: MembroCrew = { id: cand.id, nome: cand.nome, especialidade: cand.especialidade, nivel: 1, xp: 0, lealdade: 60 };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - cand.custo },
      crew: [...save.crew, novoMembro],
    },
  };
}

export function demitirMembro(save: GangstarSave, membroId: string): GangstarSave {
  return { ...save, crew: save.crew.filter((m) => m.id !== membroId) };
}

function ganharXpMembro(m: MembroCrew, xp: number): MembroCrew {
  const novoXp = m.xp + xp;
  const novoNivel = Math.min(10, 1 + Math.floor(novoXp / 200));
  return { ...m, xp: novoXp, nivel: novoNivel };
}

// ---------- Bandidos da gangue (Ponto de Recrutamento) ----------
//
// Tres classes, cada uma com vantagem e risco:
// - Assaltante: soma poder nos roubos e nas guerras; leva comissao de cada roubo solo e
//   pode morrer nas guerras de gangue.
// - Piloto de fuga: reduz a chance de voce ser preso; pode morrer ou ser preso na fuga
//   quando um roubo da errado.
// - Contrabandista: aumenta o que voce coleta dos predios e extorsoes; pode trair a
//   gangue, sumindo com parte do seu dinheiro (mais provavel com lealdade baixa).
// A lealdade cai com o tempo; pagar um bonus aumenta. Lealdade baixa = risco de traicao.

export interface ClasseBandidoDef {
  id: ClasseBandido;
  nome: string;
  emoji: string;
  vantagem: string;
  risco: string;
}

export const CLASSES_BANDIDO: ClasseBandidoDef[] = [
  { id: "assaltante", nome: "Assaltante", emoji: "🔫", vantagem: "Soma poder nos roubos e nas guerras de gangue.", risco: "Leva comissão de cada roubo e pode morrer nas guerras." },
  { id: "piloto", nome: "Piloto de fuga", emoji: "🏎️", vantagem: "Diminui a chance de você ser preso.", risco: "Pode morrer ou ser preso na fuga quando o roubo dá errado." },
  { id: "contrabandista", nome: "Contrabandista", emoji: "📦", vantagem: "Aumenta o que você coleta dos prédios e extorsões.", risco: "Pode trair a gangue e sumir com parte do seu dinheiro." },
];

export const MAX_BANDIDOS_POR_CLASSE = 5;
const JANELA_CANDIDATOS_MS = 4 * 3600 * 1000;

export interface CandidatoBandido {
  id: string;
  nome: string;
  classe: ClasseBandido;
  nivel: number;
  poder: number;
  custo: number;
  comissao: number;
}

const PRIMEIROS_NOMES = ["Dinho", "Bira", "Neném", "Juca", "Tião", "Rato", "Zeca", "Mosca", "Baiano", "Cabeça", "Guto", "Pelé", "Nando", "Chico", "Sombra", "Lu", "Kiko", "Vavá", "Marreta", "Tuta"];
const APELIDOS = ["da Quebrada", "Navalha", "Pé de Pano", "Fumaça", "Mão de Seda", "Boca Fechada", "Sete Vidas", "Faísca", "do Porto", "Turbo", "Cão Danado", "Fantasma", "Ligeiro", "Liso", "Trovão", "Bicho Solto"];

function rngSemente(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function comissaoBandido(classe: ClasseBandido, nivel: number): number {
  return classe === "assaltante" ? 0.02 + nivel * 0.01 : 0;
}

export function custoBandido(nivel: number): number {
  return Math.round((900 * Math.pow(nivel, 1.7)) / 50) * 50;
}

export function nivelMaxCandidato(save: GangstarSave): number {
  // nivel 1: ate 1 · nivel 5: ate 2 · nivel 9: ate 3 · nivel 13: ate 4 · nivel 18: ate 5
  const n = save.personagem.nivel;
  return n >= 18 ? 5 : n >= 13 ? 4 : n >= 9 ? 3 : n >= 5 ? 2 : 1;
}

// candidatos mudam a cada 4h (mesma lista para a mesma janela de tempo)
export function candidatosBandidos(save: GangstarSave, classe: ClasseBandido, agora = Date.now()): CandidatoBandido[] {
  const janela = Math.floor(agora / JANELA_CANDIDATOS_MS);
  const indiceClasse = CLASSES_BANDIDO.findIndex((c) => c.id === classe);
  const rnd = rngSemente(janela * 31 + indiceClasse * 7919 + save.criadoEm % 100000);
  const nivelMax = nivelMaxCandidato(save);
  const contratados = new Set(save.bandidos.map((b) => b.id));
  const lista: CandidatoBandido[] = [];
  for (let i = 0; i < 4; i++) {
    const nivel = Math.max(1, Math.min(nivelMax, 1 + Math.floor(rnd() * nivelMax)));
    const poder = nivel * 6 + Math.floor(rnd() * 6);
    const nome = `${PRIMEIROS_NOMES[Math.floor(rnd() * PRIMEIROS_NOMES.length)]} ${APELIDOS[Math.floor(rnd() * APELIDOS.length)]}`;
    const id = `band-${janela}-${classe}-${i}`;
    if (contratados.has(id)) continue;
    lista.push({ id, nome, classe, nivel, poder, custo: custoBandido(nivel), comissao: comissaoBandido(classe, nivel) });
  }
  return lista;
}

export function minutosParaNovosCandidatos(agora = Date.now()): number {
  return Math.ceil((JANELA_CANDIDATOS_MS - (agora % JANELA_CANDIDATOS_MS)) / 60000);
}

export function temRecrutamento(save: GangstarSave): boolean {
  return Object.values(save.predios).some((p) => p.tipo === "recrutamento");
}

export function contratarBandido(save: GangstarSave, candidato: CandidatoBandido): { save: GangstarSave; erro?: string } {
  if (!save.personagem.gangue) return { save, erro: "Você precisa de uma gangue." };
  if (!temRecrutamento(save)) return { save, erro: "Compre o Ponto de Recrutamento primeiro." };
  if (save.bandidos.some((b) => b.id === candidato.id)) return { save, erro: "Esse bandido já está na sua gangue." };
  if (save.bandidos.filter((b) => b.classe === candidato.classe).length >= MAX_BANDIDOS_POR_CLASSE) {
    return { save, erro: `Limite de ${MAX_BANDIDOS_POR_CLASSE} por classe.` };
  }
  if (save.personagem.dinheiro < candidato.custo) return { save, erro: "Dinheiro insuficiente." };
  const novo: Bandido = { id: candidato.id, nome: candidato.nome, classe: candidato.classe, nivel: candidato.nivel, poder: candidato.poder, lealdade: 70, contratadoEm: Date.now() };
  return {
    save: { ...save, personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - candidato.custo }, bandidos: [...save.bandidos, novo] },
  };
}

export function dispensarBandido(save: GangstarSave, id: string): GangstarSave {
  return { ...save, bandidos: save.bandidos.filter((b) => b.id !== id) };
}

export function custoBonusLealdade(b: Bandido): number {
  return 150 + b.nivel * 150;
}

export function pagarBonusBandido(save: GangstarSave, id: string): { save: GangstarSave; erro?: string } {
  const b = save.bandidos.find((x) => x.id === id);
  if (!b) return { save, erro: "Bandido não encontrado." };
  if (b.lealdade >= 100) return { save, erro: "A lealdade dele já está no máximo." };
  const custo = custoBonusLealdade(b);
  if (save.personagem.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - custo },
      bandidos: save.bandidos.map((x) => (x.id === id ? { ...x, lealdade: Math.min(100, x.lealdade + 25) } : x)),
    },
  };
}

function poderClasse(save: GangstarSave, classe: ClasseBandido): number {
  return (save.bandidos ?? []).filter((b) => b.classe === classe).reduce((s, b) => s + b.poder, 0);
}

export function poderTotalBandidos(save: GangstarSave): number {
  return (save.bandidos ?? []).reduce((s, b) => s + b.poder, 0);
}

// multiplicador da chance de prisao (pilotos de fuga)
export function fatorPiloto(save: GangstarSave): number {
  return Math.max(0.4, 1 - poderClasse(save, "piloto") * 0.006);
}

// multiplicador das coletas (contrabandistas)
export function fatorContrabando(save: GangstarSave): number {
  return 1 + Math.min(0.6, poderClasse(save, "contrabandista") * 0.006);
}

export function comissaoAssaltantes(save: GangstarSave): number {
  return Math.min(0.4, (save.bandidos ?? []).filter((b) => b.classe === "assaltante").reduce((s, b) => s + comissaoBandido(b.classe, b.nivel), 0));
}

export function resumoBandidos(save: GangstarSave) {
  return {
    poderTotal: poderTotalBandidos(save),
    poderRoubo: Math.round(poderClasse(save, "assaltante") * 0.4 * 10) / 10,
    reducaoPrisao: Math.round((1 - fatorPiloto(save)) * 100),
    bonusColeta: Math.round((fatorContrabando(save) - 1) * 100),
    comissao: Math.round(comissaoAssaltantes(save) * 100),
  };
}

function registrar(save: GangstarSave, textos: string[]): GangstarSave {
  if (!textos.length) return save;
  const agora = Date.now();
  return { ...save, registroGangue: [...textos.map((texto) => ({ quando: agora, texto })), ...(save.registroGangue ?? [])].slice(0, 25) };
}

function ajustarLealdade(save: GangstarSave, classe: ClasseBandido, delta: number): GangstarSave {
  if (!save.bandidos?.some((b) => b.classe === classe)) return save;
  return { ...save, bandidos: save.bandidos.map((b) => (b.classe === classe ? { ...b, lealdade: Math.max(0, Math.min(100, b.lealdade + delta)) } : b)) };
}

// guerra de gangues: cada assaltante pode morrer em combate
function baixasDeGuerra(save: GangstarSave, chance: number): { save: GangstarSave; ocorrencias: string[] } {
  const mortos = (save.bandidos ?? []).filter((b) => b.classe === "assaltante" && Math.random() < chance);
  if (!mortos.length) return { save, ocorrencias: [] };
  const textos = mortos.map((b) => `💀 ${b.nome} morreu no confronto.`);
  const ids = new Set(mortos.map((b) => b.id));
  return { save: registrar({ ...save, bandidos: save.bandidos.filter((b) => !ids.has(b.id)) }, textos), ocorrencias: textos };
}

// roubo deu errado: cada piloto pode morrer (5%) ou ser preso (7%) na fuga
function riscoFuga(save: GangstarSave): { save: GangstarSave; ocorrencias: string[] } {
  const perdidos: { b: Bandido; texto: string }[] = [];
  for (const b of save.bandidos ?? []) {
    if (b.classe !== "piloto") continue;
    const r = Math.random();
    if (r < 0.05) perdidos.push({ b, texto: `💀 ${b.nome} capotou na fuga e morreu.` });
    else if (r < 0.12) perdidos.push({ b, texto: `🚔 ${b.nome} foi preso na fuga e saiu da gangue.` });
  }
  if (!perdidos.length) return { save, ocorrencias: [] };
  const ids = new Set(perdidos.map((x) => x.b.id));
  const textos = perdidos.map((x) => x.texto);
  return { save: registrar({ ...save, bandidos: save.bandidos.filter((b) => !ids.has(b.id)) }, textos), ocorrencias: textos };
}

// com o tempo a lealdade cai 1 ponto a cada 3h; lealdade baixa pode virar traicao
function processarGangue(save: GangstarSave, decorridoMs: number): GangstarSave {
  if (!save.bandidos?.length || decorridoMs <= 0) return save;
  const horas = decorridoMs / 3600000;
  // lealdade cai 1 ponto a cada 3h, contando desde a ultima queda (e nao so do ultimo tick)
  const agora = Date.now();
  const desde = save.quedaLealdadeEm ?? agora - decorridoMs;
  const queda = Math.floor((agora - desde) / (3 * 3600000));
  save = { ...save, quedaLealdadeEm: desde + queda * 3 * 3600000 };
  let dinheiro = save.personagem.dinheiro;
  const textos: string[] = [];
  const ficam: Bandido[] = [];
  for (const b0 of save.bandidos) {
    const b = queda > 0 ? { ...b0, lealdade: Math.max(0, b0.lealdade - queda) } : b0;
    if (b.lealdade < 50) {
      const porHora = 0.004 * (1 + (50 - b.lealdade) / 10) * (b.classe === "contrabandista" ? 2 : 1);
      const chance = 1 - Math.pow(1 - porHora, Math.min(horas, 48));
      if (Math.random() < chance) {
        const roubado = Math.min(20000, Math.round(dinheiro * (0.05 + Math.random() * 0.1)));
        dinheiro -= roubado;
        textos.push(`🐍 ${b.nome} traiu a gangue${roubado > 0 ? ` e sumiu com R$ ${roubado.toLocaleString("pt-BR")}` : " e sumiu"}.`);
        continue;
      }
    }
    ficam.push(b);
  }
  if (!textos.length && queda === 0) return save;
  return registrar({ ...save, bandidos: ficam, personagem: { ...save.personagem, dinheiro } }, textos);
}

// ---------- Missões em equipe (Fase 3) ----------

export interface MissaoEquipe {
  id: string;
  nome: string;
  emoji: string;
  nivelMin: number;
  exigencias: Especialidade[];
  energiaCusto: number;
  dificuldade: number;
  dinheiroMin: number;
  dinheiroMax: number;
  respeito: number;
  xp: number;
  prisaoMinutos: number;
  chancePrisaoBase: number;
}

export const MISSOES_EQUIPE: MissaoEquipe[] = [
  {
    id: "carga-cigarros",
    nome: "Desviar Caminhão de Cigarros",
    emoji: "🚛",
    nivelMin: 5,
    exigencias: ["motorista"],
    energiaCusto: 20,
    dificuldade: 25,
    dinheiroMin: 900,
    dinheiroMax: 1800,
    respeito: 18,
    xp: 110,
    prisaoMinutos: 15,
    chancePrisaoBase: 0.2,
  },
  {
    id: "desmanche",
    nome: "Abastecer o Desmanche",
    emoji: "🔧",
    nivelMin: 7,
    exigencias: ["motorista", "negociador"],
    energiaCusto: 24,
    dificuldade: 34,
    dinheiroMin: 1500,
    dinheiroMax: 3000,
    respeito: 26,
    xp: 150,
    prisaoMinutos: 20,
    chancePrisaoBase: 0.21,
  },
  {
    id: "joalherias-eq",
    nome: "Arrombar a Rede de Joalherias",
    emoji: "💍",
    nivelMin: 9,
    exigencias: ["motorista", "atirador"],
    energiaCusto: 30,
    dificuldade: 45,
    dinheiroMin: 3000,
    dinheiroMax: 6000,
    respeito: 40,
    xp: 220,
    prisaoMinutos: 30,
    chancePrisaoBase: 0.22,
  },
  {
    id: "sequestro-empresario",
    nome: "Sequestro de Empresário",
    emoji: "💼",
    nivelMin: 10,
    exigencias: ["motorista", "atirador", "negociador"],
    energiaCusto: 38,
    dificuldade: 55,
    dinheiroMin: 5000,
    dinheiroMax: 10000,
    respeito: 55,
    xp: 320,
    prisaoMinutos: 45,
    chancePrisaoBase: 0.24,
  },
  {
    id: "cofre-cassino",
    nome: "Assalto ao Cofre do Cassino",
    emoji: "🎰",
    nivelMin: 13,
    exigencias: ["hacker", "atirador", "motorista"],
    energiaCusto: 46,
    dificuldade: 65,
    dinheiroMin: 8000,
    dinheiroMax: 15000,
    respeito: 70,
    xp: 420,
    prisaoMinutos: 55,
    chancePrisaoBase: 0.25,
  },
  {
    id: "data-center",
    nome: "Invadir o Data Center do Banco",
    emoji: "🖥️",
    nivelMin: 15,
    exigencias: ["hacker", "motorista"],
    energiaCusto: 48,
    dificuldade: 72,
    dinheiroMin: 10000,
    dinheiroMax: 19000,
    respeito: 85,
    xp: 500,
    prisaoMinutos: 65,
    chancePrisaoBase: 0.26,
  },
  {
    id: "museu",
    nome: "Assalto ao Museu Nacional",
    emoji: "🏺",
    nivelMin: 18,
    exigencias: ["hacker", "atirador", "negociador"],
    energiaCusto: 54,
    dificuldade: 84,
    dinheiroMin: 14000,
    dinheiroMax: 28000,
    respeito: 110,
    xp: 640,
    prisaoMinutos: 80,
    chancePrisaoBase: 0.27,
  },
  {
    id: "reserva-ouro",
    nome: "Roubo da Reserva de Ouro",
    emoji: "🪙",
    nivelMin: 20,
    exigencias: ["hacker", "negociador", "atirador", "motorista"],
    energiaCusto: 60,
    dificuldade: 95,
    dinheiroMin: 20000,
    dinheiroMax: 40000,
    respeito: 140,
    xp: 800,
    prisaoMinutos: 90,
    chancePrisaoBase: 0.28,
  },
  {
    id: "aeroporto",
    nome: "Golpe no Terminal de Cargas do Aeroporto",
    emoji: "✈️",
    nivelMin: 23,
    exigencias: ["hacker", "negociador", "atirador", "motorista"],
    energiaCusto: 70,
    dificuldade: 115,
    dinheiroMin: 35000,
    dinheiroMax: 70000,
    respeito: 200,
    xp: 1100,
    prisaoMinutos: 120,
    chancePrisaoBase: 0.3,
  },
  {
    id: "cofre-hotel",
    nome: "Cofre do Hotel Royal",
    emoji: "🏨",
    nivelMin: 9,
    exigencias: ["hacker", "negociador"],
    energiaCusto: 32,
    dificuldade: 46,
    dinheiroMin: 3200,
    dinheiroMax: 6500,
    respeito: 40,
    xp: 240,
    prisaoMinutos: 30,
    chancePrisaoBase: 0.23,
  },
  {
    id: "carregamento-ouro",
    nome: "Interceptar Carregamento de Ouro",
    emoji: "🪙",
    nivelMin: 20,
    exigencias: ["motorista", "atirador", "hacker"],
    energiaCusto: 60,
    dificuldade: 96,
    dinheiroMin: 20000,
    dinheiroMax: 40000,
    respeito: 150,
    xp: 820,
    prisaoMinutos: 95,
    chancePrisaoBase: 0.28,
  },
  {
    id: "casa-da-moeda",
    nome: "Golpe na Casa da Moeda",
    emoji: "🏛️",
    nivelMin: 23,
    exigencias: ["hacker", "negociador", "atirador", "motorista"],
    energiaCusto: 75,
    dificuldade: 125,
    dinheiroMin: 45000,
    dinheiroMax: 90000,
    respeito: 240,
    xp: 1300,
    prisaoMinutos: 140,
    chancePrisaoBase: 0.32,
  },
];

// v4.61: a equipe dos roubos em equipe sao os bandidos do Ponto de Recrutamento
export const CLASSE_POR_ESPECIALIDADE: Record<Especialidade, ClasseBandido> = {
  atirador: "assaltante",
  motorista: "piloto",
  hacker: "contrabandista",
  negociador: "contrabandista",
};

export function exigenciasMissao(m: MissaoEquipe): ClasseBandido[] {
  return [...new Set(m.exigencias.map((e) => CLASSE_POR_ESPECIALIDADE[e]))];
}

export function poderEquipe(save: GangstarSave, membros: Bandido[]): number {
  return Math.round(poderDeRoubo(save) + membros.reduce((soma, b) => soma + b.poder * 0.8 + b.lealdade * 0.05, 0));
}

export type ResultadoMissaoEquipe =
  | { tipo: "sucesso"; dinheiro: number; respeito: number; xp: number }
  | { tipo: "falha-fugiu" }
  | { tipo: "falha-preso"; minutos: number; fianca: number };

function tentarMissaoEquipeBase(
  save: GangstarSave,
  missaoId: string,
  membroIds: string[],
): { save: GangstarSave; resultado?: ResultadoMissaoEquipe; erro?: string } {
  const missao = MISSOES_EQUIPE.find((m) => m.id === missaoId);
  if (!missao) return { save, erro: "Missão não encontrada." };
  const p = save.personagem;
  if (p.preso) return { save, erro: msgBloqueado(p) };
  if (p.nivel < missao.nivelMin) return { save, erro: "Nível insuficiente." };
  if (p.energia < missao.energiaCusto) return { save, erro: "Energia insuficiente." };

  const selecionados = save.bandidos.filter((b) => membroIds.includes(b.id));
  const classesCobertas = new Set(selecionados.map((b) => b.classe));
  const faltando = exigenciasMissao(missao).filter((c) => !classesCobertas.has(c));
  if (faltando.length > 0) {
    const nomes = faltando.map((c) => CLASSES_BANDIDO.find((x) => x.id === c)?.nome ?? c).join(", ");
    return { save, erro: `Faltam bandidos na equipe: ${nomes}. Contrate no Ponto de Recrutamento.` };
  }

  const energiaRestante = p.energia - missao.energiaCusto;
  const sucesso = Math.random() < Math.max(0.05, Math.min(0.92, 0.5 + (poderEquipe(save, selecionados) - missao.dificuldade) * 0.012));

  if (sucesso) {
    const bonusAssaltante = p.classe === "assaltante" ? 1.15 : 1;
    const bonusEvento = eventoEstaAtivo(save, "policia-greve") ? 1.5 : 1;
    const bonusPrest = 1 + bonusPrestigio(save);
    const totalBruto = Math.round((missao.dinheiroMin + Math.random() * (missao.dinheiroMax - missao.dinheiroMin)) * bonusAssaltante * bonusEvento * bonusPrest);
    const pagamentoCrew = Math.round(totalBruto * 0.3); // parte dos bandidos
    const dinheiroJogador = totalBruto - pagamentoCrew;

    const bandidosAtualizados = save.bandidos.map((b) => (membroIds.includes(b.id) ? evoluirBandido({ ...b, lealdade: Math.min(100, b.lealdade + 4) }, Math.round(missao.xp / 2)) : b));

    let novoP: Personagem = { ...p, energia: energiaRestante, dinheiro: p.dinheiro + dinheiroJogador, respeito: p.respeito + missao.respeito };
    novoP = ganharXp(novoP, missao.xp);
    return {
      save: { ...save, personagem: novoP, bandidos: bandidosAtualizados },
      resultado: { tipo: "sucesso", dinheiro: dinheiroJogador, respeito: missao.respeito, xp: missao.xp },
    };
  }

  const bandidosAtualizados = save.bandidos.map((b) => (membroIds.includes(b.id) ? { ...b, lealdade: Math.max(0, b.lealdade - 10) } : b));

  const chancePrisao = Math.max(0.03, missao.chancePrisaoBase - p.atributos.resistencia * 0.003) * fatorPrisaoDoDia() * fatorPiloto(save) * (1 - bonusEspecial(save, "prisao"));
  if (Math.random() < chancePrisao) {
    const ate = Date.now() + missao.prisaoMinutos * 60 * 1000;
    const novoP: Personagem = { ...p, energia: energiaRestante, vezesPreso: p.vezesPreso + 1, preso: { ate } };
    return {
      save: { ...save, personagem: novoP, bandidos: bandidosAtualizados },
      resultado: { tipo: "falha-preso", minutos: missao.prisaoMinutos, fianca: custoFianca(novoP) },
    };
  }

  return { save: { ...save, personagem: { ...p, energia: energiaRestante }, bandidos: bandidosAtualizados }, resultado: { tipo: "falha-fugiu" } };
}

// ---------- Eventos aleatórios da cidade (Fase 3) ----------

export interface EventoDef {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
}

export const EVENTOS: EventoDef[] = [
  { id: "policia-greve", nome: "Polícia em Greve", emoji: "🚨", descricao: "+50% de dinheiro em roubos e missões em equipe." },
  { id: "batida-boates", nome: "Batida nas Boates", emoji: "🚓", descricao: "Boates mais caras por causa da fiscalização." },
  { id: "escassez-droga", nome: "Escassez de Drogas", emoji: "💊", descricao: "Fábricas de drogas rendem o triplo." },
  { id: "promocao-banco", nome: "Promoção do Banco", emoji: "🏦", descricao: "O CDI do banco rende em dobro." },
  { id: "festa-cidade", nome: "Festa na Cidade", emoji: "🎉", descricao: "As lojas vendem muito mais bebidas e drogas." },
  { id: "batida-policial", nome: "Batida Policial", emoji: "🚔", descricao: "Clientes somem: lojas vendem menos drogas e armas." },
];

export function eventoEstaAtivo(save: GangstarSave, eventoId: string): boolean {
  return !!save.eventoAtivo && save.eventoAtivo.id === eventoId && Date.now() < save.eventoAtivo.expiraEm;
}

export function eventoAtualView(save: GangstarSave): { def: EventoDef; expiraEm: number } | null {
  if (!save.eventoAtivo || Date.now() >= save.eventoAtivo.expiraEm) return null;
  const def = EVENTOS.find((e) => e.id === save.eventoAtivo!.id);
  return def ? { def, expiraEm: save.eventoAtivo.expiraEm } : null;
}

function processarEventos(save: GangstarSave, decorridoMs: number): GangstarSave {
  const agora = Date.now();
  if (save.eventoAtivo && agora >= save.eventoAtivo.expiraEm) {
    save = { ...save, eventoAtivo: null };
  }
  if (!save.eventoAtivo && decorridoMs > 0) {
    const horas = decorridoMs / 3600000;
    const chanceTotal = 1 - Math.pow(1 - 0.08, horas);
    if (Math.random() < chanceTotal) {
      const def = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];
      const duracaoHoras = 3 + Math.random() * 7;
      save = { ...save, eventoAtivo: { id: def.id, expiraEm: agora + duracaoHoras * 3600000 } };
    }
  }
  return save;
}

// ---------- Mercado negro dinâmico (Fase 3) ----------

function seedDeId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return h;
}

export function multiplicadorMercadoArma(armaId: string): number {
  const fase = seedDeId(armaId);
  const ciclo = Math.sin(Date.now() / (5 * 3600000) + fase);
  return 1 + ciclo * 0.25;
}

export function precoArmaFinal(save: GangstarSave, arma: Arma): number {
  let preco = arma.preco * multiplicadorMercadoArma(arma.id);
  if (save.personagem.classe === "traficante") preco *= 0.9;
  preco *= 1 - descontoZonasMercado(save);
  return Math.max(10, Math.round(preco));
}

// ---------- Prestígio (opcional, Fase 3) ----------

const LIMIAR_PRESTIGIO = 100000;

export function limiarPrestigio(): number {
  return LIMIAR_PRESTIGIO;
}

export function podePrestigiar(save: GangstarSave): boolean {
  return patrimonio(save) >= LIMIAR_PRESTIGIO;
}

export function bonusPrestigio(save: GangstarSave): number {
  return save.prestigio * 0.02;
}

export function prestigiar(save: GangstarSave): { save: GangstarSave; erro?: string } {
  if (!podePrestigiar(save)) {
    return { save, erro: `Patrimônio mínimo de R$ ${LIMIAR_PRESTIGIO.toLocaleString("pt-BR")} para prestigiar.` };
  }
  const personagemBase = criarPersonagem(save.personagem.nome, save.personagem.classe);
  return {
    save: {
      ...save,
      personagem: { ...personagemBase, gangue: save.personagem.gangue },
      predios: {},
      extorsoes: {},
      bandidos: [],
      registroGangue: [],
      ...estadoExtraV9(),
      porto: { janela: 0, concluidos: [], navios: [] },
      emboscadas: { janela: 0, feitas: [], capo: { semana: "", derrotado: false } },
      cassino: save.cassino,
      agiota: null,
      estatisticas: save.estatisticas,
      historia: save.historia,
      conquistas: save.conquistas,
      crew: [],
      territorios: territoriosIniciais(),
      eventoAtivo: null,
      prestigio: save.prestigio + 1,
      acoes: {},
    },
  };
}

// ---------- Niveis (xp acumulado -> nivel) ----------

// v4.61: subir de nivel ficou bem mais lento (antes: 0, 100, 250, 450, 700, 1000, 1400, 1900, 2600, 3500, 4600)
// v4.64: 25 niveis. XP total do nivel n = 60 * (n-1)^2,05 (nivel 10 ~5.400, nivel 25 ~40.500)
export const NIVEL_MAX = 25;
const LIMIARES_NIVEL = Array.from({ length: NIVEL_MAX }, (_, i) => (i === 0 ? 0 : Math.round((60 * Math.pow(i, 2.05)) / 50) * 50));

export function xpDoNivel(nivel: number): number {
  return LIMIARES_NIVEL[Math.max(0, Math.min(NIVEL_MAX, nivel) - 1)] ?? 0;
}

function nivelDoXp(xp: number): number {
  let nivel = 1;
  for (let i = 1; i < LIMIARES_NIVEL.length; i++) {
    if (xp >= LIMIARES_NIVEL[i]) nivel = i + 1;
  }
  return nivel;
}

// ---------- Lotes antigos (so para migrar saves anteriores ao mapa v6) ----------

function precoLoteAntigo(indice: number): number {
  return Math.round((600 * Math.pow(1.35, indice)) / 10) * 10;
}

export function patrimonio(save: GangstarSave): number {
  const valorPredios = Object.values(save.predios).reduce((soma, inst) => soma + PREDIOS[inst.tipo].custoConstrucao * inst.nivel, 0);
  return save.personagem.dinheiro + save.personagem.banco.saldo + valorPredios + valorCarteira(save);
}

// ---------- Poder de roubo / chances ----------

// a arma equipada pode ser do Mercado Negro (ARMAS) ou feita na fabrica (ITENS)
export function armaEquipada(save: GangstarSave): { id: string; nome: string; emoji: string; poder: number } | null {
  const id = save.personagem.armaEquipada;
  if (!id) return null;
  const doMercado = ARMAS.find((a) => a.id === id);
  if (doMercado) return doMercado;
  const item = itemPorId(id);
  return item && item.categoria === "arma" ? { id: item.id, nome: item.nome, emoji: item.emoji, poder: item.poder ?? 0 } : null;
}

export function coleteEquipado(save: GangstarSave): ItemDef | null {
  const item = itemPorId(save.equipamento?.colete);
  return item && item.categoria === "colete" ? item : null;
}

export function poderDeRoubo(save: GangstarSave): number {
  const { atributos, classe } = save.personagem;
  const arma = armaEquipada(save);
  let poder = atributos.forca * 1.2 + atributos.inteligencia * 0.9 + atributos.resistencia * 0.5 + atributos.carisma * 0.3 + (arma?.poder ?? 0);
  if (classe === "matador") poder *= 1.15;
  poder += poderClasse(save, "assaltante") * 0.4;
  poder += (coleteEquipado(save)?.poder ?? 0) * 0.6;
  poder *= 1 + bonusEspecial(save, "poder");
  return Math.round(poder * 10) / 10;
}

export function chanceSucesso(save: GangstarSave, roubo: Roubo): number {
  const diff = poderDeRoubo(save) - roubo.dificuldade;
  return Math.max(0.05, Math.min(0.95, 0.5 + diff * 0.015));
}

function chancePrisaoSeFalhar(save: GangstarSave, roubo: Roubo): number {
  const reducao = save.personagem.atributos.resistencia * 0.003;
  return Math.max(0.02, Math.min(0.95, (roubo.chancePrisaoBase - reducao) * fatorPrisaoDoDia() * fatorPiloto(save) * (1 - bonusEspecial(save, "prisao"))));
}

// ---------- Regeneracao por tempo real ----------

const MS_POR_PONTO_ENERGIA = 2 * 60 * 1000; // 1 energia a cada 2 minutos
const MS_POR_PONTO_VIDA = 3 * 60 * 1000; // 1 vida a cada 3 minutos
const MS_POR_PONTO_VICIO = 10 * 60 * 1000; // vicio desce 1 ponto a cada 10 minutos
// v4.63: 0,1%/hora (~2,4% ao dia). Antes 0,4%/h (~10% ao dia) era dinheiro infinito
const TAXA_CDI_POR_HORA = 0.001;

// usado pela interface para atualizar o estado com o passar do tempo (ex.: fim da prisao)
function migrarCrewParaBandidos(save: GangstarSave): GangstarSave {
  if (!save.crew?.length) return save;
  const agora = Date.now();
  const novos: Bandido[] = save.crew.map((m) => ({
    id: `crew-${m.id}`,
    nome: m.nome,
    classe: CLASSE_POR_ESPECIALIDADE[m.especialidade],
    nivel: m.nivel,
    poder: 6 + m.nivel * 6,
    lealdade: m.lealdade,
    contratadoEm: agora,
  }));
  return { ...save, crew: [], bandidos: [...save.bandidos, ...novos.filter((n) => !save.bandidos.some((b) => b.id === n.id))] };
}

export function atualizarComTempo(saveOriginal: GangstarSave): GangstarSave {
  const save = corrigirNivelPeloXp(migrarCrewParaBandidos(saveOriginal));
  return aplicarRegeneracao(save);
}

function aplicarRegeneracao(saveOriginal: GangstarSave): GangstarSave {
  const save = verificarTemporada(saveOriginal);
  const agora = Date.now();
  const decorrido = Math.max(0, agora - save.ultimaAtualizacao);
  const p = { ...save.personagem };
  const decorridoRegen = decorrido * (eventoDiarioAtivo("recuperacao") ? 2 : 1);

  // guarda a sobra de tempo de cada barra (antes ela se perdia a cada atualizacao)
  const resto = save.regenResto ?? { energia: 0, vida: 0, vicio: 0 };
  const regen = (atual: number, cheio: boolean, ms: number) => {
    if (cheio) return { pontos: 0, resto: 0 };
    const total = atual + decorridoRegen;
    return { pontos: Math.floor(total / ms), resto: total % ms };
  };
  const rEnergia = regen(resto.energia, p.energia >= p.energiaMax, MS_POR_PONTO_ENERGIA);
  if (rEnergia.pontos > 0) p.energia = Math.min(p.energiaMax, p.energia + rEnergia.pontos);
  const rVida = regen(resto.vida, p.vida >= p.vidaMax, MS_POR_PONTO_VIDA);
  if (rVida.pontos > 0) p.vida = Math.min(p.vidaMax, p.vida + rVida.pontos);
  const rVicio = regen(resto.vicio, p.vicio <= 0, MS_POR_PONTO_VICIO);
  if (rVicio.pontos > 0) p.vicio = Math.max(0, p.vicio - rVicio.pontos);

  let jurosResto = save.jurosResto ?? 0;
  if (p.banco.saldo > 0) {
    const horas = decorrido / 3600000;
    const taxaCdi = eventoEstaAtivo(save, "promocao-banco") ? TAXA_CDI_POR_HORA * 2 : TAXA_CDI_POR_HORA;
    // guarda a fracao: antes, com atualizacoes curtas, o juro arredondava para zero
    const juros = p.banco.saldo * taxaCdi * horas + jurosResto;
    const inteiro = Math.floor(juros);
    jurosResto = juros - inteiro;
    p.banco = { saldo: p.banco.saldo + inteiro };
  } else jurosResto = 0;

  if (p.preso && agora >= p.preso.ate) p.preso = null;

  let novoSave: GangstarSave = {
    ...save,
    personagem: p,
    ultimaAtualizacao: agora,
    regenResto: { energia: rEnergia.resto, vida: rVida.resto, vicio: rVicio.resto },
    jurosResto,
  };
  novoSave = processarEventos(novoSave, decorrido);
  novoSave = processarAtaquesIA(novoSave, decorrido);
  novoSave = processarGangue(novoSave, decorrido);
  novoSave = processarVendasLojas(novoSave);
  novoSave = processarAgiota(novoSave);
  return novoSave;
}

// ---------- Persistencia ----------

function ehSaveValido(obj: unknown): obj is GangstarSave {
  return !!obj && typeof obj === "object" && (obj as GangstarSave).versao === 10 && !!(obj as GangstarSave).personagem;
}

type TipoPredioAntigo = Exclude<TipoPredio, "loja-bebidas" | "loja-farmacia" | "loja-armas" | "fabrica-medicamentos" | "recrutamento"> | "loja";

interface PredioInstanciaAntigo {
  tipo: TipoPredioAntigo;
  nivel: number;
  construidoEm: number;
  ultimaColeta: number;
}

interface SaveV2 {
  versao: 2;
  criadoEm: number;
  ultimaAtualizacao: number;
  personagem: Omit<Personagem, "banco">;
  quarteiroesRevelados: number;
  terrenosComprados: string[];
}

interface SaveV3 {
  versao: 3;
  criadoEm: number;
  ultimaAtualizacao: number;
  personagem: Personagem;
  quarteiroesRevelados: number;
  terrenosComprados: string[];
  predios: Record<string, PredioInstanciaAntigo>;
}

interface SaveV5 {
  versao: 5;
  criadoEm: number;
  ultimaAtualizacao: number;
  personagem: Personagem;
  quarteiroesRevelados: number;
  terrenosComprados: string[];
  predios: Record<string, PredioInstanciaAntigo>;
  crew: MembroCrew[];
  territorios: Record<string, string>;
  eventoAtivo: EventoAtivo | null;
  prestigio: number;
  treinosHoje: TreinosDia;
}

interface SaveV4 {
  versao: 4;
  criadoEm: number;
  ultimaAtualizacao: number;
  personagem: Personagem;
  quarteiroesRevelados: number;
  terrenosComprados: string[];
  predios: Record<string, PredioInstanciaAntigo>;
  crew: MembroCrew[];
  territorios: Record<string, string>;
  eventoAtivo: EventoAtivo | null;
  prestigio: number;
}

function ehSaveV2(obj: unknown): obj is SaveV2 {
  return !!obj && typeof obj === "object" && (obj as SaveV2).versao === 2 && !!(obj as SaveV2).personagem;
}

function ehSaveV3(obj: unknown): obj is SaveV3 {
  return !!obj && typeof obj === "object" && (obj as SaveV3).versao === 3 && !!(obj as SaveV3).personagem;
}

function ehSaveV5(obj: unknown): obj is SaveV5 {
  return !!obj && typeof obj === "object" && (obj as SaveV5).versao === 5 && !!(obj as SaveV5).personagem;
}

function ehSaveV4(obj: unknown): obj is SaveV4 {
  return !!obj && typeof obj === "object" && (obj as SaveV4).versao === 4 && !!(obj as SaveV4).personagem;
}

function migrarV2ParaV3(v2: SaveV2): SaveV3 {
  return {
    versao: 3,
    criadoEm: v2.criadoEm,
    ultimaAtualizacao: v2.ultimaAtualizacao,
    quarteiroesRevelados: v2.quarteiroesRevelados,
    terrenosComprados: v2.terrenosComprados,
    predios: {},
    personagem: { ...v2.personagem, banco: { saldo: 0 } },
  };
}

function migrarV3ParaV4(v3: SaveV3): SaveV4 {
  return {
    versao: 4,
    criadoEm: v3.criadoEm,
    ultimaAtualizacao: v3.ultimaAtualizacao,
    quarteiroesRevelados: v3.quarteiroesRevelados,
    terrenosComprados: v3.terrenosComprados,
    predios: v3.predios,
    personagem: v3.personagem,
    crew: [],
    territorios: territoriosIniciais(),
    eventoAtivo: null,
    prestigio: 0,
  };
}

function migrarV4ParaV5(v4: SaveV4): SaveV5 {
  return { ...v4, versao: 5, treinosHoje: { data: diaDeHoje(), escola: 0, academia: 0 } };
}

// v5 -> v6: os lotes viraram os 11 predios fixos do mapa. Cada predio antigo vai para o
// primeiro predio livre do mesmo tipo (lojas antigas viram as lojas novas, em ordem); o
// que nao couber e os lotes comprados sao reembolsados em dinheiro.
const DESTINO_TIPO_ANTIGO: Record<TipoPredioAntigo, TipoPredio[]> = {
  hotel: ["hotel"],
  loja: ["loja-bebidas", "loja-farmacia", "loja-armas"],
  "fabrica-bebidas": ["fabrica-bebidas"],
  "fabrica-drogas": ["fabrica-drogas", "fabrica-medicamentos"],
  "fabrica-armas": ["fabrica-armas"],
  boate: ["boate"],
  gestao: ["gestao"],
};

type SaveV6 = Omit<SaveV7, "versao" | "extorsoes"> & { versao: 6 };

function ehSaveV6(obj: unknown): obj is SaveV6 {
  return !!obj && typeof obj === "object" && (obj as SaveV6).versao === 6 && !!(obj as SaveV6).personagem;
}

type SaveV7 = Omit<SaveV8, "versao" | "bandidos" | "registroGangue"> & { versao: 7 };

function ehSaveV7(obj: unknown): obj is SaveV7 {
  return !!obj && typeof obj === "object" && (obj as SaveV7).versao === 7 && !!(obj as SaveV7).personagem;
}

type SaveV8 = Omit<GangstarSave, "versao" | "inventario" | "equipamento" | "mercador" | "porto" | "emboscadas" | "cassino" | "agiota" | "estatisticas" | "historia" | "conquistas"> & { versao: 8 };

function ehSaveV8(obj: unknown): obj is SaveV8 {
  return !!obj && typeof obj === "object" && (obj as SaveV8).versao === 8 && !!(obj as SaveV8).personagem;
}

function estadoExtraV9() {
  return {
    inventario: {} as Record<string, number>,
    equipamento: { colete: null, especial: null } as EquipamentoExtra,
    mercador: { visita: "", comprados: {} as Record<string, number> },
    porto: { janela: 0, concluidos: [] as string[] },
    emboscadas: { janela: 0, feitas: [] as string[] },
  };
}

function estadoExtraV10() {
  return {
    cassino: { jackpot: JACKPOT_INICIAL, torneio: null as TorneioPoker | null },
    agiota: null as { divida: number; venceEm: number } | null,
    estatisticas: {} as Record<string, number>,
    historia: { capitulo: 0 },
    conquistas: [] as string[],
  };
}

type SaveV9 = Omit<GangstarSave, "versao" | "porto" | "emboscadas" | "cassino" | "agiota" | "estatisticas" | "historia" | "conquistas"> & {
  versao: 9;
  porto: { janela: number; concluidos: string[] };
  emboscadas: { janela: number; feitas: string[] };
};

function ehSaveV9(obj: unknown): obj is SaveV9 {
  return !!obj && typeof obj === "object" && (obj as SaveV9).versao === 9 && !!(obj as SaveV9).personagem;
}

// v9 -> v10: inventario ganha qualidade (itens antigos viram 1 estrela), navios no Porto,
// capo semanal, cassino (jackpot/torneio), agiota, historia e conquistas.
function migrarV9ParaV10(v9: SaveV9): GangstarSave {
  const inventario: Record<string, number> = {};
  for (const [k, q] of Object.entries(v9.inventario)) {
    const chave = k.includes("@") ? k : `${k}@1`;
    inventario[chave] = (inventario[chave] ?? 0) + q;
  }
  return {
    ...v9,
    versao: 10,
    inventario,
    porto: { ...v9.porto, navios: [] },
    emboscadas: { ...v9.emboscadas, capo: { semana: "", derrotado: false } },
    ...estadoExtraV10(),
  };
}

// v8 -> v9: fabricas passam a produzir itens (escolhe o primeiro produto) e entram o
// inventario e os slots extras de equipamento.
function migrarV8ParaV9(v8: SaveV8): SaveV9 {
  const predios: Record<string, PredioInstancia> = {};
  for (const [id, inst] of Object.entries(v8.predios)) {
    predios[id] = ehFabrica(inst.tipo) ? { ...inst, produto: itensDaFabrica(inst.tipo as FabricaItem, 1)[0]?.id, ultimaColeta: Date.now() } : inst;
  }
  return { ...v8, versao: 9, predios, ...estadoExtraV9() };
}

function migrarV7ParaV8(v7: SaveV7): SaveV8 {
  return { ...v7, versao: 8, bandidos: [], registroGangue: [] };
}

function migrarV6ParaV7(v6: SaveV6): SaveV7 {
  return { ...v6, versao: 7, extorsoes: {} };
}

function migrarV5ParaV6(v5: SaveV5): SaveV6 {
  const predios: Record<string, PredioInstancia> = {};
  let reembolso = v5.terrenosComprados.reduce((soma, id) => soma + precoLoteAntigo(Number(id.replace("lote-", "")) || 0), 0);
  const antigos = Object.values(v5.predios).sort((a, b) => b.nivel - a.nivel);
  for (const antigo of antigos) {
    const destinos = DESTINO_TIPO_ANTIGO[antigo.tipo] ?? [];
    const livre = PREDIOS_CIDADE.find((p) => destinos.includes(p.tipo) && !predios[p.id]);
    if (livre) {
      predios[livre.id] = { tipo: livre.tipo, nivel: antigo.nivel, construidoEm: antigo.construidoEm, ultimaColeta: antigo.ultimaColeta };
    } else {
      const custoAntigo = antigo.tipo === "loja" ? 1200 : PREDIOS[antigo.tipo].custoConstrucao;
      reembolso += custoAntigo * antigo.nivel;
    }
  }
  return {
    versao: 6,
    criadoEm: v5.criadoEm,
    ultimaAtualizacao: v5.ultimaAtualizacao,
    personagem: { ...v5.personagem, dinheiro: v5.personagem.dinheiro + reembolso },
    predios,
    crew: v5.crew,
    territorios: v5.territorios,
    eventoAtivo: v5.eventoAtivo,
    prestigio: v5.prestigio,
    treinosHoje: v5.treinosHoje,
  };
}

function migrarQualquer(lido: unknown): GangstarSave | null {
  if (ehSaveValido(lido)) return lido;
  if (ehSaveV9(lido)) return migrarV9ParaV10(lido);
  if (ehSaveV8(lido)) return migrarV9ParaV10(migrarV8ParaV9(lido));
  if (ehSaveV7(lido)) return migrarV9ParaV10(migrarV8ParaV9(migrarV7ParaV8(lido)));
  if (ehSaveV6(lido)) return migrarV9ParaV10(migrarV8ParaV9(migrarV7ParaV8(migrarV6ParaV7(lido))));
  if (ehSaveV5(lido)) return migrarV9ParaV10(migrarV8ParaV9(migrarV7ParaV8(migrarV6ParaV7(migrarV5ParaV6(lido)))));
  if (ehSaveV4(lido)) return migrarV9ParaV10(migrarV8ParaV9(migrarV7ParaV8(migrarV6ParaV7(migrarV5ParaV6(migrarV4ParaV5(lido))))));
  if (ehSaveV3(lido)) return migrarV9ParaV10(migrarV8ParaV9(migrarV7ParaV8(migrarV6ParaV7(migrarV5ParaV6(migrarV4ParaV5(migrarV3ParaV4(lido)))))));
  if (ehSaveV2(lido)) return migrarV9ParaV10(migrarV8ParaV9(migrarV7ParaV8(migrarV6ParaV7(migrarV5ParaV6(migrarV4ParaV5(migrarV3ParaV4(migrarV2ParaV3(lido))))))));
  return null;
}

const CHAVES_ANTIGAS = [CHAVE_GANGSTAR_V9, CHAVE_GANGSTAR_V8, CHAVE_GANGSTAR_V7, CHAVE_GANGSTAR_V6, CHAVE_GANGSTAR_V5, "gangstar:save:v4", "gangstar:save:v3", "gangstar:save:v2"];

function salvarBruto(save: GangstarSave) {
  try {
    localStorage.setItem(CHAVE_GANGSTAR, JSON.stringify(save));
  } catch {
    // localStorage indisponivel (modo privado etc.): segue sem persistir
  }
}

function criarPersonagem(nome: string, classe: ClasseId): Personagem {
  return {
    nome: nome.trim() || "Sem Nome",
    classe,
    gangue: null,
    nivel: 1,
    xp: 0,
    atributos: { forca: 5, inteligencia: 5, resistencia: 5, carisma: 5 },
    vida: 100,
    vidaMax: 100,
    energia: 100,
    energiaMax: 100,
    vicio: 0,
    dinheiro: 500,
    respeito: 0,
    armas: [],
    armaEquipada: null,
    vezesPreso: 0,
    preso: null,
    banco: { saldo: 0 },
  };
}

export const gangstar = {
  temSalvo(): boolean {
    if (typeof window === "undefined") return false;
    try {
      for (const chave of [CHAVE_GANGSTAR, ...CHAVES_ANTIGAS]) {
        const bruto = localStorage.getItem(chave);
        if (bruto && migrarQualquer(JSON.parse(bruto))) return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  carregar(): GangstarSave | null {
    if (typeof window === "undefined") return null;
    try {
      for (const chave of [CHAVE_GANGSTAR, ...CHAVES_ANTIGAS]) {
        const bruto = localStorage.getItem(chave);
        if (!bruto) continue;
        const migrado = migrarQualquer(JSON.parse(bruto));
        if (!migrado) continue;
        const atualizado = aplicarRegeneracao(migrado);
        salvarBruto(atualizado);
        if (chave !== CHAVE_GANGSTAR) {
          try {
            localStorage.removeItem(chave);
          } catch {
            // ignora
          }
        }
        return atualizado;
      }
      return null;
    } catch {
      return null;
    }
  },

  salvar(save: GangstarSave) {
    salvarBruto(save);
  },

  novoJogo(nome: string, classe: ClasseId): GangstarSave {
    const agora = Date.now();
    const save: GangstarSave = {
      versao: 10,
      criadoEm: agora,
      ultimaAtualizacao: agora,
      personagem: criarPersonagem(nome, classe),
      predios: {},
      crew: [],
      territorios: territoriosIniciais(),
      eventoAtivo: null,
      prestigio: 0,
      treinosHoje: { data: diaDeHoje(), escola: 0, academia: 0 },
      extorsoes: {},
      bandidos: [],
      registroGangue: [],
      ...estadoExtraV9(),
      porto: { janela: 0, concluidos: [], navios: [] },
      emboscadas: { janela: 0, feitas: [], capo: { semana: "", derrotado: false } },
      ...estadoExtraV10(),
    };
    salvarBruto(save);
    return save;
  },

  apagar() {
    try {
      localStorage.removeItem(CHAVE_GANGSTAR);
      for (const chave of CHAVES_ANTIGAS) localStorage.removeItem(chave);
    } catch {
      // ignora
    }
  },
};

// ---------- Acoes ----------

function ganharXp(p: Personagem, xp: number): Personagem {
  const novoXp = p.xp + xp;
  const nivelAnterior = p.nivel;
  const novoNivel = nivelDoXp(novoXp);
  if (novoNivel > nivelAnterior) {
    const ganhos = novoNivel - nivelAnterior;
    return {
      ...p,
      xp: novoXp,
      nivel: novoNivel,
      atributos: {
        forca: p.atributos.forca + ganhos,
        inteligencia: p.atributos.inteligencia + ganhos,
        resistencia: p.atributos.resistencia + ganhos,
        carisma: p.atributos.carisma + ganhos,
      },
    };
  }
  return { ...p, xp: novoXp };
}

export function comprarArma(save: GangstarSave, armaId: string): { save: GangstarSave; erro?: string } {
  const arma = ARMAS.find((a) => a.id === armaId);
  if (!arma) return { save, erro: "Arma não encontrada." };
  if (save.personagem.armas.includes(armaId)) return { save, erro: "Você já tem essa arma." };
  const preco = precoArmaFinal(save, arma);
  if (save.personagem.dinheiro < preco) return { save, erro: "Dinheiro insuficiente." };
  const jaTemArma = !!save.personagem.armaEquipada;
  return {
    save: {
      ...save,
      personagem: {
        ...save.personagem,
        dinheiro: save.personagem.dinheiro - preco,
        armas: [...save.personagem.armas, armaId],
        armaEquipada: jaTemArma ? save.personagem.armaEquipada : armaId,
      },
    },
  };
}

export function equiparArma(save: GangstarSave, armaId: string): GangstarSave {
  if (!save.personagem.armas.includes(armaId)) return save;
  return { ...save, personagem: { ...save.personagem, armaEquipada: armaId } };
}

const CUSTO_CRIAR_GANGUE = 10000;

export function definirGangue(save: GangstarSave, nome: string): { save: GangstarSave; erro?: string } {
  const limpo = nome.trim();
  const jaTinhaGangue = !!save.personagem.gangue;
  if (limpo && !jaTinhaGangue) {
    if (save.personagem.dinheiro < CUSTO_CRIAR_GANGUE) {
      return { save, erro: `Você precisa de R$ ${CUSTO_CRIAR_GANGUE.toLocaleString("pt-BR")} para criar uma gangue.` };
    }
    return {
      save: {
        ...save,
        personagem: { ...save.personagem, gangue: limpo, dinheiro: save.personagem.dinheiro - CUSTO_CRIAR_GANGUE },
      },
    };
  }
  return { save: { ...save, personagem: { ...save.personagem, gangue: limpo || null } } };
}

export function custoCriarGangue(): number {
  return CUSTO_CRIAR_GANGUE;
}

export function pagarFianca(save: GangstarSave): { save: GangstarSave; erro?: string } {
  const p = save.personagem;
  if (!p.preso) return { save, erro: "Você não está preso." };
  if (p.preso.hospital) return { save, erro: "Você está internado no hospital." };
  const fianca = custoFianca(p);
  if (p.dinheiro < fianca) return { save, erro: "Dinheiro insuficiente para a fiança." };
  return {
    save: {
      ...save,
      personagem: { ...p, dinheiro: p.dinheiro - fianca, preso: null },
    },
  };
}

// Motim: 12% de chance de fugir. Se falhar, a pena aumenta 5 minutos e nao da pra
// tentar de novo ate sair dessa prisao.
const CHANCE_MOTIM = 0.12;

export function podeFazerMotim(save: GangstarSave): boolean {
  return !!save.personagem.preso && !save.personagem.preso.hospital && !save.personagem.preso.motimFalhou;
}

function fazerMotimBase(save: GangstarSave): { save: GangstarSave; erro?: string; fugiu?: boolean } {
  const p = save.personagem;
  if (!p.preso) return { save, erro: "Você não está preso." };
  if (p.preso.hospital) return { save, erro: "Você está internado no hospital." };
  if (p.preso.motimFalhou) return { save, erro: "Seu motim já falhou. Os guardas estão de olho em você." };
  if (Math.random() < CHANCE_MOTIM) {
    return { save: { ...save, personagem: { ...p, preso: null } }, fugiu: true };
  }
  return {
    save: { ...save, personagem: { ...p, preso: { ate: p.preso.ate + 5 * 60 * 1000, motimFalhou: true } } },
    fugiu: false,
  };
}

function custoFianca(p: Personagem): number {
  // Baseado na ultima prisao: usa o maior fiancaBase dos roubos como referencia de escala,
  // ponderado pelo numero de vezes presa (quanto mais reincidente, mais caro sair).
  const base = 200 + p.nivel * 120;
  return Math.round(base * (1 + p.vezesPreso * 0.25));
}

export function custoFiancaAtual(save: GangstarSave): number {
  return custoFianca(save.personagem);
}

export type ResultadoRoubo =
  | { tipo: "sucesso"; dinheiro: number; respeito: number; xp: number; comissao?: number; ocorrencias?: string[] }
  | { tipo: "falha-fugiu"; ocorrencias?: string[] }
  | { tipo: "falha-preso"; minutos: number; fianca: number; ocorrencias?: string[] };

function tentarRouboBase(save: GangstarSave, rouboId: string): { save: GangstarSave; resultado?: ResultadoRoubo; erro?: string } {
  const roubo = ROUBOS.find((r) => r.id === rouboId);
  if (!roubo) return { save, erro: "Roubo não encontrado." };
  const p = save.personagem;
  if (p.preso) return { save, erro: msgBloqueado(p) };
  if (p.nivel < roubo.nivelMin) return { save, erro: "Nível insuficiente." };
  if (p.energia < roubo.energiaCusto) return { save, erro: "Energia insuficiente." };

  const sucesso = Math.random() < chanceSucesso(save, roubo);
  const energiaRestante = p.energia - roubo.energiaCusto;

  if (sucesso) {
    const bonusAssaltante = p.classe === "assaltante" ? 1.15 : 1;
    const bonusEvento = eventoEstaAtivo(save, "policia-greve") ? 1.5 : 1;
    const bonusPrest = 1 + bonusPrestigio(save);
    const dinheiroGanho = Math.round(
      (roubo.dinheiroMin + Math.random() * (roubo.dinheiroMax - roubo.dinheiroMin)) * bonusAssaltante * bonusEvento * bonusPrest,
    );
    const comissao = Math.round(dinheiroGanho * comissaoAssaltantes(save));
    const respeitoGanho = Math.round(roubo.respeito * (1 + bonusEspecial(save, "respeito")));
    let novoP: Personagem = { ...p, energia: energiaRestante, dinheiro: p.dinheiro + dinheiroGanho - comissao, respeito: p.respeito + respeitoGanho };
    novoP = ganharXp(novoP, roubo.xp);
    const lealdade = ajustarLealdade({ ...save, personagem: novoP }, "assaltante", 2);
    return { save: lealdade, resultado: { tipo: "sucesso", dinheiro: dinheiroGanho - comissao, respeito: respeitoGanho, xp: roubo.xp, comissao } };
  }

  const fuga = riscoFuga(save);
  save = fuga.save;
  const preso = Math.random() < chancePrisaoSeFalhar(save, roubo);
  if (preso) {
    const ate = Date.now() + roubo.prisaoMinutos * 60 * 1000;
    const novoP: Personagem = { ...p, energia: energiaRestante, vezesPreso: p.vezesPreso + 1, preso: { ate } };
    return { save: { ...save, personagem: novoP }, resultado: { tipo: "falha-preso", minutos: roubo.prisaoMinutos, fianca: custoFianca(novoP), ocorrencias: fuga.ocorrencias } };
  }

  return { save: { ...save, personagem: { ...p, energia: energiaRestante } }, resultado: { tipo: "falha-fugiu", ocorrencias: fuga.ocorrencias } };
}

// ---------- Construção e produção dos prédios (Fase 2) ----------

// Comprar um predio abandonado do mapa: ele ja vem reformado e funcionando (nivel 1).
export function comprarPredio(save: GangstarSave, predioId: string): { save: GangstarSave; erro?: string } {
  const slot = PREDIOS_CIDADE.find((p) => p.id === predioId);
  if (!slot) return { save, erro: "Prédio não encontrado." };
  if (save.predios[predioId]) return { save, erro: "Esse prédio já é seu." };
  if (slot.tipo === "recrutamento" && !save.personagem.gangue) return { save, erro: "Crie uma gangue antes de abrir um ponto de recrutamento." };
  const preco = precoPredio(save, predioId);
  if (save.personagem.dinheiro < preco) return { save, erro: "Dinheiro insuficiente." };
  const agora = Date.now();
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - preco },
      predios: {
        ...save.predios,
        [predioId]: {
          tipo: slot.tipo,
          nivel: 1,
          construidoEm: agora,
          ultimaColeta: agora,
          ...(ehFabrica(slot.tipo) ? { produto: itensDaFabrica(slot.tipo as FabricaItem, 1)[0]?.id } : {}),
        },
      },
    },
  };
}

export function upgradarPredio(save: GangstarSave, loteId: string): { save: GangstarSave; erro?: string } {
  const instancia = save.predios[loteId];
  if (!instancia) return { save, erro: "Não há prédio nesse lote." };
  if (instancia.nivel >= nivelMaxPredio(instancia.tipo)) return { save, erro: "Prédio já está no nível máximo." };
  const custo = custoUpgrade(instancia.tipo, instancia.nivel);
  if (save.personagem.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - custo },
      predios: { ...save.predios, [loteId]: comLinhasNovas({ ...instancia, nivel: instancia.nivel + 1 }) },
    },
  };
}

export function coletarProducao(save: GangstarSave, loteId: string): { save: GangstarSave; erro?: string; valor?: number } {
  const instancia = save.predios[loteId];
  if (!instancia) return { save, erro: "Não há prédio nesse lote." };
  const valor = producaoPendente(instancia, save);
  if (valor <= 0) return { save, erro: "Nada para coletar ainda." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro + valor },
      predios: { ...save.predios, [loteId]: { ...instancia, ultimaColeta: Date.now() } },
    },
    valor,
  };
}

export function coletarTudo(save: GangstarSave): { save: GangstarSave; erro?: string; valor?: number } {
  const total = producaoTotalPendente(save);
  if (total <= 0) return { save, erro: "Nada para coletar ainda." };
  const agora = Date.now();
  const novosPredios: Record<string, PredioInstancia> = {};
  for (const [id, inst] of Object.entries(save.predios)) {
    novosPredios[id] = producaoPendente(inst, save) > 0 ? { ...inst, ultimaColeta: agora } : inst;
  }
  return {
    save: { ...save, personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro + total }, predios: novosPredios },
    valor: total,
  };
}

// ---------- Serviços da Cidade (hub) - Fase 2 ----------

export function custoCura(p: Personagem): number {
  return Math.max(0, Math.ceil((p.vidaMax - p.vida) * 6));
}

export function curarNoHospital(save: GangstarSave): { save: GangstarSave; erro?: string } {
  const p = save.personagem;
  const custo = custoCura(p);
  if (custo === 0) return { save, erro: "Sua vida já está cheia." };
  if (p.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  return { save: { ...save, personagem: { ...p, dinheiro: p.dinheiro - custo, vida: p.vidaMax } } };
}

const CUSTO_DESINTOX_POR_PONTO = 45;

export function custoDesintoxicacao(save: GangstarSave, pontos: number): number {
  return Math.min(pontos, save.personagem.vicio) * CUSTO_DESINTOX_POR_PONTO;
}

// tratamento de desintoxicacao: baixa o vicio (pontos = quanto reduzir)
export function desintoxicar(save: GangstarSave, pontos: number): { save: GangstarSave; erro?: string } {
  const p = save.personagem;
  if (p.vicio <= 0) return { save, erro: "Você não tem vício para tratar." };
  const reduz = Math.min(pontos, p.vicio);
  const custo = reduz * CUSTO_DESINTOX_POR_PONTO;
  if (p.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  return { save: { ...save, personagem: { ...p, dinheiro: p.dinheiro - custo, vicio: p.vicio - reduz } } };
}

export function depositarBanco(save: GangstarSave, valor: number): { save: GangstarSave; erro?: string } {
  const p = save.personagem;
  if (valor <= 0) return { save, erro: "Informe um valor válido." };
  if (p.dinheiro < valor) return { save, erro: "Dinheiro insuficiente." };
  return { save: { ...save, personagem: { ...p, dinheiro: p.dinheiro - valor, banco: { saldo: p.banco.saldo + valor } } } };
}

export function sacarBanco(save: GangstarSave, valor: number): { save: GangstarSave; erro?: string } {
  const p = save.personagem;
  if (valor <= 0) return { save, erro: "Informe um valor válido." };
  if (p.banco.saldo < valor) return { save, erro: "Saldo insuficiente." };
  return { save: { ...save, personagem: { ...p, dinheiro: p.dinheiro + valor, banco: { saldo: p.banco.saldo - valor } } } };
}

// Cursos/treinos em niveis: cada opcao da um ganho de atributo, gasta energia e dinheiro
// e da XP (em dobro na segunda para a academia e na terca para a escola).
export type LocalTreino = "escola" | "academia";

export interface OpcaoTreino {
  id: string;
  local: LocalTreino;
  nome: string;
  emoji: string;
  ganho: number;
  energia: number;
  custo: number;
  nivelMin: number;
  xp: number;
}

export const OPCOES_TREINO: OpcaoTreino[] = [
  // v4.58: rebalanceado - os niveis mais altos rendem mais por energia e por real gasto
  { id: "raciocinio-logico", local: "escola", nome: "Estudar raciocínio lógico", emoji: "🧩", ganho: 3, energia: 10, custo: 300, nivelMin: 1, xp: 20 },
  { id: "nocoes-direito", local: "escola", nome: "Estudar noções de direito", emoji: "⚖️", ganho: 8, energia: 22, custo: 720, nivelMin: 9, xp: 45 },
  { id: "hacking", local: "escola", nome: "Curso de hacking e criptografia", emoji: "💻", ganho: 16, energia: 38, custo: 1300, nivelMin: 15, xp: 80 },
  { id: "funcional", local: "academia", nome: "Treino funcional", emoji: "🤸", ganho: 3, energia: 10, custo: 300, nivelMin: 1, xp: 20 },
  { id: "musculacao", local: "academia", nome: "Musculação pesada", emoji: "🏋️", ganho: 8, energia: 22, custo: 720, nivelMin: 9, xp: 45 },
  { id: "mma", local: "academia", nome: "Treino de luta (MMA)", emoji: "🥊", ganho: 16, energia: 38, custo: 1300, nivelMin: 15, xp: 80 },
];

// v4.64: nos dias de "XP 2x" o treino tambem da o dobro de forca / intelecto
export function ganhoDoTreino(opcao: OpcaoTreino): number {
  const dobro = (opcao.local === "academia" && eventoDiarioAtivo("academia-dobro")) || (opcao.local === "escola" && eventoDiarioAtivo("escola-dobro"));
  return opcao.ganho * (dobro ? 2 : 1);
}

export function xpDoTreino(opcao: OpcaoTreino): number {
  const dobro = (opcao.local === "academia" && eventoDiarioAtivo("academia-dobro")) || (opcao.local === "escola" && eventoDiarioAtivo("escola-dobro"));
  return opcao.xp * (dobro ? 2 : 1);
}

const LIMITE_TREINOS_DIA = 5;

function diaDeHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function treinosDeHoje(save: GangstarSave): TreinosDia {
  if (save.treinosHoje.data === diaDeHoje()) return save.treinosHoje;
  return { data: diaDeHoje(), escola: 0, academia: 0 };
}

export function treinosRestantesHoje(save: GangstarSave): { escola: number; academia: number } {
  const hoje = treinosDeHoje(save);
  return { escola: Math.max(0, LIMITE_TREINOS_DIA - hoje.escola), academia: Math.max(0, LIMITE_TREINOS_DIA - hoje.academia) };
}

export function treinar(save: GangstarSave, opcaoId: string): { save: GangstarSave; erro?: string; xp?: number } {
  const opcao = OPCOES_TREINO.find((o) => o.id === opcaoId);
  if (!opcao) return { save, erro: "Treino não encontrado." };
  const p = save.personagem;
  const hoje = treinosDeHoje(save);
  if (hoje[opcao.local] >= LIMITE_TREINOS_DIA) {
    return { save, erro: `Você já ${opcao.local === "escola" ? "estudou" : "treinou"} ${LIMITE_TREINOS_DIA}x hoje. Volte amanhã.` };
  }
  if (p.nivel < opcao.nivelMin) return { save, erro: `Disponível a partir do nível ${opcao.nivelMin}.` };
  if (p.energia < opcao.energia) return { save, erro: "Energia insuficiente." };
  if (p.dinheiro < opcao.custo) return { save, erro: "Dinheiro insuficiente." };
  const atributo = opcao.local === "escola" ? "inteligencia" : "forca";
  const xp = xpDoTreino(opcao);
  const base: Personagem = {
    ...p,
    dinheiro: p.dinheiro - opcao.custo,
    energia: p.energia - opcao.energia,
    atributos: { ...p.atributos, [atributo]: p.atributos[atributo] + ganhoDoTreino(opcao) },
  };
  return {
    save: { ...save, personagem: ganharXp(base, xp), treinosHoje: { ...hoje, [opcao.local]: hoje[opcao.local] + 1 } },
    xp,
  };
}

// ---------- Extorsoes (estabelecimentos dominados pela forca) ----------

export interface ExtorsaoDef {
  id: string;
  nome: string;
  emoji: string;
  poderMin: number;
  rendaPorHora: number;
}

export const EXTORSOES: ExtorsaoDef[] = [
  { id: "banca", nome: "Banca de jornal", emoji: "📰", poderMin: 35, rendaPorHora: 40 },
  { id: "lava-jato", nome: "Lava-jato", emoji: "🚿", poderMin: 55, rendaPorHora: 80 },
  { id: "padaria", nome: "Padaria do bairro", emoji: "🥖", poderMin: 80, rendaPorHora: 120 },
  { id: "oficina", nome: "Oficina mecânica", emoji: "🔧", poderMin: 110, rendaPorHora: 180 },
  { id: "bar", nome: "Bar do Zé", emoji: "🍺", poderMin: 145, rendaPorHora: 260 },
  { id: "posto", nome: "Posto de gasolina", emoji: "⛽", poderMin: 185, rendaPorHora: 360 },
  { id: "cambio", nome: "Casa de câmbio", emoji: "💱", poderMin: 230, rendaPorHora: 500 },
  { id: "cassino", nome: "Cassino clandestino", emoji: "🎰", poderMin: 290, rendaPorHora: 720 },
];

// v4.60: extorsoes mais dificeis (poder minimo +20%)
for (const e of EXTORSOES) e.poderMin = Math.round(e.poderMin * 1.2);

const ENERGIA_CONQUISTA = 25;
const ESTOQUE_MAX_HORAS_EXTORSAO = 12;
const CHANCE_PRISAO_COLETA = 0.2;

export function energiaConquistaExtorsao(): number {
  return ENERGIA_CONQUISTA;
}

export function extorsaoPendente(save: GangstarSave, id: string): number {
  const def = EXTORSOES.find((e) => e.id === id);
  const inst = save.extorsoes[id];
  if (!def || !inst) return 0;
  const horas = Math.min(ESTOQUE_MAX_HORAS_EXTORSAO, (Date.now() - inst.ultimaColeta) / 3600000);
  return Math.floor(horas * def.rendaPorHora * fatorColetaDoDia() * fatorContrabando(save) * (1 + bonusEspecial(save, "extorsao")));
}

export function chancePrisaoExtorsao(save: GangstarSave): number {
  const reducao = save.personagem.atributos.resistencia * 0.003;
  return Math.max(0.03, Math.min(0.6, (CHANCE_PRISAO_COLETA - reducao) * fatorPrisaoDoDia() * fatorPiloto(save) * (1 - bonusEspecial(save, "prisao"))));
}

function conquistarExtorsaoBase(save: GangstarSave, id: string): { save: GangstarSave; erro?: string } {
  const def = EXTORSOES.find((e) => e.id === id);
  const p = save.personagem;
  if (!def) return { save, erro: "Estabelecimento não encontrado." };
  if (save.extorsoes[id]) return { save, erro: "Esse estabelecimento já paga pra você." };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  if (poderDeRoubo(save) < def.poderMin) return { save, erro: `Precisa de poder ${def.poderMin} para intimidar o dono.` };
  if (p.energia < ENERGIA_CONQUISTA) return { save, erro: "Energia insuficiente." };
  const agora = Date.now();
  return {
    save: {
      ...save,
      personagem: { ...p, energia: p.energia - ENERGIA_CONQUISTA, respeito: p.respeito + Math.round(def.poderMin / 2) },
      extorsoes: { ...save.extorsoes, [id]: { conquistadoEm: agora, ultimaColeta: agora } },
    },
  };
}

export type ResultadoExtorsao = { tipo: "coletou"; valor: number } | { tipo: "preso"; minutos: number; perdido: number };

function coletarExtorsaoBase(save: GangstarSave, id: string): { save: GangstarSave; erro?: string; resultado?: ResultadoExtorsao } {
  const inst = save.extorsoes[id];
  const p = save.personagem;
  if (!inst) return { save, erro: "Esse estabelecimento não é seu." };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  const valor = extorsaoPendente(save, id);
  if (valor <= 0) return { save, erro: "Nada para coletar ainda." };
  const agora = Date.now();
  const extorsoes = { ...save.extorsoes, [id]: { ...inst, ultimaColeta: agora } };
  if (Math.random() < chancePrisaoExtorsao(save)) {
    const minutos = 10;
    return {
      save: { ...save, extorsoes, personagem: { ...p, vezesPreso: p.vezesPreso + 1, preso: { ate: agora + minutos * 60 * 1000 } } },
      resultado: { tipo: "preso", minutos, perdido: valor },
    };
  }
  return {
    save: { ...save, extorsoes, personagem: { ...p, dinheiro: p.dinheiro + valor } },
    resultado: { tipo: "coletou", valor },
  };
}

// Boate: tres jeitos de recuperar energia, cada um com seu preco, ganho de energia e
// nivel de intoxicacao (vicio). Com o vicio no maximo voce nao consegue consumir mais.
export type OpcaoBoate = "bebidas" | "drogas" | "garotas";

export interface OpcaoBoateDef {
  id: OpcaoBoate;
  nome: string;
  emoji: string;
  descricao: string;
  custo: number;
  energia: number;
  vicio: number;
}

export const OPCOES_BOATE: OpcaoBoateDef[] = [
  { id: "bebidas", nome: "Bebidas", emoji: "🍸", descricao: "Uma rodada no bar. Recupera pouco, intoxica pouco.", custo: 180, energia: 25, vicio: 4 },
  { id: "drogas", nome: "Drogas", emoji: "💊", descricao: "Recupera muita energia, mas intoxica bastante.", custo: 450, energia: 65, vicio: 16 },
  { id: "garotas", nome: "Garotas", emoji: "💃", descricao: "Noite na área VIP com companhia. Recupera bem, intoxica moderado.", custo: 650, energia: 50, vicio: 8 },
];

const VICIO_MAX = 100;

export function custoBoateAtual(save: GangstarSave, opcao: OpcaoBoate = "bebidas"): number {
  const def = OPCOES_BOATE.find((o) => o.id === opcao) ?? OPCOES_BOATE[0];
  return eventoEstaAtivo(save, "batida-boates") ? Math.round(def.custo * 1.5) : def.custo;
}

function curtirNaBoateBase(save: GangstarSave, opcao: OpcaoBoate = "bebidas"): { save: GangstarSave; erro?: string } {
  const p = save.personagem;
  const def = OPCOES_BOATE.find((o) => o.id === opcao) ?? OPCOES_BOATE[0];
  const custo = custoBoateAtual(save, opcao);
  if (p.energia >= p.energiaMax) return { save, erro: "Sua energia já está cheia." };
  if (p.vicio + def.vicio > VICIO_MAX) return { save, erro: "Você está intoxicado demais. Espere o vício baixar (cai 1 ponto a cada 10 min)." };
  if (p.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  return {
    save: {
      ...save,
      personagem: { ...p, dinheiro: p.dinheiro - custo, energia: Math.min(p.energiaMax, p.energia + def.energia), vicio: Math.min(VICIO_MAX, p.vicio + def.vicio) },
    },
  };
}

export function proximoNivelInfo(p: Personagem): { atual: number; proximo: number | null; faltam: number } {
  const atual = LIMIARES_NIVEL[p.nivel - 1] ?? 0;
  const proximo = LIMIARES_NIVEL[p.nivel] ?? null;
  return { atual, proximo, faltam: proximo !== null ? Math.max(0, proximo - p.xp) : 0 };
}

// =====================================================================================
// v4.58: fabricas produzem itens, inventario, equipamento, Mercador, Porto e Emboscada
// =====================================================================================

// ---------- Producao das fabricas ----------

const HORAS_ESTOQUE_FABRICA = 12;

// valor (em R$ de referencia) que a fabrica produz por hora, conforme o nivel
export function valorProducaoHora(inst: PredioInstancia, save?: GangstarSave): number {
  let v = 150 * Math.pow(inst.nivel, 1.6);
  if (save) v *= (1 + bonusZonasProducao(save)) * fatorContrabando(save);
  return v;
}

export function produtoDaFabrica(inst: PredioInstancia): ItemDef | null {
  if (!ehFabrica(inst.tipo)) return null;
  const escolhido = itemPorId(inst.produto);
  if (escolhido && escolhido.fabrica === inst.tipo && escolhido.nivel <= inst.nivel) return escolhido;
  return itensDaFabrica(inst.tipo as FabricaItem, inst.nivel)[0] ?? null;
}

// horas para fabricar 1 unidade do produto atual
export function horasPorUnidade(inst: PredioInstancia, save?: GangstarSave): number {
  const item = produtoDaFabrica(inst);
  if (!item) return Infinity;
  return item.valor / valorProducaoHora(inst, save);
}

// quantas unidades prontas (o estoque guarda 12h, e sempre cabe pelo menos 1 unidade)
export function unidadesProntas(inst: PredioInstancia, save?: GangstarSave): number {
  const hpu = horasPorUnidade(inst, save);
  if (!isFinite(hpu)) return 0;
  const horas = (Date.now() - inst.ultimaColeta) / 3600000;
  const capacidade = Math.max(1, Math.floor(HORAS_ESTOQUE_FABRICA / hpu));
  return Math.min(capacidade, Math.floor(horas / hpu));
}

export function capacidadeFabrica(inst: PredioInstancia, save?: GangstarSave): number {
  const hpu = horasPorUnidade(inst, save);
  return isFinite(hpu) ? Math.max(1, Math.floor(HORAS_ESTOQUE_FABRICA / hpu)) : 0;
}

// ---------- Qualidade (1 a 5 estrelas) ----------

export function chaveItem(id: string, q: number): string {
  return `${id}@${q}`;
}

export function parseChave(chave: string): { id: string; q: number } {
  const [id, q] = chave.split("@");
  return { id, q: Math.max(1, Math.min(5, Number(q) || 1)) };
}

export function multQualidade(q: number): number {
  return 1 + (q - 1) * 0.15;
}

export function estrelas(q: number): string {
  return "★".repeat(q) + "☆".repeat(5 - q);
}

// qualidade do que a fabrica produz: sobe com o nivel e com contrabandistas na gangue
export function qualidadeFabrica(inst: PredioInstancia, save: GangstarSave): number {
  const porNivel = 1 + Math.floor((inst.nivel - 1) / 3);
  const porGangue = Math.min(2, Math.floor(poderClasse(save, "contrabandista") / 40));
  return Math.max(1, Math.min(5, porNivel + porGangue));
}

function addInventario(inv: Record<string, number>, chave: string, qtd: number): Record<string, number> {
  const k = chave.includes("@") ? chave : chaveItem(chave, 1);
  const novo = { ...inv, [k]: (inv[k] ?? 0) + qtd };
  if (novo[k] <= 0) delete novo[k];
  return novo;
}

// pilhas de um item (todas as qualidades), da pior para a melhor
export function pilhasDoItem(save: GangstarSave, id: string): { chave: string; q: number; qtd: number }[] {
  return Object.entries(save.inventario ?? {})
    .map(([chave, qtd]) => ({ chave, qtd, ...parseChave(chave) }))
    .filter((x) => x.id === id && x.qtd > 0)
    .sort((a, b) => a.q - b.q)
    .map(({ chave, q, qtd }) => ({ chave, q, qtd }));
}

// tira itens (por id = piores primeiro, ou por chave exata); devolve as qualidades retiradas
function retirarDoInventario(inv: Record<string, number>, idOuChave: string, qtd: number): { inv: Record<string, number>; qualidades: number[] } {
  let novo = { ...inv };
  const qualidades: number[] = [];
  let falta = qtd;
  const chaves = idOuChave.includes("@")
    ? [idOuChave]
    : Object.keys(novo)
        .filter((k) => parseChave(k).id === idOuChave)
        .sort((a, b) => parseChave(a).q - parseChave(b).q);
  for (const k of chaves) {
    while (falta > 0 && (novo[k] ?? 0) > 0) {
      novo = addInventario(novo, k, -1);
      qualidades.push(parseChave(k).q);
      falta--;
    }
  }
  return { inv: novo, qualidades };
}

// coleta uma linha de producao: devolve o item, a quantidade e o novo relogio da linha
function coletarLinha(inst: PredioInstancia, save: GangstarSave): { item: ItemDef | null; qtd: number; ultimaColeta: number } {
  const item = produtoDaFabrica(inst);
  const qtd = unidadesProntas(inst, save);
  if (!item || qtd <= 0) return { item, qtd: 0, ultimaColeta: inst.ultimaColeta };
  const hpu = horasPorUnidade(inst, save);
  const horasDesde = (Date.now() - inst.ultimaColeta) / 3600000;
  // guarda a fracao da proxima unidade (se nao estava lotado)
  const lotado = qtd >= capacidadeFabrica(inst, save) && horasDesde >= (qtd + 1) * hpu;
  return { item, qtd, ultimaColeta: lotado ? Date.now() : inst.ultimaColeta + qtd * hpu * 3600000 };
}

export function coletarFabrica(
  save: GangstarSave,
  predioId: string,
): { save: GangstarSave; erro?: string; item?: ItemDef; qtd?: number; itens?: { item: ItemDef; qtd: number }[] } {
  const inst = save.predios[predioId];
  if (!inst || !ehFabrica(inst.tipo)) return { save, erro: "Essa não é uma fábrica sua." };
  const q = qualidadeFabrica(inst, save);
  let inv = save.inventario;
  let novaInst: PredioInstancia = { ...inst, linhas: [...(inst.linhas ?? [])] };
  const itens: { item: ItemDef; qtd: number }[] = [];
  for (let i = 0; i < linhasFabrica(inst); i++) {
    const r = coletarLinha(instLinha(inst, i), save);
    if (!r.item || r.qtd <= 0) continue;
    inv = addInventario(inv, chaveItem(r.item.id, q), r.qtd);
    itens.push({ item: r.item, qtd: r.qtd });
    if (i === 0) novaInst = { ...novaInst, ultimaColeta: r.ultimaColeta };
    else novaInst.linhas![i - 1] = { produto: novaInst.linhas![i - 1]?.produto ?? r.item.id, ultimaColeta: r.ultimaColeta };
  }
  if (!itens.length) return { save, erro: "Nada pronto ainda." };
  const total = itens.reduce((a, x) => a + x.qtd, 0);
  return {
    save: contar({ ...save, inventario: inv, predios: { ...save.predios, [predioId]: novaInst } }, "itensProduzidos", total),
    item: itens[0].item,
    qtd: total,
    itens,
  };
}

// trocar o produto: coleta o que estiver pronto e recomeca a producao do novo item
export function definirProdutoFabrica(save: GangstarSave, predioId: string, itemId: string, linha = 0): { save: GangstarSave; erro?: string } {
  const inst = save.predios[predioId];
  const item = itemPorId(itemId);
  if (!inst || !ehFabrica(inst.tipo) || !item || item.fabrica !== inst.tipo) return { save, erro: "Produto inválido." };
  if (item.nivel > inst.nivel) return { save, erro: `Esse produto libera no nível ${item.nivel} da fábrica.` };
  if (linha < 0 || linha >= linhasFabrica(inst)) return { save, erro: "Linha de produção bloqueada." };
  let base = save;
  if (unidadesProntasTotal(inst, save) > 0) base = coletarFabrica(save, predioId).save;
  const atual = comLinhasNovas(base.predios[predioId]);
  if (linha === 0) return { save: { ...base, predios: { ...base.predios, [predioId]: { ...atual, produto: itemId, ultimaColeta: Date.now() } } } };
  const linhas = [...(atual.linhas ?? [])];
  linhas[linha - 1] = { produto: itemId, ultimaColeta: Date.now() };
  return { save: { ...base, predios: { ...base.predios, [predioId]: { ...atual, linhas } } } };
}

// ---------- Inventario: usar, equipar ----------

export function qtdItem(save: GangstarSave, idOuChave: string): number {
  if (idOuChave.includes("@")) return save.inventario?.[idOuChave] ?? 0;
  return pilhasDoItem(save, idOuChave).reduce((a, b) => a + b.qtd, 0);
}

function usarItemBase(save: GangstarSave, idOuChave: string): { save: GangstarSave; erro?: string } {
  const itemId = parseChave(idOuChave).id;
  const item = itemPorId(itemId);
  const p = save.personagem;
  if (!item || !ehConsumivel(item)) return { save, erro: "Esse item não pode ser consumido." };
  if (qtdItem(save, idOuChave) <= 0) return { save, erro: "Você não tem esse item." };
  if (p.vicio + (item.vicio ?? 0) > 100) return { save, erro: "Você está intoxicado demais para consumir isso." };
  const energiaCheia = !item.energia || p.energia >= p.energiaMax;
  const vidaCheia = !item.vida || p.vida >= p.vidaMax;
  if (energiaCheia && vidaCheia) return { save, erro: "Sua energia e vida já estão cheias." };
  return {
    save: {
      ...save,
      inventario: retirarDoInventario(save.inventario, idOuChave, 1).inv,
      personagem: {
        ...p,
        energia: Math.min(p.energiaMax, p.energia + (item.energia ?? 0)),
        vida: Math.min(p.vidaMax, p.vida + (item.vida ?? 0)),
        vicio: Math.min(100, p.vicio + (item.vicio ?? 0)),
      },
    },
  };
}

export function equiparItem(save: GangstarSave, idOuChave: string): { save: GangstarSave; erro?: string } {
  const itemId = parseChave(idOuChave).id;
  const item = itemPorId(itemId);
  if (!item || (item.categoria !== "arma" && item.categoria !== "colete" && item.categoria !== "especial")) return { save, erro: "Esse item não é equipável." };
  if (qtdItem(save, itemId) <= 0) return { save, erro: "Você não tem esse item." };
  if (item.categoria === "especial") return { save: { ...save, equipamento: { ...save.equipamento, especial: itemId } } };
  if (item.categoria === "arma") return { save: { ...save, personagem: { ...save.personagem, armaEquipada: itemId } } };
  return { save: { ...save, equipamento: { ...save.equipamento, colete: itemId } } };
}

export function desequipar(save: GangstarSave, slot: "arma" | "colete" | "especial"): GangstarSave {
  if (slot === "arma") return { ...save, personagem: { ...save.personagem, armaEquipada: null } };
  return { ...save, equipamento: { ...save.equipamento, [slot]: null } };
}

// remove itens do inventario; se acabar o item equipado, desequipa
function removerItensQ(save: GangstarSave, itens: { id: string; qtd: number }[]): { save: GangstarSave; qualidades: number[] } {
  let inv = save.inventario;
  const qualidades: number[] = [];
  for (const { id, qtd } of itens) {
    const r = retirarDoInventario(inv, id, qtd);
    inv = r.inv;
    qualidades.push(...r.qualidades);
  }
  let novo: GangstarSave = { ...save, inventario: inv };
  const arma = novo.personagem.armaEquipada;
  if (arma && itemPorId(arma) && qtdItem(novo, arma) <= 0) novo = { ...novo, personagem: { ...novo.personagem, armaEquipada: null } };
  const colete = novo.equipamento.colete;
  if (colete && qtdItem(novo, colete) <= 0) novo = { ...novo, equipamento: { ...novo.equipamento, colete: null } };
  const especial = novo.equipamento.especial;
  if (especial && qtdItem(novo, especial) <= 0) novo = { ...novo, equipamento: { ...novo.equipamento, especial: null } };
  return { save: novo, qualidades };
}

function removerItens(save: GangstarSave, itens: { id: string; qtd: number }[]): GangstarSave {
  return removerItensQ(save, itens).save;
}

// ---------- Mercador (evento em horarios aleatorios do dia) ----------

const VISITAS_MERCADOR_DIA = 3;
const DURACAO_MERCADOR_MIN = 45;

function hashTexto(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
}

function dataLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// horarios do dia (em minutos desde 00:00): 3 visitas entre 08:00 e 23:00, sem sobrepor
function visitasDoDia(dia: string): number[] {
  const rnd = rngSemente(hashTexto(`mercador-${dia}`));
  const faixa = (23 * 60 - 8 * 60) / VISITAS_MERCADOR_DIA;
  return Array.from({ length: VISITAS_MERCADOR_DIA }, (_, i) => Math.round(8 * 60 + i * faixa + rnd() * (faixa - DURACAO_MERCADOR_MIN)));
}

export interface VisitaMercador {
  id: string;
  inicio: number;
  fim: number;
}

export function mercadorAtual(agora = Date.now()): VisitaMercador | null {
  const d = new Date(agora);
  const dia = dataLocal(d);
  const minutos = d.getHours() * 60 + d.getMinutes();
  const meiaNoite = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  for (const [i, ini] of visitasDoDia(dia).entries()) {
    if (minutos >= ini && minutos < ini + DURACAO_MERCADOR_MIN) {
      return { id: `${dia}-${i}`, inicio: meiaNoite + ini * 60000, fim: meiaNoite + (ini + DURACAO_MERCADOR_MIN) * 60000 };
    }
  }
  return null;
}

export function proximaVisitaMercador(agora = Date.now()): number {
  for (let dia = 0; dia < 2; dia++) {
    const d = new Date(agora + dia * 86400000);
    const meiaNoite = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    for (const ini of visitasDoDia(dataLocal(d))) {
      const t = meiaNoite + ini * 60000;
      if (t > agora) return t;
    }
  }
  return agora + 86400000;
}

export interface OfertaMercador {
  item: ItemDef;
  q: number;
  preco: number;
  estoque: number;
}

function nivelItensDisponiveis(save: GangstarSave): number {
  // libera no nivel 7 (2 produtos por fabrica) e ganha 1 produto a cada 2 niveis, ate 10 no nivel 23
  return Math.max(2, Math.min(10, 2 + Math.floor((save.personagem.nivel - 7) / 2)));
}

export function ofertasMercador(save: GangstarSave, visita: VisitaMercador): OfertaMercador[] {
  const rnd = rngSemente(hashTexto(`ofertas-${visita.id}`));
  const pool = ITENS.filter((i) => i.nivel <= nivelItensDisponiveis(save));
  const escolhidos = new Set<string>();
  const ofertas: OfertaMercador[] = [];
  while (ofertas.length < 6 && escolhidos.size < pool.length) {
    const item = pool[Math.floor(rnd() * pool.length)];
    if (escolhidos.has(item.id)) continue;
    escolhidos.add(item.id);
    const comprados = save.mercador.visita === visita.id ? save.mercador.comprados[item.id] ?? 0 : 0;
    const estoqueBase = item.categoria === "arma" || item.categoria === "colete" ? 1 : 2 + Math.floor(rnd() * 4);
    const q = 1 + Math.floor(rnd() * 3);
    ofertas.push({ item, q, preco: Math.round((item.valor * multQualidade(q) * 0.75) / 5) * 5, estoque: Math.max(0, estoqueBase - comprados) });
  }
  return ofertas;
}

// quanto o Mercador paga por unidade (30% acima do valor de referencia, x qualidade)
export function precoVendaMercador(item: ItemDef, q = 1): number {
  return Math.round((item.valor * multQualidade(q) * 1.3) / 5) * 5;
}

export function comprarDoMercador(save: GangstarSave, itemId: string): { save: GangstarSave; erro?: string } {
  if (save.personagem.nivel < NIVEL_MERCADOR) return { save, erro: `O Mercador só negocia a partir do nível ${NIVEL_MERCADOR}.` };
  const visita = mercadorAtual();
  if (!visita) return { save, erro: "O Mercador já foi embora." };
  const oferta = ofertasMercador(save, visita).find((o) => o.item.id === itemId);
  if (!oferta || oferta.estoque <= 0) return { save, erro: "Esse item esgotou." };
  if (save.personagem.dinheiro < oferta.preco) return { save, erro: "Dinheiro insuficiente." };
  const comprados = save.mercador.visita === visita.id ? save.mercador.comprados : {};
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - oferta.preco },
      inventario: addInventario(save.inventario, chaveItem(itemId, oferta.q), 1),
      mercador: { visita: visita.id, comprados: { ...comprados, [itemId]: (comprados[itemId] ?? 0) + 1 } },
    },
  };
}

export function venderAoMercador(save: GangstarSave, chave: string, qtd = 1): { save: GangstarSave; erro?: string; valor?: number } {
  if (!mercadorAtual()) return { save, erro: "O Mercador já foi embora." };
  const { id, q } = parseChave(chave);
  const item = itemPorId(id);
  if (!item) return { save, erro: "Item inválido." };
  const n = Math.min(qtd, qtdItem(save, chave));
  if (n <= 0) return { save, erro: "Você não tem esse item." };
  const valor = precoVendaMercador(item, q) * n;
  const semItem = removerItens(save, [{ id: chave, qtd: n }]);
  return { save: { ...semItem, personagem: { ...semItem.personagem, dinheiro: semItem.personagem.dinheiro + valor } }, valor };
}

// ---------- Porto: contratos de envio (3 itens -> dinheiro) ----------

const JANELA_PORTO_MS = 6 * 3600 * 1000;

export interface ContratoPorto {
  id: string;
  destino: string;
  emoji: string;
  itens: { id: string; qtd: number }[];
  recompensa: number;
  respeito: number;
}

const DESTINOS_PORTO = [
  { nome: "Cartel de Cartagena", emoji: "🇨🇴" },
  { nome: "Máfia de Nápoles", emoji: "🇮🇹" },
  { nome: "Tríade de Macau", emoji: "🇲🇴" },
  { nome: "Contrabandistas de Marselha", emoji: "🇫🇷" },
  { nome: "Yakuza de Osaka", emoji: "🇯🇵" },
  { nome: "Bratva de Odessa", emoji: "🇺🇦" },
  { nome: "Piratas do Caribe", emoji: "🏴‍☠️" },
];

export function janelaPorto(agora = Date.now()): number {
  return Math.floor(agora / JANELA_PORTO_MS);
}

export function minutosNovosContratos(agora = Date.now()): number {
  return Math.ceil((JANELA_PORTO_MS - (agora % JANELA_PORTO_MS)) / 60000);
}

export function contratosPorto(save: GangstarSave, agora = Date.now()): ContratoPorto[] {
  const janela = janelaPorto(agora);
  const rnd = rngSemente(janela * 977 + (save.criadoEm % 100000));
  // itens das fabricas que o jogador tem (ou os basicos de cada fabrica)
  const fabricas = Object.values(save.predios).filter((p) => ehFabrica(p.tipo));
  const pool = fabricas.length
    ? fabricas.flatMap((f) => itensDaFabrica(f.tipo as FabricaItem, f.nivel))
    : ITENS.filter((i) => i.nivel <= 2);
  const contratos: ContratoPorto[] = [];
  for (let c = 0; c < 3; c++) {
    const destino = DESTINOS_PORTO[Math.floor(rnd() * DESTINOS_PORTO.length)];
    const tipos = 1 + Math.floor(rnd() * 3); // 1 a 3 itens diferentes, 3 unidades no total
    const itens: { id: string; qtd: number }[] = [];
    let restante = 3;
    for (let t = 0; t < tipos && restante > 0; t++) {
      const item = pool[Math.floor(rnd() * pool.length)];
      const qtd = t === tipos - 1 ? restante : 1;
      const existente = itens.find((x) => x.id === item.id);
      if (existente) existente.qtd += qtd;
      else itens.push({ id: item.id, qtd });
      restante -= qtd;
    }
    const valor = itens.reduce((s, x) => s + (itemPorId(x.id)?.valor ?? 0) * x.qtd, 0);
    contratos.push({
      id: `porto-${janela}-${c}`,
      destino: destino.nome,
      emoji: destino.emoji,
      itens,
      // quanto maior o nivel, melhor o pagamento (+4% por nivel acima do 7)
      recompensa: Math.round((valor * (1.5 + rnd() * 0.4) * (1 + Math.max(0, save.personagem.nivel - NIVEL_PORTO) * 0.04)) / 10) * 10,
      respeito: 4 + Math.round(valor / 400),
    });
  }
  return contratos;
}

export function contratoConcluido(save: GangstarSave, id: string): boolean {
  return save.porto.janela === janelaPorto() && save.porto.concluidos.includes(id);
}

// enviar: os itens embarcam num navio que leva horas para chegar; na chegada a Policia
// Federal pode apreender a carga. A qualidade media dos itens aumenta o pagamento.
export function enviarContratoPorto(save: GangstarSave, id: string): { save: GangstarSave; erro?: string; navio?: Navio } {
  if (save.personagem.nivel < NIVEL_PORTO) return { save, erro: `O Porto libera no nível ${NIVEL_PORTO}.` };
  const contrato = contratosPorto(save).find((c) => c.id === id);
  if (!contrato) return { save, erro: "Esse contrato expirou." };
  if (contratoConcluido(save, id)) return { save, erro: "Esse carregamento já foi enviado." };
  for (const x of contrato.itens) {
    if (qtdItem(save, x.id) < x.qtd) return { save, erro: `Faltam itens: ${itemPorId(x.id)?.nome ?? x.id}.` };
  }
  const janela = janelaPorto();
  // envia os melhores itens primeiro
  const melhores = contrato.itens.map((x) => {
    const pilhas = pilhasDoItem(save, x.id).reverse();
    const usados: { id: string; qtd: number }[] = [];
    let falta = x.qtd;
    for (const p of pilhas) {
      if (falta <= 0) break;
      const n = Math.min(falta, p.qtd);
      usados.push({ id: p.chave, qtd: n });
      falta -= n;
    }
    return usados;
  });
  const r = removerItensQ(save, melhores.flat());
  const multMedio = r.qualidades.reduce((a, q) => a + multQualidade(q), 0) / Math.max(1, r.qualidades.length);
  const indiceDestino = DESTINOS_PORTO.findIndex((d) => d.nome === contrato.destino);
  const horas = 1 + (Math.max(0, indiceDestino) % 4);
  const agora = Date.now();
  const valorCarga = contrato.recompensa * multMedio;
  const navio: Navio = {
    id: `navio-${id}`,
    destino: contrato.destino,
    emoji: contrato.emoji,
    partida: agora,
    chegada: agora + horas * 3600000,
    recompensa: Math.round(valorCarga / 10) * 10,
    respeito: contrato.respeito,
    risco: Math.round(Math.min(0.35, (0.1 + Math.min(0.12, valorCarga / 200000)) * fatorPiloto(save)) * 100) / 100,
  };
  const concluidos = save.porto.janela === janela ? save.porto.concluidos : [];
  return {
    save: { ...r.save, porto: { janela, concluidos: [...concluidos, id], navios: [...(save.porto.navios ?? []), navio] } },
    navio,
  };
}

export interface ChegadaNavio {
  navio: Navio;
  apreendido: boolean;
}

// resolve os navios que ja chegaram (o sorteio usa o id do navio: o resultado nao muda)
export function resolverNavios(save: GangstarSave, agora = Date.now()): { save: GangstarSave; chegadas: ChegadaNavio[] } {
  const navios = save.porto.navios ?? [];
  const chegaram = navios.filter((n) => n.chegada <= agora);
  if (!chegaram.length) return { save, chegadas: [] };
  let p = save.personagem;
  let entregues = 0;
  const chegadas = chegaram.map((navio) => {
    const apreendido = (hashTexto(navio.id) % 1000) / 1000 < navio.risco;
    if (!apreendido) {
      p = { ...p, dinheiro: p.dinheiro + navio.recompensa, respeito: p.respeito + navio.respeito };
      entregues++;
    }
    return { navio, apreendido };
  });
  const novo: GangstarSave = { ...save, personagem: p, porto: { ...save.porto, navios: navios.filter((n) => n.chegada > agora) } };
  return { save: contar(novo, "naviosEntregues", entregues), chegadas };
}

// ---------- Emboscada: atacar gangsters de IA ----------

const JANELA_EMBOSCADA_MS = 3600 * 1000;
const ENERGIA_EMBOSCADA = 15;

export interface AlvoEmboscada {
  id: string;
  nome: string;
  emoji: string;
  poder: number;
  dinheiro: number;
  saque: string | null;
}

const NOMES_ALVOS = ["Tonhão", "Doutor Lima", "Rita Faca", "Gringo", "Marcão Ferro", "Nego Dé", "Paty Veneno", "Zé Pólvora", "Valdo Cobra", "Lena Gatilho", "Russo", "Careca do Porto", "Bia Navalha", "Jorjão", "Dona Neide"];
const EMOJIS_ALVOS = ["🕴️", "🧔", "👩‍🦰", "🤠", "💪", "🧑‍🦲", "👩", "🧨", "🐍", "🎯", "🐻", "⚓", "🗡️", "🦍", "👵"];

export function janelaEmboscada(agora = Date.now()): number {
  return Math.floor(agora / JANELA_EMBOSCADA_MS);
}

export function minutosNovosAlvos(agora = Date.now()): number {
  return Math.ceil((JANELA_EMBOSCADA_MS - (agora % JANELA_EMBOSCADA_MS)) / 60000);
}

export function poderEmboscada(save: GangstarSave): number {
  return Math.round(poderDeRoubo(save) + poderTotalBandidos(save) * 0.3);
}

export function alvosEmboscada(save: GangstarSave, agora = Date.now()): AlvoEmboscada[] {
  const janela = janelaEmboscada(agora);
  const rnd = rngSemente(janela * 4241 + (save.criadoEm % 100000));
  const base = Math.max(20, poderEmboscada(save));
  const pool = ITENS.filter((i) => i.nivel <= nivelItensDisponiveis(save));
  const fatores = [0.6, 0.8, 1, 1.2, 1.5];
  return fatores.map((f, i) => {
    const idx = Math.floor(rnd() * NOMES_ALVOS.length);
    const poder = Math.round(base * f * (0.9 + rnd() * 0.2));
    return {
      id: `emb-${janela}-${i}`,
      nome: NOMES_ALVOS[idx],
      emoji: EMOJIS_ALVOS[idx],
      poder,
      dinheiro: Math.round((poder * (25 + rnd() * 35)) / 10) * 10,
      saque: rnd() < 0.6 ? pool[Math.floor(rnd() * pool.length)].id : null,
    };
  });
}

export function poderEmboscadaGrupo(save: GangstarSave): number {
  return Math.round(poderEmboscada(save) + poderTotalBandidos(save) * 0.7);
}

export function chanceEmboscada(save: GangstarSave, alvo: { poder: number }, emGrupo = false): number {
  const poder = (emGrupo ? poderEmboscadaGrupo(save) : poderEmboscada(save)) * (1 + bonusEspecial(save, "emboscada"));
  return Math.max(0.08, Math.min(0.92, 0.5 + (poder - alvo.poder) * 0.012));
}

export function alvoAtacado(save: GangstarSave, id: string): boolean {
  return save.emboscadas.janela === janelaEmboscada() && save.emboscadas.feitas.includes(id);
}

export type ResultadoEmboscada =
  | { tipo: "sucesso"; dinheiro: number; respeito: number; xp: number; saque: ItemDef | null; parteGangue?: number }
  | { tipo: "falha"; dano: number; ocorrencias?: string[] }
  | { tipo: "falha-preso"; dano: number; minutos: number; fianca: number; ocorrencias?: string[] };

function emboscarBase(save: GangstarSave, alvoId: string, emGrupo = false): { save: GangstarSave; erro?: string; resultado?: ResultadoEmboscada } {
  const alvo = alvosEmboscada(save).find((a) => a.id === alvoId);
  if (emGrupo && !save.bandidos.length) return { save, erro: "Você não tem bandidos para levar." };
  const p = save.personagem;
  if (!alvo) return { save, erro: "Esse alvo sumiu do mapa." };
  if (alvoAtacado(save, alvoId)) return { save, erro: "Você já emboscou esse alvo nesta hora." };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  if (p.energia < ENERGIA_EMBOSCADA) return { save, erro: "Energia insuficiente." };
  if (p.vida < 20) return { save, erro: "Você está muito ferido. Cure-se no hospital antes." };

  const janela = janelaEmboscada();
  const feitas = save.emboscadas.janela === janela ? save.emboscadas.feitas : [];
  const base: GangstarSave = { ...save, emboscadas: { ...save.emboscadas, janela, feitas: [...feitas, alvoId] } };

  if (Math.random() < chanceEmboscada(save, alvo, emGrupo)) {
    const bruto = Math.round(alvo.dinheiro * (0.5 + Math.random() * 0.4));
    const parteGangue = emGrupo ? Math.round(bruto * PARTE_GANGUE_EMBOSCADA) : 0;
    const dinheiro = bruto - parteGangue;
    const saque = alvo.saque && Math.random() < 0.6 ? itemPorId(alvo.saque) : null;
    const respeito = 4 + Math.round(alvo.poder / 12);
    const xp = 15 + Math.round(alvo.poder / 3);
    const novoP = ganharXp({ ...p, energia: p.energia - ENERGIA_EMBOSCADA, dinheiro: p.dinheiro + dinheiro, respeito: p.respeito + respeito }, xp);
    return {
      save: contar(
        { ...base, personagem: novoP, inventario: saque ? addInventario(base.inventario, chaveItem(saque.id, 1 + Math.floor(Math.random() * 3)), 1) : base.inventario },
        "emboscadasOk",
      ),
      resultado: { tipo: "sucesso", dinheiro, respeito, xp, saque, parteGangue },
    };
  }
  if (emGrupo) {
    const baixas = baixasEmboscada(base);
    return finalizarFalhaEmboscada(baixas.save, p, baixas.ocorrencias, save);
  }
  return finalizarFalhaEmboscada(base, p, [], save);
}

const PARTE_GANGUE_EMBOSCADA = 0.2;

function baixasEmboscada(save: GangstarSave): { save: GangstarSave; ocorrencias: string[] } {
  const mortos = save.bandidos.filter(() => Math.random() < 0.08);
  if (!mortos.length) return { save, ocorrencias: [] };
  const ids = new Set(mortos.map((b) => b.id));
  const textos = mortos.map((b) => `💀 ${b.nome} morreu na emboscada.`);
  return { save: registrar({ ...save, bandidos: save.bandidos.filter((b) => !ids.has(b.id)) }, textos), ocorrencias: textos };
}

function finalizarFalhaEmboscada(base: GangstarSave, p: Personagem, ocorrencias: string[], original: GangstarSave, danoExtra = 1, chancePrisao = 0.2): { save: GangstarSave; resultado: ResultadoEmboscada } {

  const protecao = Math.min(0.6, (coleteEquipado(original)?.poder ?? 0) / 80);
  const dano = Math.max(3, Math.round((10 + Math.random() * 20) * danoExtra * (1 - protecao)));
  const energiaGasta = danoExtra > 1 ? ENERGIA_CAPO : ENERGIA_EMBOSCADA;
  const ferido: Personagem = { ...p, energia: Math.max(0, p.energia - energiaGasta), vida: Math.max(1, p.vida - dano) };
  if (Math.random() < chancePrisao * fatorPrisaoDoDia() * fatorPiloto(original)) {
    const minutos = danoExtra > 1 ? 30 : 15;
    const presoP: Personagem = { ...ferido, vezesPreso: p.vezesPreso + 1, preso: { ate: Date.now() + minutos * 60000 } };
    return { save: { ...base, personagem: presoP }, resultado: { tipo: "falha-preso", dano, minutos, fianca: custoFianca(presoP), ocorrencias } };
  }
  return { save: { ...base, personagem: ferido }, resultado: { tipo: "falha", dano, ocorrencias } };
}

export function energiaEmboscada(): number {
  return ENERGIA_EMBOSCADA;
}

// =====================================================================================
// v4.59: lojas vendendo por IA, capo semanal, cassino (jackpot/torneio/agiota),
// missoes de historia e conquistas
// =====================================================================================

// ---------- Estatisticas (contadores para missoes e conquistas) ----------

function contar(save: GangstarSave, chave: string, n = 1): GangstarSave {
  if (n <= 0) return save;
  return { ...save, estatisticas: { ...(save.estatisticas ?? {}), [chave]: (save.estatisticas?.[chave] ?? 0) + n } };
}

export function estatistica(save: GangstarSave, chave: string): number {
  return save.estatisticas?.[chave] ?? 0;
}

export function tentarRoubo(save: GangstarSave, rouboId: string) {
  const custoVida = vidaDoRoubo(rouboId);
  const ferido = exigeVida(save, custoVida);
  if (ferido) return { save, erro: ferido };
  const r = tentarRouboBase(save, rouboId);
  if (r.erro || !r.resultado) return r;
  const s1 = contar(r.save, "roubos");
  return posAcao(save, { ...r, save: r.resultado.tipo === "sucesso" ? contar(s1, "roubosOk") : s1 }, custoVida);
}

export function tentarMissaoEquipe(save: GangstarSave, missaoId: string, membroIds: string[]): { save: GangstarSave; resultado?: ResultadoMissaoEquipe; erro?: string; raro?: ItemDef } {
  const ferido = exigeVida(save, VIDA_ROUBO_EQUIPE);
  if (ferido) return { save, erro: ferido };
  const r0 = tentarMissaoEquipeBase(save, missaoId, membroIds);
  if (r0.erro || !r0.resultado) return r0;
  const r = posAcao(save, r0, VIDA_ROUBO_EQUIPE);
  if (r.resultado?.tipo !== "sucesso") return r;
  let novo = contar(r.save, "missoesEquipeOk");
  // itens raros so caem nos roubos em equipe
  const raro = sortearItemRaro();
  if (raro) novo = contar({ ...novo, inventario: addInventario(novo.inventario, chaveItem(raro.id, 1), 1) }, "itensRaros");
  return { ...r, save: novo, raro: raro ?? undefined };
}

export function atacarZona(save: GangstarSave, zonaId: string) {
  const r = atacarZonaBase(save, zonaId);
  if (r.erro || !r.resultado) return r;
  return posAcao(save, { ...r, save: r.resultado.tipo === "sucesso" ? contar(r.save, "guerrasVencidas") : r.save }, 0, false);
}

export function coletarExtorsao(save: GangstarSave, id: string) {
  if (save.personagem.nivel < NIVEL_EXTORSAO) return { save, erro: `Extorsões liberam no nível ${NIVEL_EXTORSAO}.` };
  const ferido = exigeVida(save, VIDA_EXTORSAO);
  if (ferido) return { save, erro: ferido };
  const r = coletarExtorsaoBase(save, id);
  if (r.erro || !r.resultado) return r;
  return posAcao(save, { ...r, save: r.resultado.tipo === "coletou" ? contar(r.save, "extorsoesColetadas") : r.save }, VIDA_EXTORSAO);
}

export function conquistarExtorsao(save: GangstarSave, id: string): { save: GangstarSave; erro?: string } {
  if (save.personagem.nivel < NIVEL_EXTORSAO) return { save, erro: `Extorsões liberam no nível ${NIVEL_EXTORSAO}.` };
  const ferido = exigeVida(save, VIDA_EXTORSAO);
  if (ferido) return { save, erro: ferido };
  return posAcao(save, conquistarExtorsaoBase(save, id), VIDA_EXTORSAO);
}

export function emboscar(save: GangstarSave, alvoId: string, emGrupo = false): { save: GangstarSave; erro?: string; resultado?: ResultadoEmboscada } {
  if (save.personagem.nivel < NIVEL_EMBOSCADA) return { save, erro: `Emboscadas liberam no nível ${NIVEL_EMBOSCADA}.` };
  const ferido = exigeVida(save, VIDA_EMBOSCADA);
  if (ferido) return { save, erro: ferido };
  return posAcao(save, emboscarBase(save, alvoId, emGrupo), VIDA_EMBOSCADA);
}

export function fazerMotim(save: GangstarSave) {
  const r = fazerMotimBase(save);
  if (r.erro) return r;
  return { ...r, save: r.fugiu ? contar(r.save, "motinsOk") : r.save };
}

// ---------- Lojas vendendo para a populacao (clientes de IA) ----------

export const CATEGORIAS_LOJA: Partial<Record<TipoPredio, CategoriaItemLoja[]>> = {
  "loja-bebidas": ["bebida"],
  "loja-farmacia": ["medicamento", "droga"],
  "loja-armas": ["arma", "colete"],
  // v4.61: a boate vende bebidas, drogas e remedios (e voce tambem consome por la)
  boate: ["bebida", "droga", "medicamento"],
};
type CategoriaItemLoja = ItemDef["categoria"];

export function ehLoja(tipo: TipoPredio): boolean {
  return !!CATEGORIAS_LOJA[tipo];
}

// demanda (1 = normal) por categoria, conforme o dia e os eventos
export function demandaCategoria(save: GangstarSave, cat: CategoriaItemLoja): number {
  let d = 1;
  const dia = eventoDiario().id;
  if (dia === "noite-boate" && (cat === "bebida" || cat === "droga")) d *= 1.4; // sabado de balada
  if (dia === "operacao-policial" && (cat === "droga" || cat === "arma")) d *= 0.6;
  if (dia === "domingo-tranquilo" && cat === "medicamento") d *= 1.3;
  if (eventoEstaAtivo(save, "festa-cidade") && (cat === "bebida" || cat === "droga")) d *= 1.8;
  if (eventoEstaAtivo(save, "batida-policial") && (cat === "droga" || cat === "arma")) d *= 0.4;
  if (eventoEstaAtivo(save, "policia-greve") && cat === "arma") d *= 1.4;
  return Math.round(d * 100) / 100;
}

export function precoNaLoja(save: GangstarSave, chave: string): number {
  const { id, q } = parseChave(chave);
  const item = itemPorId(id);
  if (!item) return 0;
  const escassez = item.categoria === "droga" && eventoEstaAtivo(save, "escassez-droga") ? 1.8 : 1;
  return Math.round((item.valor * 1.4 * multQualidade(q) * escassez) / 5) * 5;
}

export function clientesPorHora(inst: PredioInstancia): number {
  // sabado (noite da boate): a boate recebe o dobro de clientes
  const noite = inst.tipo === "boate" && eventoDiario().id === "noite-boate" ? 2 : 1;
  return (4 + inst.nivel * 4) * noite;
}

// simula os clientes desde a ultima vez (no maximo 24h de uma vez)
function simularVendas(save: GangstarSave, inst: PredioInstancia, agora: number): { inst: PredioInstancia; vendidos: number } {
  const estoque = { ...(inst.estoque ?? {}) };
  const desde = inst.ultimaVenda ?? agora;
  const horas = Math.min(24, Math.max(0, (agora - desde) / 3600000));
  let caixa = inst.caixa ?? 0;
  let vendidos = 0;
  const clientes = Math.floor(horas * clientesPorHora(inst));
  for (let c = 0; c < clientes; c++) {
    const pilhas = Object.entries(estoque).filter(([, q]) => q > 0);
    if (!pilhas.length) break;
    const total = pilhas.reduce((a, [, q]) => a + q, 0);
    let x = Math.random() * total;
    let chave = pilhas[0][0];
    for (const [k, q] of pilhas) {
      x -= q;
      if (x < 0) {
        chave = k;
        break;
      }
    }
    const item = itemPorId(parseChave(chave).id);
    if (!item) continue;
    if (Math.random() < Math.min(0.95, 0.5 * demandaCategoria(save, item.categoria))) {
      estoque[chave] -= 1;
      if (estoque[chave] <= 0) delete estoque[chave];
      caixa += precoNaLoja(save, chave);
      vendidos++;
    }
  }
  const dia = dataLocal(new Date(agora));
  const hoje = inst.vendidosHoje?.dia === dia ? inst.vendidosHoje.qtd : 0;
  // avanca o relogio so pelo tempo dos clientes atendidos (a sobra fica para o proximo)
  const cph = clientesPorHora(inst);
  const ultimaVenda = !inst.ultimaVenda || horas >= 24 ? agora : clientes > 0 ? desde + (clientes / cph) * 3600000 : inst.ultimaVenda;
  return { inst: { ...inst, estoque, caixa, ultimaVenda, vendidosHoje: { dia, qtd: hoje + vendidos } }, vendidos };
}

export function processarVendasLojas(save: GangstarSave, agora = Date.now()): GangstarSave {
  let mudou = false;
  let total = 0;
  const predios = { ...save.predios };
  for (const [id, inst] of Object.entries(save.predios)) {
    if (!ehLoja(inst.tipo)) continue;
    const r = simularVendas(save, inst, agora);
    predios[id] = r.inst;
    total += r.vendidos;
    mudou = true;
  }
  return mudou ? contar({ ...save, predios }, "itensVendidosLojas", total) : save;
}

export function abastecerLoja(save: GangstarSave, lojaId: string, chave: string, qtd: number): { save: GangstarSave; erro?: string } {
  const inst = save.predios[lojaId];
  if (!inst || !ehLoja(inst.tipo)) return { save, erro: "Essa loja não é sua." };
  const item = itemPorId(parseChave(chave).id);
  if (!item || !CATEGORIAS_LOJA[inst.tipo]!.includes(item.categoria)) return { save, erro: "Essa loja não vende esse tipo de item." };
  const n = Math.min(qtd, qtdItem(save, chave));
  if (n <= 0) return { save, erro: "Você não tem esse item." };
  const base = processarVendasLojas(save);
  const atual = base.predios[lojaId];
  const semItem = removerItens(base, [{ id: chave, qtd: n }]);
  const estoque = { ...(atual.estoque ?? {}), [chave]: (atual.estoque?.[chave] ?? 0) + n };
  return { save: { ...semItem, predios: { ...semItem.predios, [lojaId]: { ...atual, estoque, ultimaVenda: atual.ultimaVenda ?? Date.now() } } } };
}

export function recolherDaLoja(save: GangstarSave, lojaId: string, chave: string): { save: GangstarSave; erro?: string } {
  const base = processarVendasLojas(save);
  const inst = base.predios[lojaId];
  const n = inst?.estoque?.[chave] ?? 0;
  if (!inst || n <= 0) return { save, erro: "Esse item não está mais na prateleira." };
  const estoque = { ...inst.estoque };
  delete estoque[chave];
  return { save: { ...base, inventario: addInventario(base.inventario, chave, n), predios: { ...base.predios, [lojaId]: { ...inst, estoque } } } };
}

export function coletarCaixaLoja(save: GangstarSave, lojaId: string): { save: GangstarSave; erro?: string; valor?: number } {
  const base = processarVendasLojas(save);
  const inst = base.predios[lojaId];
  const valor = Math.round((inst?.caixa ?? 0) * fatorColetaDoDia());
  if (!inst || valor <= 0) return { save: base, erro: "O caixa está vazio." };
  return {
    save: { ...base, personagem: { ...base.personagem, dinheiro: base.personagem.dinheiro + valor }, predios: { ...base.predios, [lojaId]: { ...inst, caixa: 0 } } },
    valor,
  };
}

// ---------- Capo da semana (chefe de emboscada) ----------

const ENERGIA_CAPO = 30;
const CAPOS = [
  { nome: "Don Vitório Salerno", emoji: "🎩" },
  { nome: "Madame Kuznetsova", emoji: "🦊" },
  { nome: "El Patrón Ruiz", emoji: "🐂" },
  { nome: "Mestre Ishikawa", emoji: "🐉" },
  { nome: "Barão do Porto", emoji: "⚓" },
  { nome: "A Viúva Negra", emoji: "🕷️" },
];

export function semanaAtual(agora = Date.now()): string {
  // semanas comecando na segunda-feira (o epoch caiu numa quinta)
  return `S${Math.floor((agora + 3 * 86400000) / (7 * 86400000))}`;
}

export interface CapoSemana {
  semana: string;
  nome: string;
  emoji: string;
  poder: number;
  dinheiro: number;
  saque: ItemDef;
  qualidade: number;
}

export function capoDaSemana(save: GangstarSave, agora = Date.now()): CapoSemana {
  const semana = semanaAtual(agora);
  const rnd = rngSemente(hashTexto(semana) + (save.criadoEm % 1000));
  const c = CAPOS[Math.floor(rnd() * CAPOS.length)];
  const base = Math.max(40, poderEmboscada(save));
  const nivelSaque = Math.min(10, Math.max(3, nivelItensDisponiveis(save) + 2));
  const pool = ITENS.filter((i) => i.nivel >= nivelSaque - 2 && i.nivel <= nivelSaque);
  return {
    semana,
    nome: c.nome,
    emoji: c.emoji,
    poder: Math.round(base * (1.8 + rnd() * 0.5)),
    dinheiro: Math.round((base * 400) / 100) * 100,
    saque: pool[Math.floor(rnd() * pool.length)] ?? ITENS[ITENS.length - 1],
    qualidade: 4 + (rnd() < 0.4 ? 1 : 0),
  };
}

export function capoDerrotado(save: GangstarSave): boolean {
  return save.emboscadas.capo?.semana === semanaAtual() && save.emboscadas.capo.derrotado;
}

export function energiaCapo(): number {
  return ENERGIA_CAPO;
}

export function atacarCapo(save: GangstarSave, emGrupo: boolean): { save: GangstarSave; erro?: string; resultado?: ResultadoEmboscada } {
  const p = save.personagem;
  const capo = capoDaSemana(save);
  if (capoDerrotado(save)) return { save, erro: "O capo desta semana já caiu. Volte na segunda-feira." };
  if (emGrupo && !save.bandidos.length) return { save, erro: "Você não tem bandidos para levar." };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  if (p.energia < ENERGIA_CAPO) return { save, erro: "Energia insuficiente." };
  if (p.vida < 40) return { save, erro: "Enfrentar um capo exige pelo menos 40 de vida." };
  if (Math.random() < chanceEmboscada(save, capo, emGrupo)) {
    const parteGangue = emGrupo ? Math.round(capo.dinheiro * PARTE_GANGUE_EMBOSCADA) : 0;
    const dinheiro = capo.dinheiro - parteGangue;
    const respeito = 40 + Math.round(capo.poder / 4);
    const xp = 150 + capo.poder;
    const novoP = ganharXp({ ...p, energia: p.energia - ENERGIA_CAPO, dinheiro: p.dinheiro + dinheiro, respeito: p.respeito + respeito }, xp);
    return {
      save: contar(
        {
          ...save,
          personagem: novoP,
          inventario: addInventario(save.inventario, chaveItem(capo.saque.id, capo.qualidade), 1),
          emboscadas: { ...save.emboscadas, capo: { semana: capo.semana, derrotado: true } },
        },
        "caposDerrotados",
      ),
      resultado: { tipo: "sucesso", dinheiro, respeito, xp, saque: capo.saque, parteGangue },
    };
  }
  let base: GangstarSave = { ...save, emboscadas: { ...save.emboscadas, capo: { semana: capo.semana, derrotado: false } } };
  let ocorrencias: string[] = [];
  if (emGrupo) {
    const b = baixasEmboscada(base);
    base = b.save;
    ocorrencias = b.ocorrencias;
  }
  return finalizarFalhaEmboscada(base, p, ocorrencias, save, 2, 0.3);
}

// ---------- Cassino: jackpot, torneio diario e agiota ----------

const JACKPOT_INICIAL = 50000;

export function jackpotAtual(save: GangstarSave): number {
  return save.cassino?.jackpot ?? JACKPOT_INICIAL;
}

// cada giro alimenta o jackpot com 5% da aposta; 7-7-7 leva o jackpot (proporcional
// a aposta: com R$ 1.000 ou mais leva tudo)
export function aplicarGiroSlot(save: GangstarSave, aposta: number, ganhou777: boolean): { save: GangstarSave; premioJackpot: number } {
  const pote = jackpotAtual(save) + Math.round(aposta * 0.05);
  if (!ganhou777) return { save: { ...save, cassino: { ...save.cassino, jackpot: pote } }, premioJackpot: 0 };
  const premio = Math.round(pote * Math.min(1, aposta / 1000));
  return {
    save: contar({ ...save, personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro + premio }, cassino: { ...save.cassino, jackpot: Math.max(JACKPOT_INICIAL, pote - premio) } }, "jackpots"),
    premioJackpot: premio,
  };
}

export const BUYIN_TORNEIO = 1000;
export const FICHAS_TORNEIO = 5000;
export const MAOS_TORNEIO = 10;
const PREMIOS_TORNEIO = [15000, 7000, 3000];

export function torneioDeHoje(save: GangstarSave): TorneioPoker | null {
  const t = save.cassino?.torneio;
  return t && t.dia === dataLocal(new Date()) ? t : null;
}

export function entrarTorneio(save: GangstarSave): { save: GangstarSave; erro?: string } {
  if (torneioDeHoje(save)) return { save, erro: "Você já jogou o torneio de hoje." };
  if (save.personagem.dinheiro < BUYIN_TORNEIO) return { save, erro: "Dinheiro insuficiente para a inscrição." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - BUYIN_TORNEIO },
      cassino: { ...save.cassino, torneio: { dia: dataLocal(new Date()), fichas: FICHAS_TORNEIO, maos: 0, terminado: false, posicao: 0, premio: 0 } },
    },
  };
}

export function anteTorneio(t: TorneioPoker): number {
  return t.maos >= 5 ? 400 : 200;
}

// placar dos outros 7 jogadores do torneio do dia (fixo para o dia)
export function rivaisTorneio(dia: string): { nome: string; fichas: number }[] {
  const rnd = rngSemente(hashTexto(`torneio-${dia}`));
  const nomes = ["Don Corvo", "Lady Ás", "Gringo", "Rita Faca", "Doutor Lima", "Russo", "Paty Veneno", "Marcão Ferro", "Bia Navalha"];
  // embaralha (sem repetir nomes) e pega 7
  for (let i = nomes.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [nomes[i], nomes[j]] = [nomes[j], nomes[i]];
  }
  return nomes.slice(0, 7).map((nome) => ({ nome, fichas: Math.round((800 + rnd() * 9500) / 50) * 50 }));
}

export function atualizarTorneio(save: GangstarSave, deltaFichas: number, maoTerminou: boolean): GangstarSave {
  const t = torneioDeHoje(save);
  if (!t || t.terminado) return save;
  const fichas = Math.max(0, t.fichas + deltaFichas);
  const maos = t.maos + (maoTerminou ? 1 : 0);
  const acabou = maoTerminou && (maos >= MAOS_TORNEIO || fichas < anteTorneio({ ...t, maos }));
  if (!acabou) return { ...save, cassino: { ...save.cassino, torneio: { ...t, fichas, maos } } };
  const acima = rivaisTorneio(t.dia).filter((r) => r.fichas > fichas).length;
  const posicao = acima + 1;
  const premio = PREMIOS_TORNEIO[posicao - 1] ?? 0;
  const novo: GangstarSave = {
    ...save,
    personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro + premio },
    cassino: { ...save.cassino, torneio: { ...t, fichas, maos, terminado: true, posicao, premio } },
  };
  return posicao === 1 ? contar(novo, "torneiosVencidos") : novo;
}

export function premiosTorneio(): number[] {
  return PREMIOS_TORNEIO;
}

export function contarVitoriaCassino(save: GangstarSave): GangstarSave {
  return contar(save, "vitoriasCassino");
}

// agiota: empresta para quem quebrou a banca (menos de R$ 2.000 em maos), 30% de juros
// em 24h. Se nao pagar, ele cobra sozinho (dinheiro, banco, e ainda bate: vida e respeito).
export const LIMITE_QUEBRADO = 2000;
const JUROS_AGIOTA = 0.3;

export function opcoesEmprestimo(save: GangstarSave): number[] {
  const teto = 5000 + save.personagem.nivel * 3000;
  return [5000, 10000, 20000, 40000].filter((v) => v <= teto);
}

export function pegarEmprestimo(save: GangstarSave, valor: number): { save: GangstarSave; erro?: string } {
  if (save.agiota) return { save, erro: "Você já deve ao agiota." };
  if (save.personagem.dinheiro >= LIMITE_QUEBRADO) return { save, erro: "O agiota só empresta para quem quebrou a banca." };
  if (!opcoesEmprestimo(save).includes(valor)) return { save, erro: "Valor indisponível." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro + valor },
      agiota: { divida: Math.round(valor * (1 + JUROS_AGIOTA)), venceEm: Date.now() + 24 * 3600000 },
    },
  };
}

export function pagarAgiota(save: GangstarSave): { save: GangstarSave; erro?: string } {
  if (!save.agiota) return { save, erro: "Você não deve nada." };
  const p = save.personagem;
  const pago = Math.min(p.dinheiro, save.agiota.divida);
  if (pago <= 0) return { save, erro: "Você não tem dinheiro em mãos." };
  const resta = save.agiota.divida - pago;
  return { save: { ...save, personagem: { ...p, dinheiro: p.dinheiro - pago }, agiota: resta > 0 ? { ...save.agiota, divida: resta } : null } };
}

function processarAgiota(save: GangstarSave): GangstarSave {
  const a = save.agiota;
  if (!a || Date.now() < a.venceEm) return save;
  let p = { ...save.personagem };
  let divida = a.divida;
  const doBolso = Math.min(p.dinheiro, divida);
  p.dinheiro -= doBolso;
  divida -= doBolso;
  const doBanco = Math.min(p.banco.saldo, divida);
  p.banco = { saldo: p.banco.saldo - doBanco };
  divida -= doBanco;
  const textos = [`💸 O agiota cobrou a dívida: levou R$ ${(doBolso + doBanco).toLocaleString("pt-BR")}.`];
  if (divida > 0) {
    p = { ...p, vida: Math.max(1, p.vida - 40), respeito: Math.round(p.respeito * 0.9) };
    textos.push("🩸 Faltou dinheiro: os capangas do agiota te deram uma surra (−40 de vida, −10% de respeito).");
  }
  return registrar({ ...save, personagem: p, agiota: divida > 0 ? { divida: Math.round(divida * 1.1), venceEm: Date.now() + 24 * 3600000 } : null }, textos);
}

// ---------- Missoes de historia (capitulos) ----------

export interface ObjetivoHistoria {
  texto: string;
  alvo: number;
  progresso: (s: GangstarSave) => number;
}

export interface CapituloHistoria {
  titulo: string;
  texto: string;
  objetivos: ObjetivoHistoria[];
  recompensa: { dinheiro: number; xp: number; respeito: number };
}

const qtdPredios = (s: GangstarSave) => Object.keys(s.predios).length;

export const CAPITULOS: CapituloHistoria[] = [
  {
    titulo: "Batismo de fogo",
    texto: "Ninguém nasce chefão. Mostre para as ruas que você tem coragem.",
    objetivos: [
      { texto: "Faça 5 roubos", alvo: 5, progresso: (s) => estatistica(s, "roubos") },
      { texto: "Compre seu primeiro prédio", alvo: 1, progresso: qtdPredios },
    ],
    recompensa: { dinheiro: 3000, xp: 80, respeito: 20 },
  },
  {
    titulo: "Nome na rua",
    texto: "Uma gangue de verdade precisa de nome e de respeito.",
    objetivos: [
      { texto: "Crie sua gangue", alvo: 1, progresso: (s) => (s.personagem.gangue ? 1 : 0) },
      { texto: "Chegue a 300 de respeito", alvo: 300, progresso: (s) => s.personagem.respeito },
    ],
    recompensa: { dinheiro: 6000, xp: 150, respeito: 40 },
  },
  {
    titulo: "Linha de produção",
    texto: "Dinheiro de verdade vem do que você produz e vende.",
    objetivos: [
      { texto: "Tenha uma fábrica", alvo: 1, progresso: (s) => Object.values(s.predios).filter((p) => ehFabrica(p.tipo)).length },
      { texto: "Produza 20 itens", alvo: 20, progresso: (s) => estatistica(s, "itensProduzidos") },
      { texto: "Venda 10 itens nas suas lojas", alvo: 10, progresso: (s) => estatistica(s, "itensVendidosLojas") },
    ],
    recompensa: { dinheiro: 12000, xp: 250, respeito: 60 },
  },
  {
    titulo: "Negócios no exterior",
    texto: "O porto é a porta para o mundo. E para o dinheiro grande.",
    objetivos: [
      { texto: "Entregue 3 navios", alvo: 3, progresso: (s) => estatistica(s, "naviosEntregues") },
      { texto: "Domine 2 extorsões", alvo: 2, progresso: (s) => Object.keys(s.extorsoes).length },
    ],
    recompensa: { dinheiro: 20000, xp: 400, respeito: 90 },
  },
  {
    titulo: "Exército próprio",
    texto: "Sozinho você não vai longe. Monte sua tropa.",
    objetivos: [
      { texto: "Tenha 3 bandidos na gangue", alvo: 3, progresso: (s) => s.bandidos.length },
      { texto: "Vença 5 emboscadas", alvo: 5, progresso: (s) => estatistica(s, "emboscadasOk") },
    ],
    recompensa: { dinheiro: 30000, xp: 550, respeito: 130 },
  },
  {
    titulo: "Guerra de territórios",
    texto: "As gangues rivais não vão te dar a cidade de presente.",
    objetivos: [
      { texto: "Vença 2 guerras de território", alvo: 2, progresso: (s) => estatistica(s, "guerrasVencidas") },
      { texto: "Chegue ao nível 13", alvo: 13, progresso: (s) => s.personagem.nivel },
    ],
    recompensa: { dinheiro: 45000, xp: 700, respeito: 180 },
  },
  {
    titulo: "A queda do capo",
    texto: "Toda semana um chefão manda na cidade. Derrube um deles.",
    objetivos: [
      { texto: "Derrote um capo semanal", alvo: 1, progresso: (s) => estatistica(s, "caposDerrotados") },
      { texto: "Tenha 6 prédios", alvo: 6, progresso: qtdPredios },
    ],
    recompensa: { dinheiro: 70000, xp: 900, respeito: 250 },
  },
  {
    titulo: "Rei da cidade",
    texto: "A cidade inteira sabe o seu nome. Agora ela é sua.",
    objetivos: [
      { texto: "Patrimônio de R$ 500.000", alvo: 500000, progresso: (s) => patrimonio(s) },
      { texto: "Chegue ao nível 22", alvo: 22, progresso: (s) => s.personagem.nivel },
      { texto: "Tenha os 12 prédios", alvo: 12, progresso: qtdPredios },
    ],
    recompensa: { dinheiro: 150000, xp: 1500, respeito: 500 },
  },
];

export function capituloAtual(save: GangstarSave): CapituloHistoria | null {
  return capitulosDoJogador(save)[save.historia?.capitulo ?? 0] ?? null;
}

export function capituloCompleto(save: GangstarSave): boolean {
  const c = capituloAtual(save);
  return !!c && c.objetivos.every((o) => o.progresso(save) >= o.alvo);
}

export function resgatarCapitulo(save: GangstarSave, escolha?: CaminhoHistoria): { save: GangstarSave; erro?: string; capitulo?: CapituloHistoria } {
  const c = capituloAtual(save);
  if (!c) return { save, erro: "Você terminou a história!" };
  if (!capituloCompleto(save)) return { save, erro: "Complete todos os objetivos primeiro." };
  const pedeEscolha = capituloPedeEscolha(save);
  if (pedeEscolha && !escolha) return { save, erro: "Escolha: aliança ou guerra." };
  const caminho = pedeEscolha ? escolha : caminhoHistoria(save);
  const p = ganharXp({ ...save.personagem, dinheiro: save.personagem.dinheiro + c.recompensa.dinheiro, respeito: save.personagem.respeito + c.recompensa.respeito }, c.recompensa.xp);
  const historia: GangstarSave["historia"] = { capitulo: (save.historia?.capitulo ?? 0) + 1, ...(caminho ? { caminho } : {}) };
  return { save: { ...save, personagem: p, historia }, capitulo: c };
}

// ---------- Conquistas ----------

export interface Conquista {
  id: string;
  nome: string;
  emoji: string;
  descricao: string;
  feito: (s: GangstarSave) => boolean;
  recompensa: number;
}

export const CONQUISTAS: Conquista[] = [
  { id: "primeiro-roubo", nome: "Primeiro golpe", emoji: "👛", descricao: "Faça um roubo com sucesso.", feito: (s) => estatistica(s, "roubosOk") >= 1, recompensa: 500 },
  { id: "50-roubos", nome: "Ladrão de carreira", emoji: "🦹", descricao: "50 roubos com sucesso.", feito: (s) => estatistica(s, "roubosOk") >= 50, recompensa: 5000 },
  { id: "200-roubos", nome: "Lenda do crime", emoji: "👑", descricao: "200 roubos com sucesso.", feito: (s) => estatistica(s, "roubosOk") >= 200, recompensa: 25000 },
  { id: "primeira-emboscada", nome: "Tocaia", emoji: "🗡️", descricao: "Vença uma emboscada.", feito: (s) => estatistica(s, "emboscadasOk") >= 1, recompensa: 1000 },
  { id: "25-emboscadas", nome: "Caçador", emoji: "🎯", descricao: "Vença 25 emboscadas.", feito: (s) => estatistica(s, "emboscadasOk") >= 25, recompensa: 12000 },
  { id: "capo", nome: "Matador de capo", emoji: "💀", descricao: "Derrote um capo semanal.", feito: (s) => estatistica(s, "caposDerrotados") >= 1, recompensa: 15000 },
  { id: "5-capos", nome: "Exterminador", emoji: "☠️", descricao: "Derrote 5 capos.", feito: (s) => estatistica(s, "caposDerrotados") >= 5, recompensa: 60000 },
  { id: "10-navios", nome: "Armador", emoji: "🚢", descricao: "Entregue 10 navios no exterior.", feito: (s) => estatistica(s, "naviosEntregues") >= 10, recompensa: 15000 },
  { id: "100-produzidos", nome: "Industrial", emoji: "🏭", descricao: "Produza 100 itens.", feito: (s) => estatistica(s, "itensProduzidos") >= 100, recompensa: 8000 },
  { id: "500-vendidos", nome: "Comerciante", emoji: "🛒", descricao: "Venda 500 itens nas suas lojas.", feito: (s) => estatistica(s, "itensVendidosLojas") >= 500, recompensa: 20000 },
  { id: "cassino-20", nome: "Sorte de principiante", emoji: "🎲", descricao: "Ganhe 20 vezes no cassino.", feito: (s) => estatistica(s, "vitoriasCassino") >= 20, recompensa: 5000 },
  { id: "jackpot", nome: "Jackpot!", emoji: "🎰", descricao: "Ganhe o jackpot do caça-níquel.", feito: (s) => estatistica(s, "jackpots") >= 1, recompensa: 10000 },
  { id: "torneio", nome: "Rei do pôquer", emoji: "♠️", descricao: "Vença um torneio diário de pôquer.", feito: (s) => estatistica(s, "torneiosVencidos") >= 1, recompensa: 10000 },
  { id: "motim", nome: "Fuga de Alcatraz", emoji: "🔥", descricao: "Escape da prisão num motim.", feito: (s) => estatistica(s, "motinsOk") >= 1, recompensa: 3000 },
  { id: "gangue-cheia", nome: "Exército", emoji: "🪖", descricao: "Tenha 10 bandidos na gangue.", feito: (s) => s.bandidos.length >= 10, recompensa: 20000 },
  { id: "todos-predios", nome: "Dono da cidade", emoji: "🏙️", descricao: "Compre os 12 prédios.", feito: (s) => Object.keys(s.predios).length >= 12, recompensa: 50000 },
  { id: "milionario", nome: "Milionário", emoji: "💰", descricao: "Patrimônio de R$ 1.000.000.", feito: (s) => patrimonio(s) >= 1000000, recompensa: 100000 },
];

export function conquistasPendentes(save: GangstarSave): Conquista[] {
  return CONQUISTAS.filter((c) => c.feito(save) && !save.conquistas.includes(c.id));
}

export function resgatarConquista(save: GangstarSave, id: string): { save: GangstarSave; erro?: string } {
  const c = CONQUISTAS.find((x) => x.id === id);
  if (!c || !c.feito(save)) return { save, erro: "Conquista ainda não alcançada." };
  if (save.conquistas.includes(id)) return { save, erro: "Já resgatada." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro + c.recompensa, respeito: save.personagem.respeito + Math.round(c.recompensa / 500) },
      conquistas: [...save.conquistas, id],
    },
  };
}

export function notificacoesMissoes(save: GangstarSave): number {
  return conquistasPendentes(save).length + (capituloCompleto(save) ? 1 : 0);
}


// =====================================================================
// v4.60: internacao por overdose, itens raros, capo em 3 rodadas e
// historia com escolhas (alianca ou guerra).
// =====================================================================

export function msgBloqueado(p: Personagem): string {
  return p.preso?.hospital ? "Você está internado no hospital." : "Você está preso.";
}

export function estaInternado(save: GangstarSave): boolean {
  return !!save.personagem.preso?.hospital;
}

// ---------- Overdose: vicio entre 85 e 100 pode te mandar para o hospital ----------

export const VICIO_PERIGO = 85;
export const MINUTOS_INTERNACAO = 10;
export const TAXA_INTERNACAO = 1000;

// 20% de chance no 85, subindo ate 100% no 100
export function chanceOverdose(vicio: number): number {
  if (vicio < VICIO_PERIGO) return 0;
  return Math.min(1, 0.2 + ((vicio - VICIO_PERIGO) / (100 - VICIO_PERIGO)) * 0.8);
}

function verificarOverdose(save: GangstarSave, agora = Date.now()): { save: GangstarSave; overdose: boolean } {
  const p = save.personagem;
  if (p.preso || Math.random() >= chanceOverdose(p.vicio)) return { save, overdose: false };
  // internado 10 minutos; a taxa dos cuidados pode deixar o saldo negativo
  return {
    save: contar(
      {
        ...save,
        personagem: {
          ...p,
          dinheiro: p.dinheiro - TAXA_INTERNACAO,
          respeito: Math.max(0, p.respeito - RESPEITO_PERDIDO_INTERNACAO),
          vicio: Math.min(p.vicio, 70),
          preso: { ate: agora + MINUTOS_INTERNACAO * 60000, hospital: true },
        },
      },
      "overdoses",
    ),
    overdose: true,
  };
}

export function curtirNaBoate(save: GangstarSave, opcao: OpcaoBoate = "bebidas"): { save: GangstarSave; erro?: string; overdose?: boolean } {
  const r = curtirNaBoateBase(save, opcao);
  if (r.erro) return r;
  return verificarOverdose(r.save);
}

export function usarItem(save: GangstarSave, idOuChave: string): { save: GangstarSave; erro?: string; overdose?: boolean } {
  const r = usarItemBase(save, idOuChave);
  if (r.erro) return r;
  return verificarOverdose(r.save);
}

// ---------- Itens raros (slot Especial) ----------

export const CHANCE_ITEM_RARO = 0.15;

function sortearItemRaro(): ItemDef | null {
  if (Math.random() >= CHANCE_ITEM_RARO) return null;
  const total = Object.values(RARIDADES).reduce((a, r) => a + r.peso, 0);
  let x = Math.random() * total;
  let raridade: Raridade = "comum";
  for (const [k, r] of Object.entries(RARIDADES) as [Raridade, { peso: number }][]) {
    x -= r.peso;
    if (x <= 0) {
      raridade = k;
      break;
    }
  }
  const pool = ITENS_RAROS.filter((i) => i.raridade === raridade);
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function especialEquipado(save: GangstarSave): ItemDef | null {
  const item = itemPorId(save.equipamento?.especial);
  return item && item.categoria === "especial" ? item : null;
}

export function bonusEspecial(save: GangstarSave, tipo: TipoBonusEspecial): number {
  const item = especialEquipado(save);
  if (!item || durabilidadeItem(save, item.id) <= 0) return 0;
  return item.bonus?.tipo === tipo ? item.bonus.valor : 0;
}

// ---------- Capo em 3 rodadas, com golpes especiais e ranking de dano ----------

export type GolpeId = "rajada" | "tatico" | "granada" | "fintar";

export const GOLPES: Record<GolpeId, { nome: string; emoji: string; descricao: string; mult: number; contra: number }> = {
  rajada: { nome: "Rajada", emoji: "🔫", descricao: "Dano normal, leva o contra-ataque inteiro.", mult: 1, contra: 1 },
  tatico: { nome: "Golpe tático", emoji: "🎯", descricao: "Menos dano, metade do contra-ataque.", mult: 0.7, contra: 0.5 },
  granada: { nome: "Granada", emoji: "💣", descricao: "Dano enorme. Só uma por batalha.", mult: 1.9, contra: 1 },
  fintar: { nome: "Fintar", emoji: "🌀", descricao: "Pouco dano, escapa do golpe do capo e dobra o próximo ataque.", mult: 0.3, contra: 0 },
};

// golpe especial do capo em cada rodada
export const GOLPES_CAPO = [
  { nome: "Tiro certeiro", emoji: "🎯", descricao: "Contra-ataque normal.", contra: 1, reduz: 0 },
  { nome: "Chama reforços", emoji: "📞", descricao: "Seus ataques causam 30% menos dano nesta rodada.", contra: 0.8, reduz: 0.3 },
  { nome: "Fúria do capo", emoji: "🔥", descricao: "Contra-ataque em dobro.", contra: 2, reduz: 0 },
];

export interface BatalhaCapo {
  rodada: number; // 0, 1, 2
  dano: number;
  granadaUsada: boolean;
  fintou: boolean;
  emGrupo: boolean;
  vidaPerdida: number;
  log: string[];
}

interface EstadoCapo {
  semana: string;
  derrotado: boolean;
  dano?: number;
  vidaMax?: number;
  batalha?: BatalhaCapo | null;
}

function estadoCapo(save: GangstarSave): EstadoCapo {
  const c: EstadoCapo | undefined = save.emboscadas.capo;
  const semana = semanaAtual();
  if (!c || c.semana !== semana) return { semana, derrotado: false, dano: 0, batalha: null };
  return c;
}

function salvarCapo(save: GangstarSave, c: EstadoCapo): GangstarSave {
  return { ...save, emboscadas: { ...save.emboscadas, capo: c } };
}

export function vidaCapo(save: GangstarSave): { atual: number; max: number } {
  const c = estadoCapo(save);
  const max = c.vidaMax ?? capoDaSemana(save).poder * 8;
  return { atual: Math.max(0, max - (c.dano ?? 0)), max };
}

export function batalhaCapo(save: GangstarSave): BatalhaCapo | null {
  return estadoCapo(save).batalha ?? null;
}

export function danoCapoSemana(save: GangstarSave): number {
  return estadoCapo(save).dano ?? 0;
}

export function rankingDanoCapo(save: GangstarSave): { nome: string; dano: number; voce: boolean }[] {
  const { max } = vidaCapo(save);
  const semana = semanaAtual();
  const rnd = rngSemente(hashTexto(`capo-ranking-${semana}`));
  const rivais = GANGUES_RIVAIS.slice(-12)
    .map((g) => ({ g, r: rnd() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 7)
    .map(({ g }) => ({ nome: g.nome, dano: Math.round((max * (0.12 + rnd() * 0.6)) / 10) * 10, voce: false }));
  const p = save.personagem;
  return [...rivais, { nome: p.gangue ? `${p.gangue} (você)` : `${p.nome} (você)`, dano: danoCapoSemana(save), voce: true }].sort((a, b) => b.dano - a.dano);
}

export function iniciarBatalhaCapo(save: GangstarSave, emGrupo: boolean): { save: GangstarSave; erro?: string } {
  if (save.personagem.nivel < NIVEL_EMBOSCADA) return { save, erro: `Emboscadas liberam no nível ${NIVEL_EMBOSCADA}.` };
  const p = save.personagem;
  const c = estadoCapo(save);
  if (c.derrotado) return { save, erro: "O capo desta semana já caiu. Volte na segunda-feira." };
  if (c.batalha) return { save, erro: "Você já está numa batalha." };
  if (emGrupo && !save.bandidos.length) return { save, erro: "Você não tem bandidos para levar." };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  if (p.energia < ENERGIA_CAPO) return { save, erro: "Energia insuficiente." };
  if (p.vida < 40) return { save, erro: "Enfrentar um capo exige pelo menos 40 de vida." };
  const vidaMax = c.vidaMax ?? capoDaSemana(save).poder * 8;
  return {
    save: salvarCapo(
      { ...save, personagem: { ...p, energia: p.energia - ENERGIA_CAPO } },
      { ...c, vidaMax, batalha: { rodada: 0, dano: 0, granadaUsada: false, fintou: false, emGrupo, vidaPerdida: 0, log: [] } },
    ),
  };
}

export type ResultadoBatalhaCapo = {
  dano: number;
  vidaPerdida: number;
  derrotou: boolean;
  dinheiro: number;
  respeito: number;
  xp: number;
  saque?: ItemDef;
  bonusRanking: boolean;
  ocorrencias: string[];
};

export function golpearCapo(save: GangstarSave, golpe: GolpeId): { save: GangstarSave; erro?: string; fim?: ResultadoBatalhaCapo } {
  const c = estadoCapo(save);
  const b = c.batalha;
  if (!b) return { save, erro: "Nenhuma batalha em andamento." };
  if (golpe === "granada" && b.granadaUsada) return { save, erro: "Você já usou a granada nesta batalha." };
  const capo = capoDaSemana(save);
  const g = GOLPES[golpe];
  const especial = GOLPES_CAPO[b.rodada] ?? GOLPES_CAPO[0];
  const poder = (b.emGrupo ? poderEmboscadaGrupo(save) : poderEmboscada(save)) * (1 + bonusEspecial(save, "emboscada"));
  let dano = poder * g.mult * (0.85 + Math.random() * 0.3);
  if (b.fintou) dano *= 2;
  if (golpe !== "fintar") dano *= 1 - especial.reduz;
  dano = Math.max(1, Math.round(dano));
  const contraBase = Math.max(3, Math.min(18, Math.round(6 * (capo.poder / Math.max(1, poder)))));
  const reducaoColete = Math.min(0.5, (coleteEquipado(save)?.poder ?? 0) / 100);
  const contra = Math.round(contraBase * g.contra * especial.contra * (1 - reducaoColete));
  const p = save.personagem;
  const vida = Math.max(1, p.vida - contra);
  const log = [
    ...b.log,
    `R${b.rodada + 1}: ${especial.emoji} ${especial.nome} · você usou ${g.emoji} ${g.nome} e causou ${dano} de dano${contra > 0 ? `, levou ${contra}` : ", sem levar dano"}.`,
  ];
  const nb: BatalhaCapo = {
    ...b,
    rodada: b.rodada + 1,
    dano: b.dano + dano,
    granadaUsada: b.granadaUsada || golpe === "granada",
    fintou: golpe === "fintar",
    vidaPerdida: b.vidaPerdida + (p.vida - vida),
    log,
  };
  let novo: GangstarSave = { ...save, personagem: { ...p, vida } };
  const vidaMax = c.vidaMax ?? capo.poder * 8;
  const danoTotal = (c.dano ?? 0) + nb.dano;
  const acabou = nb.rodada >= 3 || vida <= 1 || danoTotal >= vidaMax;
  if (!acabou) return { save: salvarCapo(novo, { ...c, batalha: nb }) };

  // fim da batalha: soma o dano da semana; se zerou a vida, o capo cai
  const derrotou = danoTotal >= vidaMax;
  let ocorrencias: string[] = [];
  if (b.emGrupo && Math.random() < 0.3) {
    const r = baixasEmboscada(novo);
    novo = r.save;
    ocorrencias = r.ocorrencias;
  }
  const res: ResultadoBatalhaCapo = { dano: nb.dano, vidaPerdida: nb.vidaPerdida, derrotou, dinheiro: 0, respeito: Math.round(nb.dano / 20), xp: 30 + Math.round(nb.dano / 10), bonusRanking: false, ocorrencias };
  novo = desgastarEspecial(salvarCapo(novo, { ...c, vidaMax, dano: danoTotal, batalha: null, derrotado: derrotou }));
  if (derrotou) {
    const primeiro = rankingDanoCapo(novo)[0]?.voce ?? false;
    const parteGangue = b.emGrupo ? Math.round(capo.dinheiro * PARTE_GANGUE_EMBOSCADA) : 0;
    res.dinheiro = Math.round((capo.dinheiro - parteGangue) * (primeiro ? 1.5 : 1));
    res.bonusRanking = primeiro;
    res.respeito += 40 + Math.round(capo.poder / 4);
    res.xp += 150 + capo.poder;
    res.saque = capo.saque;
    novo = contar({ ...novo, inventario: addInventario(novo.inventario, chaveItem(capo.saque.id, capo.qualidade), 1) }, "caposDerrotados");
  }
  const pf = ganharXp({ ...novo.personagem, dinheiro: novo.personagem.dinheiro + res.dinheiro, respeito: novo.personagem.respeito + res.respeito }, res.xp);
  return { save: { ...novo, personagem: pf }, fim: res };
}

// ---------- Historia: capitulo 9 com escolha, e dois caminhos ----------

export type CaminhoHistoria = "alianca" | "guerra";

export const ESCOLHA_HISTORIA: { pergunta: string; opcoes: { id: CaminhoHistoria; titulo: string; texto: string }[] } = {
  pergunta: "Os Corvos Cinza querem uma resposta. Aliança ou guerra?",
  opcoes: [
    { id: "alianca", titulo: "🤝 Aliança", texto: "Dividir a cidade com os Corvos: mais negócios, menos sangue." },
    { id: "guerra", titulo: "⚔️ Guerra", texto: "Ninguém divide o trono. Esmague os Corvos." },
  ],
};

const CAPITULO_ESCOLHA: CapituloHistoria = {
  titulo: "O recado dos Corvos",
  texto: "Os Corvos Cinza mandaram um recado: ou vocês dividem a cidade, ou vão se matar por ela. Prove sua força antes de responder.",
  objetivos: [
    { texto: "Chegue a 8.000 de respeito", alvo: 8000, progresso: (s) => s.personagem.respeito },
    { texto: "Complete 10 roubos em equipe", alvo: 10, progresso: (s) => estatistica(s, "missoesEquipeOk") },
  ],
  recompensa: { dinheiro: 200000, xp: 1800, respeito: 600 },
};

const CAPITULOS_ALIANCA: CapituloHistoria[] = [
  {
    titulo: "Negócio de família",
    texto: "Com os Corvos do seu lado, as rotas do porto se abriram. Hora de lucrar juntos.",
    objetivos: [
      { texto: "Entregue 15 navios", alvo: 15, progresso: (s) => estatistica(s, "naviosEntregues") },
      { texto: "Venda 300 itens nas suas lojas", alvo: 300, progresso: (s) => estatistica(s, "itensVendidosLojas") },
    ],
    recompensa: { dinheiro: 300000, xp: 2200, respeito: 700 },
  },
  {
    titulo: "O conselho das famílias",
    texto: "As famílias querem um líder que mantenha a paz. E querem ver dinheiro.",
    objetivos: [
      { texto: "Patrimônio de R$ 2.000.000", alvo: 2000000, progresso: (s) => patrimonio(s) },
      { texto: "Domine 6 extorsões", alvo: 6, progresso: (s) => Object.keys(s.extorsoes).length },
    ],
    recompensa: { dinheiro: 450000, xp: 2800, respeito: 900 },
  },
  {
    titulo: "Final: O Padrinho",
    texto: "Sem disparar um tiro a mais, você virou a voz que todas as gangues obedecem. A paz tem dono — e o dono é você.",
    objetivos: [
      { texto: "Chegue a 25.000 de respeito", alvo: 25000, progresso: (s) => s.personagem.respeito },
      { texto: "Derrote 3 capos", alvo: 3, progresso: (s) => estatistica(s, "caposDerrotados") },
    ],
    recompensa: { dinheiro: 800000, xp: 4000, respeito: 1500 },
  },
];

const CAPITULOS_GUERRA: CapituloHistoria[] = [
  {
    titulo: "Sangue no asfalto",
    texto: "A guerra começou. Cada esquina é uma trincheira.",
    objetivos: [
      { texto: "Vença 6 guerras de território", alvo: 6, progresso: (s) => estatistica(s, "guerrasVencidas") },
      { texto: "Vença 20 emboscadas", alvo: 20, progresso: (s) => estatistica(s, "emboscadasOk") },
    ],
    recompensa: { dinheiro: 300000, xp: 2400, respeito: 900 },
  },
  {
    titulo: "Terra arrasada",
    texto: "Os Corvos estão encurralados. Não deixe sobrar ninguém para contar a história.",
    objetivos: [
      { texto: "Tenha 8 bandidos na gangue", alvo: 8, progresso: (s) => s.bandidos.length },
      { texto: "Derrote 3 capos", alvo: 3, progresso: (s) => estatistica(s, "caposDerrotados") },
    ],
    recompensa: { dinheiro: 450000, xp: 3000, respeito: 1100 },
  },
  {
    titulo: "Final: O Rei Sangrento",
    texto: "Os Corvos não existem mais. A cidade te teme — e o medo é a coroa mais pesada que existe.",
    objetivos: [
      { texto: "Chegue a 30.000 de respeito", alvo: 30000, progresso: (s) => s.personagem.respeito },
      { texto: "Vença 15 guerras de território", alvo: 15, progresso: (s) => estatistica(s, "guerrasVencidas") },
    ],
    recompensa: { dinheiro: 800000, xp: 4000, respeito: 2000 },
  },
];

export const TOTAL_CAPITULOS = CAPITULOS.length + 1 + CAPITULOS_ALIANCA.length;

export function caminhoHistoria(save: GangstarSave): CaminhoHistoria | null {
  return save.historia?.caminho ?? null;
}

// lista de capitulos que o jogador ve (o caminho so aparece depois da escolha)
export function capitulosDoJogador(save: GangstarSave): (CapituloHistoria | null)[] {
  const caminho = caminhoHistoria(save);
  const depois = caminho === "alianca" ? CAPITULOS_ALIANCA : caminho === "guerra" ? CAPITULOS_GUERRA : CAPITULOS_ALIANCA.map(() => null);
  return [...CAPITULOS, CAPITULO_ESCOLHA, ...depois];
}

export function capituloPedeEscolha(save: GangstarSave): boolean {
  return (save.historia?.capitulo ?? 0) === CAPITULOS.length && !caminhoHistoria(save);
}


// =====================================================================
// v4.61: vida gasta por acao, respeito perdido na prisao, durabilidade dos
// itens raros, linhas de producao, consumo na boate e missoes mais baratas.
// =====================================================================

export const VIDA_ROUBO_SOLO = 2;
// os 3 primeiros roubos solo (de iniciante) nao tiram vida
export const ROUBOS_SEM_VIDA = ["carteira", "celular", "conveniencia"];

export function vidaDoRoubo(rouboId: string): number {
  return ROUBOS_SEM_VIDA.includes(rouboId) ? 0 : VIDA_ROUBO_SOLO;
}
export const VIDA_ROUBO_EQUIPE = 5;
export const VIDA_EXTORSAO = 1;
export const VIDA_EMBOSCADA = 10;
export const RESPEITO_PERDIDO_PRISAO = 100;
export const RESPEITO_PERDIDO_INTERNACAO = 20;

function exigeVida(save: GangstarSave, custo: number): string | undefined {
  if (save.personagem.preso) return msgBloqueado(save.personagem);
  return save.personagem.vida <= custo ? `Você está muito ferido (precisa de mais de ${custo} de vida). Cure-se no Hospital.` : undefined;
}

// depois de uma acao: tira a vida, derruba o respeito se acabou preso e desgasta o item raro
function posAcao<T extends { save: GangstarSave; erro?: string }>(antes: GangstarSave, r: T, custoVida: number, desgasta = true): T {
  if (r.erro) return r;
  let p = r.save.personagem;
  if (custoVida > 0) p = { ...p, vida: Math.max(1, p.vida - custoVida) };
  if (!antes.personagem.preso && p.preso) {
    p = { ...p, respeito: Math.max(0, p.respeito - (p.preso.hospital ? RESPEITO_PERDIDO_INTERNACAO : RESPEITO_PERDIDO_PRISAO)) };
  }
  let s: GangstarSave = { ...r.save, personagem: p };
  if (desgasta) s = desgastarEspecial(s);
  return { ...r, save: s };
}

// ---------- Durabilidade dos itens raros ----------

export const DURABILIDADE_RARIDADE: Record<Raridade, number> = { comum: 25, raro: 35, epico: 50, lendario: 70 };

export function durabilidadeMax(item: ItemDef): number {
  return DURABILIDADE_RARIDADE[item.raridade ?? "comum"];
}

export function durabilidadeItem(save: GangstarSave, id: string): number {
  const item = itemPorId(id);
  if (!item) return 0;
  return save.equipamento?.durabilidade?.[id] ?? durabilidadeMax(item);
}

function desgastarEspecial(save: GangstarSave): GangstarSave {
  const item = especialEquipado(save);
  if (!item) return save;
  const d = durabilidadeItem(save, item.id);
  if (d <= 0) return save;
  return { ...save, equipamento: { ...save.equipamento, durabilidade: { ...(save.equipamento.durabilidade ?? {}), [item.id]: d - 1 } } };
}

export function custoConserto(save: GangstarSave, id: string): number {
  const item = itemPorId(id);
  if (!item) return 0;
  const falta = 1 - durabilidadeItem(save, id) / durabilidadeMax(item);
  if (falta <= 0) return 0;
  return Math.max(200, Math.round((item.valor * 0.6 * falta) / 50) * 50);
}

export function consertarItemRaro(save: GangstarSave, id: string): { save: GangstarSave; erro?: string } {
  const item = itemPorId(id);
  if (!item || item.categoria !== "especial") return { save, erro: "Só itens raros são consertados aqui." };
  if (qtdItem(save, id) <= 0) return { save, erro: "Você não tem esse item." };
  const custo = custoConserto(save, id);
  if (custo <= 0) return { save, erro: "Esse item está inteiro." };
  if (save.personagem.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  return {
    save: {
      ...save,
      personagem: { ...save.personagem, dinheiro: save.personagem.dinheiro - custo },
      equipamento: { ...save.equipamento, durabilidade: { ...(save.equipamento.durabilidade ?? {}), [id]: durabilidadeMax(item) } },
    },
  };
}

// ---------- Linhas de producao das fabricas (1 a 5) ----------

export function linhasFabrica(inst: PredioInstancia): number {
  return ehFabrica(inst.tipo) ? Math.min(5, Math.ceil(inst.nivel / 2)) : 0;
}

// a linha i como se fosse a fabrica (para reaproveitar as contas de producao)
export function instLinha(inst: PredioInstancia, i: number): PredioInstancia {
  if (i === 0) return inst;
  const l = inst.linhas?.[i - 1];
  return { ...inst, produto: l?.produto, ultimaColeta: l?.ultimaColeta ?? inst.ultimaColeta };
}

// ao evoluir, as linhas novas comecam a produzir na hora
function comLinhasNovas(inst: PredioInstancia): PredioInstancia {
  const n = linhasFabrica(inst) - 1;
  if (n <= 0) return inst;
  const linhas = [...(inst.linhas ?? [])];
  while (linhas.length < n) linhas.push({ ultimaColeta: Date.now() });
  return { ...inst, linhas };
}

export function unidadesProntasTotal(inst: PredioInstancia, save?: GangstarSave): number {
  let t = 0;
  for (let i = 0; i < linhasFabrica(inst); i++) t += unidadesProntas(instLinha(inst, i), save);
  return t;
}

// ---------- Boate: voce consome os itens da prateleira ----------

export function consumirNaBoate(save: GangstarSave, lojaId: string, chave: string): { save: GangstarSave; erro?: string; overdose?: boolean } {
  const inst = save.predios[lojaId];
  if (!inst || inst.tipo !== "boate") return { save, erro: "Isso só dá para fazer na sua boate." };
  if ((inst.estoque?.[chave] ?? 0) <= 0) return { save, erro: "Esse item acabou na prateleira." };
  const estoque = { ...inst.estoque };
  estoque[chave] -= 1;
  if (estoque[chave] <= 0) delete estoque[chave];
  // passa pelo inventario so para reaproveitar o efeito do consumo
  const tmp: GangstarSave = { ...save, inventario: addInventario(save.inventario, chave, 1), predios: { ...save.predios, [lojaId]: { ...inst, estoque } } };
  const r = usarItem(tmp, chave);
  if (r.erro) return { save, erro: r.erro };
  return r;
}

// ---------- Qualidade em notas (C, B, A, S, SS) ----------

export const NOTAS_QUALIDADE = ["C", "B", "A", "S", "SS"] as const;

export function notaQualidade(q: number): (typeof NOTAS_QUALIDADE)[number] {
  return NOTAS_QUALIDADE[Math.max(1, Math.min(5, q)) - 1];
}

// ---------- Recompensas das missoes (historia e conquistas) bem menores ----------

for (const c of [...CAPITULOS, CAPITULO_ESCOLHA, ...CAPITULOS_ALIANCA, ...CAPITULOS_GUERRA]) {
  c.recompensa.dinheiro = Math.max(500, Math.round((c.recompensa.dinheiro * 0.2) / 100) * 100);
}
for (const c of CONQUISTAS) c.recompensa = Math.max(300, Math.round((c.recompensa * 0.2) / 100) * 100);


// =====================================================================
// v4.62: bandidos que evoluem e o cardapio da boate (bebidas, drogas, garotas)
// =====================================================================

export const NIVEL_MAX_BANDIDO = 10;

export function xpParaProximoNivelBandido(nivel: number): number {
  return 40 + nivel * 35;
}

// soma xp ao bandido; cada nivel novo da +5 a +7 de poder
export function evoluirBandido(b: Bandido, xp: number): Bandido {
  let nb: Bandido = { ...b, xp: (b.xp ?? 0) + xp };
  while (nb.nivel < NIVEL_MAX_BANDIDO && (nb.xp ?? 0) >= xpParaProximoNivelBandido(nb.nivel)) {
    nb = { ...nb, xp: (nb.xp ?? 0) - xpParaProximoNivelBandido(nb.nivel), nivel: nb.nivel + 1, poder: nb.poder + 5 + Math.floor(Math.random() * 3) };
  }
  if (nb.nivel >= NIVEL_MAX_BANDIDO) nb = { ...nb, xp: 0 };
  return nb;
}

// ---------- Boate: bebidas, drogas e garotas ----------

export type SecaoBoate = "bebidas" | "drogas" | "garotas";

// na boate os produtos custam bem mais que o valor normal
export const MARKUP_BOATE = 2.5;

export interface GarotaDef {
  id: string;
  nome: string;
  emoji: string;
  custo: number;
  energia: number;
  vida: number;
  vicio: number;
  descricao: string;
}

export const GAROTAS: GarotaDef[] = [
  { id: "boneca", nome: "Boneca inflável", emoji: "🎈", custo: 400, energia: 12, vida: 0, vicio: 1, descricao: "Barata e sem conversa." },
  { id: "garota-barata", nome: "Garota barata", emoji: "💃", custo: 1200, energia: 28, vida: 0, vicio: 3, descricao: "Uma dança e uma bebida no balcão." },
  { id: "acompanhante", nome: "Acompanhante", emoji: "👠", custo: 2500, energia: 40, vida: 5, vicio: 4, descricao: "Companhia a noite inteira." },
  { id: "dancarina", nome: "Dançarina exótica", emoji: "🪩", custo: 4500, energia: 55, vida: 10, vicio: 5, descricao: "Show particular na área VIP." },
  { id: "garota-luxo", nome: "Garota de luxo", emoji: "💎", custo: 8000, energia: 75, vida: 20, vicio: 6, descricao: "Suíte, champanhe e massagem." },
  { id: "modelo", nome: "Modelo internacional", emoji: "👑", custo: 15000, energia: 100, vida: 35, vicio: 8, descricao: "Só para quem manda na cidade." },
];

export function itensSecaoBoate(secao: SecaoBoate): ItemDef[] {
  if (secao === "bebidas") return ITENS.filter((i) => i.categoria === "bebida");
  if (secao === "drogas") return ITENS.filter((i) => i.categoria === "droga" || i.categoria === "medicamento");
  return [];
}

export function precoNaBoate(save: GangstarSave, item: ItemDef): number {
  const batida = eventoEstaAtivo(save, "batida-boates") ? 1.5 : 1;
  return Math.round((item.valor * MARKUP_BOATE * batida) / 10) * 10;
}

// na sua propria boate as garotas saem 30% mais baratas
export function custoGarota(save: GangstarSave, g: GarotaDef, naPropriaBoate: boolean): number {
  const batida = eventoEstaAtivo(save, "batida-boates") ? 1.5 : 1;
  return Math.round((g.custo * batida * (naPropriaBoate ? 0.7 : 1)) / 10) * 10;
}

// compra e consome na hora (boate do Hub)
export function consumirItemBoate(save: GangstarSave, itemId: string): { save: GangstarSave; erro?: string; overdose?: boolean } {
  const item = itemPorId(itemId);
  if (!item || !ehConsumivel(item)) return { save, erro: "Produto inválido." };
  const preco = precoNaBoate(save, item);
  if (save.personagem.dinheiro < preco) return { save, erro: "Dinheiro insuficiente." };
  const chave = chaveItem(item.id, 1);
  const tmp: GangstarSave = { ...save, inventario: addInventario(save.inventario, chave, 1) };
  const r = usarItem(tmp, chave);
  if (r.erro) return { save, erro: r.erro };
  return { ...r, save: { ...r.save, personagem: { ...r.save.personagem, dinheiro: r.save.personagem.dinheiro - preco } } };
}

export function contratarGarota(save: GangstarSave, garotaId: string, naPropriaBoate = false): { save: GangstarSave; erro?: string; overdose?: boolean } {
  const g = GAROTAS.find((x) => x.id === garotaId);
  if (!g) return { save, erro: "Opção inválida." };
  const p = save.personagem;
  if (p.preso) return { save, erro: msgBloqueado(p) };
  const custo = custoGarota(save, g, naPropriaBoate);
  if (p.energia >= p.energiaMax && p.vida >= p.vidaMax) return { save, erro: "Sua energia e sua vida já estão cheias." };
  if (p.vicio + g.vicio > VICIO_MAX) return { save, erro: "Você está intoxicado demais." };
  if (p.dinheiro < custo) return { save, erro: "Dinheiro insuficiente." };
  const novo: GangstarSave = {
    ...save,
    personagem: {
      ...p,
      dinheiro: p.dinheiro - custo,
      energia: Math.min(p.energiaMax, p.energia + g.energia),
      vida: Math.min(p.vidaMax, p.vida + g.vida),
      vicio: Math.min(VICIO_MAX, p.vicio + g.vicio),
    },
  };
  return verificarOverdose(novo);
}

// itens da prateleira da sua boate, por secao
export function estoqueBoatePorSecao(save: GangstarSave, lojaId: string, secao: SecaoBoate): { chave: string; qtd: number; q: number; item: ItemDef }[] {
  const inst = save.predios[lojaId];
  const ids = new Set(itensSecaoBoate(secao).map((i) => i.id));
  return Object.entries(inst?.estoque ?? {})
    .filter(([, n]) => n > 0)
    .map(([chave, qtd]) => {
      const { id, q } = parseChave(chave);
      return { chave, qtd, q, item: itemPorId(id) };
    })
    .filter((x): x is { chave: string; qtd: number; q: number; item: ItemDef } => !!x.item && ids.has(x.item.id));
}


// =====================================================================
// v4.63: Bolsa de valores do Hub (20 empresas ficticias, preco muda a cada 2 min)
// =====================================================================

export const NIVEL_BOLSA = 22;
export const MS_TICK_BOLSA = 2 * 60 * 1000;
export const TAXA_CORRETAGEM = 0.005; // 0,5% em cada compra e venda

export interface EmpresaBolsa {
  ticker: string;
  nome: string;
  emoji: string;
  base: number; // preco medio de longo prazo
  vol: number; // volatilidade (0.02 = calma, 0.08 = louca)
}

export const EMPRESAS_BOLSA: EmpresaBolsa[] = [
  { ticker: "PTRZ3", nome: "Petrozul Energia", emoji: "🛢️", base: 38, vol: 0.03 },
  { ticker: "VLXA3", nome: "Valex Mineração", emoji: "⛏️", base: 72, vol: 0.035 },
  { ticker: "BNCR4", nome: "Banco Cruzeiro", emoji: "🏦", base: 29, vol: 0.02 },
  { ticker: "ITMA4", nome: "Itamar Financeira", emoji: "💳", base: 33, vol: 0.025 },
  { ticker: "MGLZ3", nome: "Magazine Luzia", emoji: "🛍️", base: 9, vol: 0.06 },
  { ticker: "AMBR3", nome: "Ambrev Bebidas", emoji: "🍺", base: 14, vol: 0.02 },
  { ticker: "JBSX3", nome: "Jotabê Carnes", emoji: "🥩", base: 26, vol: 0.03 },
  { ticker: "EMBX3", nome: "Embrax Aviões", emoji: "✈️", base: 48, vol: 0.045 },
  { ticker: "WGEL3", nome: "Weggel Motores", emoji: "⚙️", base: 41, vol: 0.025 },
  { ticker: "RNTX3", nome: "Rentax Locadora", emoji: "🚗", base: 55, vol: 0.035 },
  { ticker: "SZPL3", nome: "Suzapel Celulose", emoji: "📜", base: 52, vol: 0.03 },
  { ticker: "TMSA3", nome: "Telemais", emoji: "📡", base: 12, vol: 0.025 },
  { ticker: "CPLX6", nome: "Copelux Elétrica", emoji: "⚡", base: 8, vol: 0.02 },
  { ticker: "HPVD3", nome: "Hapvida Saúde", emoji: "🏥", base: 4, vol: 0.06 },
  { ticker: "CSNX3", nome: "Siderúrgica Nacional", emoji: "🏗️", base: 15, vol: 0.04 },
  { ticker: "GOLX4", nome: "Golx Linhas Aéreas", emoji: "🛫", base: 6, vol: 0.07 },
  { ticker: "CYRX3", nome: "Cyrex Imóveis", emoji: "🏢", base: 18, vol: 0.04 },
  { ticker: "NUVX3", nome: "Nuvexa Tech", emoji: "💻", base: 23, vol: 0.075 },
  { ticker: "CRPT3", nome: "CriptoMoeda Brasil", emoji: "🪙", base: 3, vol: 0.09 },
  { ticker: "AZLX3", nome: "Azulão Varejo", emoji: "🛒", base: 11, vol: 0.045 },
];

export function tickBolsa(agora = Date.now()): number {
  return Math.floor(agora / MS_TICK_BOLSA);
}

// ruido deterministico em [-1, 1] (o mesmo para todos os jogadores)
function ruido(ticker: string, n: number): number {
  return (hashTexto(`${ticker}#${n}`) % 20001) / 10000 - 1;
}

// preco no tick n: ciclos longos + ondas medias + ruido do tick (sem precisar de historico)
export function precoAcao(e: EmpresaBolsa, n = tickBolsa()): number {
  const h = hashTexto(e.ticker);
  const f1 = ((h % 1000) / 1000) * Math.PI * 2;
  const f2 = (((h >> 10) % 1000) / 1000) * Math.PI * 2;
  const f3 = (((h >> 20) % 1000) / 1000) * Math.PI * 2;
  const p1 = 2000 + (h % 1500); // ~3 a 5 dias
  const p2 = 300 + ((h >> 8) % 250); // ~10 a 18 horas
  const p3 = 45 + ((h >> 16) % 40); // ~1,5 a 3 horas
  const log =
    Math.sin((2 * Math.PI * n) / p1 + f1) * e.vol * 6 +
    Math.sin((2 * Math.PI * n) / p2 + f2) * e.vol * 3 +
    Math.sin((2 * Math.PI * n) / p3 + f3) * e.vol * 1.5 +
    (ruido(e.ticker, n) * 0.6 + ruido(e.ticker, n - 1) * 0.4) * e.vol;
  return Math.max(0.5, Math.round(e.base * Math.exp(log) * 100) / 100);
}

export function historicoAcao(e: EmpresaBolsa, pontos = 60, agora = Date.now()): number[] {
  const n = tickBolsa(agora);
  return Array.from({ length: pontos }, (_, i) => precoAcao(e, n - (pontos - 1 - i)));
}

export function variacaoAcao(e: EmpresaBolsa, agora = Date.now()): number {
  const n = tickBolsa(agora);
  const antes = precoAcao(e, n - 30); // variacao da ultima hora
  return (precoAcao(e, n) - antes) / antes;
}

export function empresaPorTicker(t: string): EmpresaBolsa | undefined {
  return EMPRESAS_BOLSA.find((e) => e.ticker === t);
}

export function valorCarteira(save: GangstarSave): number {
  return Math.round(
    Object.entries(save.acoes ?? {}).reduce((a, [t, pos]) => {
      const e = empresaPorTicker(t);
      return a + (e ? precoAcao(e) * pos.qtd : 0);
    }, 0),
  );
}

export function podeUsarBolsa(save: GangstarSave): boolean {
  return save.personagem.nivel >= NIVEL_BOLSA;
}

// quantidade vazia (null) = tudo: compra o maximo que o dinheiro paga
export function comprarAcoes(save: GangstarSave, ticker: string, qtd: number | null): { save: GangstarSave; erro?: string; qtd?: number; total?: number } {
  const e = empresaPorTicker(ticker);
  const p = save.personagem;
  if (!e) return { save, erro: "Ação inválida." };
  if (!podeUsarBolsa(save)) return { save, erro: `A Bolsa abre para você no nível ${NIVEL_BOLSA}.` };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  const preco = precoAcao(e);
  const custoUnit = preco * (1 + TAXA_CORRETAGEM);
  const max = Math.floor(Math.max(0, p.dinheiro) / custoUnit);
  const q = qtd === null ? max : Math.floor(qtd);
  if (q <= 0) return { save, erro: qtd === null ? "Dinheiro insuficiente para comprar uma ação." : "Quantidade inválida." };
  if (q > max) return { save, erro: `Dinheiro suficiente para no máximo ${max.toLocaleString("pt-BR")} ações.` };
  const total = Math.round(q * custoUnit);
  const pos = save.acoes?.[ticker] ?? { qtd: 0, precoMedio: 0 };
  const novaQtd = pos.qtd + q;
  const precoMedio = Math.round(((pos.qtd * pos.precoMedio + total) / novaQtd) * 100) / 100;
  return {
    save: { ...save, personagem: { ...p, dinheiro: p.dinheiro - total }, acoes: { ...(save.acoes ?? {}), [ticker]: { qtd: novaQtd, precoMedio } } },
    qtd: q,
    total,
  };
}

// quantidade vazia (null) = vende tudo
export function venderAcoes(save: GangstarSave, ticker: string, qtd: number | null): { save: GangstarSave; erro?: string; qtd?: number; total?: number; lucro?: number } {
  const e = empresaPorTicker(ticker);
  const p = save.personagem;
  if (!e) return { save, erro: "Ação inválida." };
  if (!podeUsarBolsa(save)) return { save, erro: `A Bolsa abre para você no nível ${NIVEL_BOLSA}.` };
  if (p.preso) return { save, erro: msgBloqueado(p) };
  const pos = save.acoes?.[ticker];
  if (!pos || pos.qtd <= 0) return { save, erro: "Você não tem essa ação." };
  const q = qtd === null ? pos.qtd : Math.floor(qtd);
  if (q <= 0) return { save, erro: "Quantidade inválida." };
  if (q > pos.qtd) return { save, erro: `Você só tem ${pos.qtd.toLocaleString("pt-BR")} ações.` };
  const total = Math.round(q * precoAcao(e) * (1 - TAXA_CORRETAGEM));
  const lucro = Math.round(total - q * pos.precoMedio);
  const acoes = { ...(save.acoes ?? {}) };
  if (q === pos.qtd) delete acoes[ticker];
  else acoes[ticker] = { ...pos, qtd: pos.qtd - q };
  return { save: { ...save, personagem: { ...p, dinheiro: p.dinheiro + total }, acoes }, qtd: q, total, lucro };
}


// =====================================================================
// v4.64: liberacoes por nivel (25 niveis) e pop-up de "subiu de nivel"
// =====================================================================

export const NIVEL_EXTORSAO = 5;
export const NIVEL_PORTO = 7;
export const NIVEL_MERCADOR = 7;
export const NIVEL_EMBOSCADA = 7;

// existe save de antes da v4.64 com nivel baixo para o XP que tem: sobe para o nivel certo
export function corrigirNivelPeloXp(save: GangstarSave): GangstarSave {
  const p = save.personagem;
  const certo = nivelDoXp(p.xp);
  return certo > p.nivel ? { ...save, personagem: { ...p, nivel: certo } } : save;
}

// tudo o que o nivel n libera (para o pop-up e para consulta)
export function liberacoesDoNivel(n: number): string[] {
  const l: string[] = [];
  const solo = ROUBOS.filter((r) => r.nivelMin === n);
  if (solo.length) l.push(`🎯 Roubos solo: ${solo.map((r) => `${r.emoji} ${r.nome}`).join(", ")}`);
  const equipe = MISSOES_EQUIPE.filter((m) => m.nivelMin === n);
  if (equipe.length) l.push(`👥 Roubos em equipe: ${equipe.map((m) => `${m.emoji} ${m.nome}`).join(", ")}`);
  const treinos = OPCOES_TREINO.filter((o) => o.nivelMin === n && n > 1);
  if (treinos.length) l.push(`📚 Treinos: ${treinos.map((o) => `${o.emoji} ${o.nome}`).join(", ")}`);
  const cand: Record<number, number> = { 5: 2, 9: 3, 13: 4, 18: 5 };
  if (cand[n]) l.push(`🎯 Recrutamento: candidatos até o nível ${cand[n]}`);
  if (n === NIVEL_EXTORSAO) l.push("💼 Extorsões liberadas");
  if (n === NIVEL_PORTO) l.push("⚓ Porto e 🧳 Mercador liberados");
  if (n === NIVEL_EMBOSCADA) l.push("🗡️ Emboscadas e o capo da semana liberados");
  if (n > NIVEL_PORTO && (n - NIVEL_PORTO) % 2 === 0 && n <= 23) l.push("📦 Mercador e Porto: produtos melhores e encomendas que pagam mais");
  if (n === NIVEL_BOLSA) l.push("📈 Bolsa de Valores (no Hub)");
  return l;
}


// =====================================================================
// v1.1: Temporada mensal. No dia 1 de cada mes o imperio zera; quem terminou o mes
// no top 3 do ranking de gangues ganha titulo e trofeu permanentes.
// =====================================================================

export interface Trofeu {
  mes: string; // "2026-11"
  posicao: number; // 1, 2 ou 3
  titulo: string;
  respeito: number;
}

const NOMES_MES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function mesDaTemporada(agora = Date.now()): string {
  const d = new Date(agora);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function inicioDoMes(agora = Date.now()): number {
  const d = new Date(agora);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function fimDaTemporada(agora = Date.now()): number {
  const d = new Date(agora);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

export function nomeDoMes(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return `${NOMES_MES[(m || 1) - 1]}/${ano}`;
}

export const TITULOS_TEMPORADA = [
  { emoji: "👑", nome: "Rei do Crime", cor: "#ffd23f" },
  { emoji: "🥈", nome: "Barão do Crime", cor: "#c9d1db" },
  { emoji: "🥉", nome: "Capo do Crime", cor: "#cd7f32" },
];

export function tituloDaPosicao(posicao: number, mes: string): string | null {
  const t = TITULOS_TEMPORADA[posicao - 1];
  return t ? `${t.emoji} ${t.nome} de ${nomeDoMes(mes)}` : null;
}

export function diasParaFimDaTemporada(agora = Date.now()): number {
  return Math.max(0, Math.ceil((fimDaTemporada(agora) - agora) / 86400000));
}

// posicao final: rivais com o crescimento do mes inteiro
function posicaoFinal(save: GangstarSave, mes: string): number {
  const [ano, m] = mes.split("-").map(Number);
  const fim = new Date(ano, m, 1).getTime() - 1;
  const rivais = GANGUES_RIVAIS.map((g) => Math.round(g.respeitoBase * fatorCrescimentoGangues(save, fim)));
  return rivais.filter((r) => r > save.personagem.respeito).length + 1;
}

export function verificarTemporada(save: GangstarSave, agora = Date.now()): GangstarSave {
  const mes = mesDaTemporada(agora);
  if (!save.temporada) return { ...save, temporada: { mes } };
  if (save.temporada.mes === mes) return save;

  // virou o mes: fecha a temporada anterior e zera o imperio
  const anterior = save.temporada.mes;
  const posicao = posicaoFinal(save, anterior);
  const titulo = tituloDaPosicao(posicao, anterior);
  const p = save.personagem;
  const trofeus = [...(save.trofeus ?? [])];
  if (titulo) trofeus.push({ mes: anterior, posicao, titulo, respeito: p.respeito });
  const novo = gangstar.novoJogo(p.nome, p.classe);
  return {
    ...novo,
    personagem: { ...novo.personagem, gangue: p.gangue },
    temporada: { mes },
    trofeus,
    ultimaTemporada: { mes: anterior, posicao, titulo, respeito: p.respeito, visto: false },
  };
}

export function marcarTemporadaVista(save: GangstarSave): GangstarSave {
  return save.ultimaTemporada ? { ...save, ultimaTemporada: { ...save.ultimaTemporada, visto: true } } : save;
}

export function tituloAtual(save: GangstarSave): Trofeu | null {
  const t = save.trofeus ?? [];
  if (!t.length) return null;
  // o melhor titulo; empate fica o mais recente
  return [...t].sort((a, b) => a.posicao - b.posicao || b.mes.localeCompare(a.mes))[0];
}
