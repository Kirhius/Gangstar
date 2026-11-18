"use client";

// Gangstar: pop-ups explicativos das caixas do topo (dinheiro limpo e sujo, energia,
// vida, respeito, alerta policial, poder e vicio).

import {
  CUSTO_ADVOGADO,
  DIAS_ADVOGADO,
  GangstarSave,
  SUSPEITA_BATIDA,
  SUSPEITA_PRISAO,
  VICIO_PERIGO,
  advogadoAtivo,
  contadores,
  horasParaLavar,
  poderDeRoubo,
  poderEmboscada,
  sujo,
  suspeitaAtual,
  totalNaLavagem,
} from "@/lib/gangstar";

export type InfoTopo = "limpo" | "sujo" | "energia" | "vida" | "respeito" | "alerta" | "poder" | "vicio";

export function nivelAlerta(s: number): "baixo" | "medio" | "alto" | "critico" {
  return s > SUSPEITA_PRISAO ? "critico" : s > SUSPEITA_BATIDA ? "alto" : s > 30 ? "medio" : "baixo";
}

function reais(v: number): string {
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}

export function PopupInfoTopo({ tipo, save, aoFechar }: { tipo: InfoTopo; save: GangstarSave; aoFechar: () => void }) {
  const p = save.personagem;
  const s = suspeitaAtual(save);
  const conteudo: Record<InfoTopo, { titulo: string; valor: string; linhas: string[] }> = {
    limpo: {
      titulo: "💵 Dinheiro limpo",
      valor: reais(p.dinheiro),
      linhas: [
        "Dinheiro com origem “explicável”: vendas das lojas e da boate, diárias do hotel, Porto, Bolsa, juros do banco, cassino e recompensas de missões.",
        "Só ele paga banco, Bolsa, prédios (comprar e evoluir), escola, academia, hospital e advogado.",
        `No banco: ${reais(p.banco.saldo)} (protegido de roubos).`,
      ],
    },
    sujo: {
      titulo: "🩸 Dinheiro sujo",
      valor: reais(sujo(p)),
      linhas: [
        "Vem do crime: roubos solo e em equipe, extorsões, emboscadas, capo, PvP e vendas ao Mercador.",
        "Paga Mercado Negro, Mercador, fiança, agiota, bandidos e a boate do Hub (o sujo sai primeiro).",
        "Para virar limpo: na Lavanderia do Hub (na hora, mas fica com 40% e tem limite por dia) ou nas suas fachadas (Boate, Hotel e lojas, mais baratas e sem limite): toque no prédio e use “Lavar dinheiro”.",
        `Na lavagem agora: ${reais(totalNaLavagem(save))}${horasParaLavar(save) > 0 ? ` (pronto em ~${Math.ceil(horasParaLavar(save) * 60)} min)` : ""}.`,
        "Cuidado: em emboscadas de outros jogadores, o dinheiro sujo é o primeiro a ser levado (20%).",
      ],
    },
    energia: {
      titulo: "⚡ Energia",
      valor: `${p.energia}/${p.energiaMax}`,
      linhas: [
        "Gasta em roubos, emboscadas, extorsões, treinos e batalhas contra o capo.",
        "Recupera 1 ponto a cada 2 minutos (o dobro na quinta). Bebidas, drogas e garotas da boate também dão energia.",
      ],
    },
    vida: {
      titulo: "❤️ Vida",
      valor: `${p.vida}/${p.vidaMax}`,
      linhas: [
        "Cada ação custa vida: roubo solo −2 (os 3 primeiros não), roubo em equipe −5, extorsão −1, emboscada −10.",
        "Muito ferido, você não consegue agir. Recupera 1 ponto a cada 3 minutos; o Hospital e os remédios curam na hora.",
      ],
    },
    respeito: {
      titulo: "⭐ Respeito",
      valor: p.respeito.toLocaleString("pt-BR"),
      linhas: [
        "É a sua posição no ranking de gangues (IA e jogadores reais). O top 3 do mês ganha título e troféu.",
        "Sobe com roubos, emboscadas, guerras e missões. Ser preso tira 100; ser internado tira 20.",
      ],
    },
    alerta: {
      titulo: "🚨 Alerta da Polícia Federal",
      valor: `${Math.round(s)}%`,
      linhas: [
        "Sobe quando você lava muito dinheiro de uma vez (+1% a cada R$ 5.000; em dobro na sexta). Cai 2% por hora sozinho.",
        `Acima de ${SUSPEITA_BATIDA}%: cada lavagem pode sofrer batida fiscal — perde 20% a 40% do sujo e da fila, e a fachada fecha por 2h.`,
        `Acima de ${SUSPEITA_PRISAO}%: além da batida, você pode ser preso.`,
        `Reduzem o alerta: contadores na gangue (você tem ${contadores(save).length}), o item raro Livro-caixa duplo e um advogado (${reais(CUSTO_ADVOGADO)} por ${DIAS_ADVOGADO} dias, na Delegacia do Hub).`,
        advogadoAtivo(save) ? "⚖️ Advogado ativo: −30% de alerta e fiança pela metade." : "⚖️ Sem advogado no momento.",
      ],
    },
    poder: {
      titulo: "💪 Poder total",
      valor: `${Math.round(poderEmboscada(save))}`,
      linhas: [
        `Seu poder de roubo é ${Math.round(poderDeRoubo(save))} (força, inteligência, arma, colete e item especial). Somado à sua gangue, dá o poder total.`,
        "Decide as chances nas emboscadas, contra o capo e nos ataques a outros jogadores.",
        "Aumente treinando na academia e na escola, com armas melhores e contratando bandidos.",
      ],
    },
    vicio: {
      titulo: "🌀 Vício",
      valor: `${p.vicio}/100`,
      linhas: [
        "Sobe ao consumir bebidas, drogas e garotas. Cai 1 ponto a cada 10 minutos, ou na desintoxicação do Hospital.",
        `De ${VICIO_PERIGO} a 100, cada consumo pode dar overdose: 10 min internado, R$ 1.000 de taxa, −20 de respeito e −2% de força, resistência, carisma e intelecto.`,
      ],
    },
  };
  const c = conteudo[tipo];
  return (
    <div className="gs-popup-fundo" onClick={aoFechar}>
      <div className="gs-popup-painel gs-info-topo" onClick={(e) => e.stopPropagation()}>
        <div className="gs-popup-topo">
          <h3 className="gs-h3" style={{ margin: 0 }}>
            {c.titulo}
          </h3>
          <button className="gs-popup-fechar" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className={`gs-info-valor gs-info-${tipo}`}>{c.valor}</div>
        <ul className="gs-info-linhas">
          {c.linhas.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
