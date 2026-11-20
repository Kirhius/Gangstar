"use client";

// Gangstar: aviso do item especial equipado (v1.15). Aparece na tela onde o bonus do item
// faz efeito - no canto inferior direito dos mapas, ou alinhado a direita nas outras telas -
// com a cor da raridade. Ex.: "💼 Maleta de couro • +15% nas coletas de extorsão".

import { bonusEspecial, especialEquipado, type GangstarSave } from "@/lib/gangstar";
import { RARIDADES, type TipoBonusEspecial } from "@/lib/gangstarItens";

export function AvisoBuff({ save, tipos, noMapa }: { save: GangstarSave; tipos: TipoBonusEspecial[]; noMapa?: boolean }) {
  const item = especialEquipado(save);
  if (!item?.bonus || !tipos.includes(item.bonus.tipo) || bonusEspecial(save, item.bonus.tipo) <= 0) return null;
  const cor = RARIDADES[item.raridade ?? "comum"].cor;
  const aviso = (
    <span className="gs-aviso-buff" style={{ borderColor: cor, color: cor, boxShadow: `0 0 8px ${cor}66` }}>
      {item.emoji} {item.nome} • <span className="gs-aviso-buff-texto">{item.descricao}</span>
    </span>
  );
  return noMapa ? aviso : <div className="gs-aviso-buff-linha">{aviso}</div>;
}
