# Gangstar

Jogo de construção de império do crime (PWA, mobile-first) com estética pixel/retrô/arcade. Todos os nomes de pessoas, gangues e empresas são fictícios.

Começou como um modo dentro do FutOnze e virou um jogo próprio na **v1.0.0** (equivalente à v4.64.0 do FutOnze).

## Como rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção
```

Deploy: Vercel. Sem as variáveis do Supabase o jogo roda offline (save só no aparelho). Com elas, vira multiplayer.

## Multiplayer (Supabase)

1. Crie um projeto no Supabase (ou use um existente: as tabelas têm prefixo `gs_`).
2. No **SQL Editor**, rode o arquivo `supabase/schema.sql` inteiro.
3. **Authentication → URL Configuration:** Site URL `https://gangstar1.vercel.app` e, em Redirect URLs, `https://gangstar1.vercel.app/**`.
4. **Authentication → Providers → Google:** ative e cole o Client ID e o Client Secret do Google Cloud (OAuth, tipo "Aplicativo da Web", com a URL de callback que o Supabase mostra nessa tela).
5. Na **Vercel → Settings → Environment Variables**, cadastre `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (veja `.env.example`) e faça um **Redeploy**.

Como fica sincronizado: o save de cada jogador fica na nuvem (`gs_saves`) e um resumo público (`gs_jogadores`) alimenta o ranking e a lista de alvos. Ataques PvP são resolvidos **só no servidor** (`/api/pvp/atacar`), que grava um registro único em `gs_ataques`; os dois aparelhos aplicam o mesmo resultado, e o defensor recebe na hora pelo Realtime.

## Estrutura

- `src/lib/gangstar.ts` — motor do jogo (save, roubos, gangue, prédios, fábricas, lojas, porto, emboscadas, capo, cassino, bolsa, missões, níveis)
- `src/lib/gangstarItens.ts` — catálogo de itens (bebidas, drogas, remédios, armas, coletes, itens raros)
- `src/lib/cassino.ts` — roleta, blackjack, caça-níquel e poker
- `src/components/gangstar/` — telas, mapas e componentes (classes CSS com prefixo `gs-`)
- `public/gangstar/` — artes dos mapas (Minha Cidade, Hub, Porto) e ilustrações

## Roadmap

**Itens e equipamento**
1. **Slot Especial** (3º slot do Perfil): itens raros com buff único. Exemplos: Maleta de couro (+15% nas coletas de extorsão), Punho inglês (+8% de poder), Relógio de ouro (+10% de respeito nos roubos), Distintivo falso (−20% de chance de prisão), Celular criptografado (+1 alvo de emboscada por hora), Amuleto da sorte (+5% no cassino).
   - Como conseguir: drop raro em roubos grandes e emboscadas, prêmio de contratos especiais do Porto e estoque "lendário" do Mercador.
   - Raridade (comum, raro, épico, lendário) com cor na borda do item, e durabilidade (o item quebra depois de N usos e pode ser consertado).
2. **Cadeias de produção:** insumos (ex.: a Destilaria precisa de grãos comprados no Porto), e itens combinados (kit de primeiros socorros = analgésico + kit de sutura).
3. **Gerente de loja:** um bandido contratado que repõe a prateleira sozinho a partir do inventário e avisa quando o estoque acaba.

**Mundo e PvE**
4. **Rotas do Porto por nível**, com seguro de carga e navio próprio evoluível.
5. **Reabilitação:** clínica que zera o vício de vez (caro), com efeito colateral de perder energia por um dia.
6. **Multiplayer:** contas (Supabase Auth), save na nuvem, ranking global, ataques PvP assíncronos e guerra entre gangues de amigos (ver plano no chat da v4.61).

**Já entregue na v4.61.0:** itens raros com durabilidade e conserto, equipe única (bandidos do recrutamento), linhas de produção nas fábricas, boate vendendo itens, notas de qualidade C a SS.

## v1.11.0

- Brecha fechada: itens comprados do Mercador não vão mais para a prateleira das lojas/boate (era comprar a 75% e vender a 140%).
- Um aparelho por vez (multiplayer): ao entrar em outro aparelho, o anterior para de salvar na nuvem e mostra o aviso "Conta aberta em outro aparelho", com o botão "Jogar neste aparelho". Precisa rodar de novo o `supabase/schema.sql` (coluna `gs_saves.sessao`).
- Alerta da Federal acima de 80%: +5% de chance de prisão nos roubos solo e em equipe (aviso na aba Roubos).
- Missões diárias (aba Missões → DIÁRIAS): 3 tarefas por dia, cada uma dá XP e um item; completando as 3, bônus com o dobro de XP e um item nota A.
- Histórico de ações no Perfil: as últimas 20 (roubos, equipe, emboscadas, capo, extorsões, lavagens, missões), com ganho ou perda.
- Ranking semanal de emboscadas: pontos = poder dos alvos de IA vencidos. Na segunda o top 3 ganha título por uma semana (🥇 Terror das Ruas, 🥈 Caçador de Gangsters, 🥉 Tocaieiro), dinheiro sujo (R$ 50 mil / 25 mil / 10 mil) e XP.

## v1.10.0

- Fábricas: nível, linhas de produção e regras foram para o botão "?" ao lado do título.
- Emboscada (alvos de IA): poder dos alvos em dobro (dinheiro igual); cada ataque custa de 40 a 60 de vida conforme a força do alvo; os alvos trocam toda segunda-feira, com nomes novos (nenhum nome ou apelido da semana anterior se repete), e cada um pode ser emboscado uma vez por semana.

## v1.9.3

- Correção: dava para comprar um item do Mercador e revender para ele quase pelo dobro. Agora ele não recompra o que vendeu para você (o botão Vender fica bloqueado nessas unidades). Itens das suas fábricas, do Porto e das emboscadas continuam sendo comprados normalmente.

## v1.9.2

- Lavanderia: a ilustração saiu do fundo e virou faixa 3:1 no topo, com o texto e os botões embaixo.
- Banco e Boate do Hub ganharam ilustração do interior no topo, no mesmo formato 3:1.

## v1.9.1

- Escola e Academia: a imagem do topo virou uma faixa 3:1, recortada pelo centro.

## v1.9.0

- Tela de carregamento dura 2 segundos.
- Extorsões: chance de flagrante na coleta caiu para no máximo 10% (menos com resistência e itens); dominar sobe o alerta da Federal em 10% e cada coleta em 5%.
- Perfil: barra de XP acima da vida, com o progresso até o próximo nível.

## v1.8.0

- Regeneração mais rápida: energia +1/min, vida +1 a cada 2 min, vício −1 a cada 4 min, alerta da Federal −1% a cada 3 min, lealdade dos bandidos −1 a cada 4h. Na quinta (Regeneração 2x) tudo isso vale na metade do tempo.
- Roubos chamam a atenção da Federal: solo a partir do Golpe do falso PIX (+1%) até +10% no mais pesado; em equipe de +10% na primeira missão até +25% na última. A chance de sucesso não mudou. O valor aparece no cartão de cada roubo (🚨).

## v1.7.0

- Extorsões: a explicação (poder, acúmulo de 12h, chance de flagrante) foi para o botão "?" ao lado do título.
- Roubos solo: "Roubar carteira de pedestre" gasta ⚡2 (antes 4); "Furtar celular no metrô" virou 👜 "Furtar bolsa no metrô" e gasta ⚡4 (antes 5).
- Lavanderia do Hub: toda a tela fica dentro de uma ilustração do interior da lavanderia, escurecida para o texto ficar legível.

## v1.6.0

- Nova arte do Hub da cidade, com os prédios em novas posições: Banco e Hospital no topo, Bolsa de Valores entre eles, Escola e Academia no meio, Delegacia e Comércio de armas embaixo, Lavanderia e Boate na frente.
- "Mercado Negro" agora se chama Comércio de armas.

## v1.5.0

- Extorsões ganham um mapa ilustrado do bairro: toque no estabelecimento para ver poder, renda e dominar ou coletar. Os seus ficam com contorno verde e moeda quando há dinheiro; os que pedem mais poder mostram cadeado. A lista continua embaixo.
- Novos: Açougue (poder 200, R$ 310/h) e Supermercado (poder 310, R$ 620/h), ambos ⚡25.
- "Cassino clandestino" agora se chama Cassino.

## v1.4.1

- **Topo:** caixas de dinheiro (limpo e sujo) um pouco menores e a coluna de vida/poder maior — "100/100" não corta mais, nem em telas de 360 px.

## v1.4.0

- **Lavanderia no Hub:** o pavilhão de vidro no meio, entre o Hospital e o Banco, lava dinheiro sujo **na hora**, sem precisar de prédio — a saída para quem está começando. Fica com 40% de taxa, tem limite por dia (R$ 5.000 no nível 1, +R$ 2.500 por nível) e sobe o alerta da Federal o dobro das fachadas (+1% a cada R$ 2.500). A batida fiscal vale aqui também.

## v1.3.1

- **Lavagem 5x mais rápida:** Boate R$ 10.000/h × nível, Hotel R$ 15.000/h × nível e lojas R$ 5.000/h × nível (as taxas continuam 15%, 10% e 20%).

## v1.3.0

- **Dinheiro sujo e lavagem:** roubos, extorsões, emboscadas, capo, PvP e vendas ao Mercador pagam em dinheiro **sujo** (🩸). Ele paga Mercado Negro, Mercador, fiança, agiota, bandidos e a boate do Hub (sai primeiro). Banco, Bolsa, prédios, escola, academia, hospital e advogado só aceitam dinheiro **limpo** (💵).
- **Fachadas:** Boate, Hotel e lojas (valores atuais na v1.3.1) lavam o dinheiro sujo aos poucos; o limpo cai sozinho no saldo. Em dia de Festa na Cidade a boate lava o dobro.
- **Alerta da Polícia Federal (0–100%):** sobe ao lavar (+1% a cada R$ 5.000; dobro na sexta) e cai 2%/h. Acima de 60%, batida fiscal (perde 20–40% do sujo e da fila, fachada lacrada por 2h); acima de 90%, pode dar prisão.
- **Contador:** nova classe de bandido no Ponto de Recrutamento (reduz taxa e alerta; pode ser preso numa batida). **Advogado** na Delegacia (R$ 20.000 por 7 dias: −30% de alerta e fiança pela metade). Novo item raro **Livro-caixa duplo** (−30% de alerta).
- **PvP:** o dinheiro sujo é levado primeiro (20%); sem sujo, 12% do limpo. O atacante recebe tudo como sujo. (Rode de novo o `supabase/schema.sql` para criar a coluna `dinheiro_sujo`.)
- **Missões:** novo capítulo "Lavanderia" e conquistas "Contador de ouro" e "Ficha limpa".
- **Topo em duas linhas:** 💵 limpo, ⚡ energia, ❤️ vida, ⭐ respeito / 🩸 sujo, 🚨 alerta, 💪 poder total, 🌀 vício. Cada caixa abre um pop-up explicando para que serve.
- **Internação:** além da taxa e do respeito, tira 2% de força, resistência, carisma e intelecto (arredondado para cima).
- **Slot Especial:** borda tracejada amarela quando vazio; com item, a cor da raridade domina o slot.

## v1.2.0

- **Multiplayer:** login com Google ou e-mail e senha, save na nuvem (joga no celular e no computador com a mesma conta).
- **Ranking misto:** jogadores reais entram no mesmo ranking das 20 gangues de IA (com a etiqueta 👤 JOGADOR) e contam para o top 3 da temporada.
- **PvP em tempo real:** na Emboscada, a seção "Jogadores reais" permite atacar outros jogadores (nível 7+, custa ⚡15, o mesmo alvo a cada 6h). O resultado é sorteado no servidor uma única vez; quem ataca vê o resultado e quem foi atacado recebe um aviso na hora, com o mesmo resultado. Vencendo, leva 12% do dinheiro em mãos do outro (máx. R$ 100.000); quem perde dinheiro fica 1h protegido.
- **Prestígio removido.**
- **Inventário:** a explicação foi para o botão "?" ao lado do título; vazio mostra só "Inventário vazio".
- **Noite mais clara** nos mapas.

## v1.1.0

- **Tela de carregamento:** a capa do jogo com uma frase de crime aleatória e uma barra de carregamento enquanto o jogo abre.
- **Botão "Instalar app"** na tela inicial: no Android instala direto; no iPhone mostra o passo a passo do Safari. Some quando o jogo já está instalado.
- **Temporada mensal:** no dia 1 de cada mês o império volta do zero (dinheiro, prédios, bandidos, itens, nível, história). Quem terminar o mês no top 3 do ranking de gangues ganha um título permanente (👑 Rei do Crime, 🥈 Barão do Crime, 🥉 Capo do Crime) e um troféu na nova Sala de troféus do Perfil. Ficam para sempre: nome, gangue e troféus. As gangues rivais agora crescem a partir do dia 1 de cada mês. O ranking mostra quantos dias faltam para a temporada acabar e o melhor título aparece no topo, ao lado do nome da gangue.
- **Dia e noite nos mapas:** Minha Cidade, Hub e Porto mudam de cor conforme a hora real — amanhecer (5h–6h30), dia, entardecer (17h–18h45) e noite. É só uma camada de cor por cima da arte; nada no mapa muda de lugar.

## v1.0.0

- Gangstar separado do FutOnze: projeto, domínio, ícone, manifesto e service worker próprios. Abre direto na tela do jogo.

## Histórico (quando era um modo do FutOnze)

### v4.64.0

- **25 níveis:** o personagem agora vai até o nível 25 (XP total do nível n = 60 × (n−1)^2,05: nível 5 pede 1.050, nível 10 pede 5.400, nível 25 pede 40.500). Saves antigos sobem para o nível que o XP já paga.
- **Novas liberações por nível:**
  - 1: roubos de iniciante (carteira, celular, conveniência), Raciocínio lógico e Treino funcional, candidatos até nível 1
  - 5: bilhete premiado, falso PIX, posto de gasolina; equipe: Caminhão de Cigarros; candidatos até nível 2; **Extorsões**
  - 7: farmácia, moto, carro; equipe: Desmanche; **Porto, Mercador e Emboscada**
  - 9: caixa eletrônico, eletrônicos; equipe: Rede de Joalherias e Cofre do Hotel Royal; Noções de direito e Musculação; candidatos até nível 3
  - 10: joalheria, sequestro relâmpago; equipe: Sequestro de Empresário
  - 13: casa de câmbio, banco local; equipe: Cofre do Cassino; candidatos até nível 4; história "Chegue ao nível 13"
  - 15: carro-forte, mansão; equipe: Data Center; Hacking e MMA
  - 18: galeria de arte, carga; equipe: Museu Nacional; candidatos até nível 5
  - 20: trem de carga, iate; equipe: Reserva de Ouro e Carregamento de Ouro
  - 22: cofre do cassino, Banco Central; **Bolsa de Valores**; história "Chegue ao nível 22"
  - 23: leilão de joias, Reserva Federal; equipe: Terminal do Aeroporto e Casa da Moeda
- **Telas bloqueadas por nível:** Extorsões (nível 5), Porto, Mercador e Emboscada (nível 7). No Porto e no Mercador, a cada 2 níveis entram produtos melhores, e as encomendas pagam +4% por nível acima do 7.
- **Pop-up de nível:** ao subir de nível aparece o novo nível e a lista do que foi liberado.
- **Academia 2x / Escola 2x:** nos dias do evento o treino dá o dobro de XP **e** o dobro de força / intelecto.
- **Rodapé:** o botão Roubos subiu e o nome "Roubos" ficou alinhado com Cidade, Hub, Gangue e Missões.

### v4.63.1

- **Nova arte da Minha Cidade:** ilustrações próprias (Royal Tower, Grand Palace, coreto de vidro, Apothecary, Liquor Emporium, The Armory, Logística, Criativa Hub, Elite Club e Corporate), na versão abandonada e na construída. Os prédios ficam nas mesmas posições e as áreas de toque não mudaram — é só estética.

### v4.63.0

- **Bolsa de Valores no Hub:** o prédio de vidro da esquina (4º a partir do canto inferior esquerdo) virou a Bolsa. São 20 empresas fictícias com cotação que muda a cada 2 minutos (a mesma para todos os jogadores). A lista mostra o nome à esquerda e o preço com a variação da última hora à direita; ao tocar, abre o gráfico das últimas 2 horas e as caixas de comprar e vender (vazia = tudo: compra o máximo com o dinheiro em mãos ou vende todas). Corretagem de 0,5%. Libera no nível 10. As ações contam no patrimônio e zeram no prestígio.
- **Refresh mantém a tela:** atualizar a página dentro do Gangstar volta para a mesma aba e o mesmo prédio do Hub (antes voltava para a tela inicial do FutOnze).
- **Porto:** caixas dos pedidos mais transparentes.
- **Notas de qualidade discretas:** a nota (C, B, A, S, SS) agora é um quadradinho ao lado do nome do item.
- **Correções e balanceamento:**
  - Juros do banco arredondavam para zero com o jogo aberto (atualização a cada 10 s): agora a fração é guardada.
  - A lealdade dos bandidos não caía com o jogo aberto: agora cai 1 ponto a cada 3 h corretamente.
  - Vendas das lojas perdiam a sobra de tempo entre clientes: corrigido.
  - Banco rendia 0,4% por hora (~10% ao dia, dinheiro infinito): agora 0,1% por hora (~2,4% ao dia).

### v4.62.1

- **Regeneração:** vida agora sobe 1 ponto a cada 3 minutos (antes 5) e o vício cai 1 ponto a cada 10 minutos (antes 2 horas). Energia segue em 1 a cada 2 minutos; a quinta (Regeneração 2x) continua dobrando tudo.
- **Correção:** energia, vida e vício só se recuperavam ao abrir o jogo, e a sobra de tempo de cada cálculo se perdia. Agora recuperam com o jogo aberto (a cada 10 segundos) e a sobra fica guardada.
- **Roubos de iniciante:** os 3 primeiros roubos solo (carteira, celular e loja de conveniência) gastam metade da energia (4, 5 e 6) e não tiram vida.

### v4.62.0

- **Bandidos que evoluem:** cada roubo em equipe dá XP aos bandidos que foram. Ao subir de nível (até o 10) eles ganham de +5 a +7 de poder. A barra de XP aparece no Ponto de Recrutamento e o resultado do roubo avisa quem subiu.
- **Eventos da semana:** sexta virou **Operação policial** (chance de prisão em dobro) e sábado virou **Noite da boate** (sua boate recebe o dobro de clientes). O quadro do evento no canto superior direito agora abre um pop-up com os 7 dias e seus eventos.
- **Boate por seções (Hub e a sua boate):** três botões — **Bebidas** (consumir), **Drogas** (drogas e remédios, usar) e **Garotas** (contratar: Boneca inflável, Garota barata, Acompanhante, Dançarina exótica, Garota de luxo e Modelo internacional). No Hub tudo custa 2,5x o valor normal; na sua boate você consome o que está na prateleira e as garotas saem 30% mais baratas.

### v4.61.0

- **Itens raros com durabilidade:** cada ação com o item equipado gasta 1 uso (comum 25, raro 35, épico 50, lendário 70). Quebrado, ele para de dar bônus — conserte na nova Oficina do Mercado Negro.
- **Equipe única:** a antiga crew da aba Gangue acabou. A equipe dos roubos em equipe são os bandidos do Ponto de Recrutamento (assaltante = atirador, piloto = motorista, contrabandista = hacker e negociador). Quem já tinha crew ganhou os mesmos membros como bandidos.
- **Níveis mais lentos:** o XP para subir de nível ficou de 2 a 4 vezes maior (nível 11 agora pede 17.000 de XP). Ninguém perde o nível que já tem.
- **Fábricas com linhas de produção:** uma linha a cada 2 níveis, até 5 no nível 9–10. Cada linha produz um item diferente; o Coletar recolhe todas.
- **Lojas:** as informações de "Vendas para a população" foram para um botão "?" ao lado do título.
- **Boate vende itens:** a boate virou loja (bebidas, drogas e remédios), vende para a população e não rende mais por hora. É nela que você consome os itens: bebidas e drogas dão energia, remédios dão vida (com risco de overdose no vício alto).
- **Inventário só para consulta:** sem botões de usar/equipar (equipe pelo Perfil).
- **Vida gasta por ação:** roubo solo −2, roubo em equipe −5, extorsão −1 (coletar ou conquistar), emboscada −10. Muito ferido, você não consegue agir.
- **Missões pagam bem menos:** recompensas de capítulos e conquistas caíram para 20% do valor anterior.
- **Evoluir prédios 3x mais caro.**
- **Qualidade em notas:** C (bronze), B (prata), A (verde), S (amarelo) e SS (turquesa → rosa neon), em vez de estrelas.
- **Painel de Gestão** abaixo do mapa da Minha Cidade.
- **Respeito:** ser preso tira 100 de respeito; ser internado tira 20.
- **Prestígio** saiu da aba Gangue e foi para o fim do Perfil, antes do "Sair do Gangstar".

### v4.60.0

- **Porto:** cada caixinha do mapa mostra o nome da encomenda (destino), além da bandeira e do valor.
- **Lojas sem coleta:** Loja de Bebidas, Drogaria e Loja de Armas não rendem mais por hora — o dinheiro vem só das vendas das mercadorias. Evoluir a loja traz mais clientes.
- **Overdose:** com o vício entre 85 e 100, cada consumo (inventário ou boate) pode te mandar para o hospital: 20% de chance no 85, subindo até 100% no 100. Você fica 10 minutos internado sem poder jogar (como na prisão), paga R$ 1.000 de taxa dos cuidados — o saldo pode ficar negativo, em vermelho — e o vício cai para 70.
- **Gangues rivais mais respeitadas:** a última começa com 5.000 de respeito e a primeira tem cerca de 30.000.
- **Capo em 3 rodadas:** escolha um golpe por rodada (Rajada, Golpe tático, Granada e Fintar), enquanto o capo responde com Tiro certeiro, Chama reforços e Fúria do capo. O capo tem uma barra de vida, o dano acumula durante a semana e há um ranking semanal de dano — quem lidera ao derrubá-lo ganha +50% do dinheiro.
- **História com escolhas:** capítulo 9 "O recado dos Corvos" pede uma decisão: **Aliança** ou **Guerra**. Cada caminho tem 3 capítulos próprios e um final diferente (O Padrinho ou O Rei Sangrento). Agora são 12 capítulos.
- **Itens raros no slot Especial do Perfil:** 8 itens (comum, raro, épico e lendário, com a cor da raridade na borda), com bônus únicos: poder, respeito, menos prisão, extorsão e emboscada. Só caem nos roubos em equipe (15% a cada sucesso).
- **Rodapé:** Perfil e Missões trocaram de lugar.
- **Mais difícil:** roubos solo 45% acima da dificuldade base (antes 30%); extorsões pedem 20% mais poder, custam 25 de energia e o flagrante subiu para 20%.

### v4.59.0

- **Lojas vendendo por IA:** cada loja (bebidas, drogaria, armas) tem uma prateleira. Você abastece com itens das fábricas e clientes de IA compram ao longo do dia (8 a 16 por hora, conforme o nível). A demanda muda com o dia da semana e com eventos: festa na cidade (bebidas e drogas em alta), batida policial (drogas e armas em baixa). O dinheiro vai para o caixa da loja, que você recolhe.
- **Qualidade dos produtos (1 a 5 estrelas):** sobe a cada 3 níveis da fábrica e com contrabandistas na gangue. Item melhor vale mais no Porto, nas lojas e no Mercador (+15% por estrela). Inventário separado por qualidade.
- **Porto com navios:** o mapa do porto agora é uma ilustração, com os contratos posicionados dentro dele. Cada entrega embarca num navio que leva de 1 a 4 horas e pode ser apreendido pela Polícia Federal (pilotos de fuga na gangue reduzem o risco).
- **Capo da semana:** um chefe de IA na Emboscada, com saque garantido (arma ou colete de alta qualidade) e muito dinheiro. Um por semana.
- **Emboscada em grupo:** leve seus bandidos para somar poder; a gangue fica com 20% do dinheiro e cada bandido corre risco se der errado.
- **Cassino:** torneio diário de poker (inscrição, 10 mãos, placar com 7 rivais e prêmios para o top 3), jackpot acumulado no caça-níquel (7️⃣7️⃣7️⃣ leva tudo) e agiota para quem quebrar a banca (juros de 30% em 24h; quem não paga apanha).
- **Missões:** nova aba com 8 capítulos de história (objetivos e recompensas) e 17 conquistas. A aba Missões substitui o Cassino no rodapé (o cassino continua nas boates) e mostra um aviso quando há recompensa para resgatar.
- **Topo:** o botão de voltar virou um quadrado com o seu nível (toque para abrir o Perfil). "Sair do Gangstar" fica no fim do Perfil.
- **Ajuda "?":** as explicações de Minha Cidade, Hub e Porto foram para um botão "?" ao lado do título.
- Removida a linha divisória entre as duas fileiras de botões do rodapé.
- Save v10 (saves antigos migram sozinhos).

### v4.58.0
- Gangstar — mapas: etiquetas com o nome de cada prédio na Minha Cidade e no Hub, escondidas por padrão; o botão de olho no canto superior direito mostra/esconde. Seus prédios aparecem com etiqueta verde.
- **Fábricas produzem itens** (não rendem mais dinheiro) e evoluem até o nível 10, cada nível liberando um produto: Destilaria (da pinga barata ao champanhe de luxo), Fábrica de Medicamentos (do analgésico ao soro regenerador), Fábrica de Drogas (do haxixe ao pó dourado) e Fábrica de Armas (da faca tática ao lança-granadas, com coletes do básico ao militar). Escolha o produto no popup da fábrica; a produção acumula até 12h.
- **Itens:** bebidas e drogas recuperam energia (drogas com mais vício), medicamentos recuperam vida; armas e coletes somam poder. Tudo fica na nova aba **Inventário**.
- **Perfil com 3 slots:** arma (do Mercado Negro ou da fábrica), colete e Especial (em breve).
- **Cassino** (na Boate do Hub, na sua boate da Minha Cidade e no rodapé): Roleta, Blackjack, Caça-níquel e Poker Texas Hold'em contra 2 jogadores de IA.
- **Mercador:** aparece 3 vezes por dia em horários aleatórios (45 min cada) no canto do mapa do Hub, com botão neon; vende itens 25% mais baratos e compra os seus 30% acima do valor.
- **Rodapé em duas linhas:** Porto, Emboscada, Extorsões, Inventário e Cassino; o botão Roubos ganhou destaque num círculo.
- **Porto:** contratos de envio de 3 itens para compradores estrangeiros (pagam bem acima do valor), renovados a cada 6h.
- **Emboscada:** ataque gangsters de IA (5 alvos por hora) para roubar dinheiro e itens; falhar custa vida (o colete protege) e pode dar prisão.
- **Extorsões** saíram do Hub para a própria aba e exigem bem mais poder (de 35 a 290).
- Escola e Academia rebalanceadas: os cursos mais avançados agora rendem mais por energia e por real (+3, +8 e +16).
- Roubos solo 30% mais difíceis e pagando 15% menos dinheiro e respeito; 5 roubos solo novos e 3 missões em equipe novas.
- Saves antigos são atualizados automaticamente (versão 9 do save).

### v4.57.0
- Gangstar — o coreto da "Minha Cidade" virou um prédio comprável: o Ponto de Recrutamento (vira um coreto de vidro reformado). Só dá pra comprar depois de criar uma gangue.
- Recrutamento com 3 abas — Assaltante, Piloto de fuga e Contrabandista — com candidatos que mudam a cada 4 horas (melhores conforme o seu nível) e até 5 bandidos por classe. Cada bandido tem nível, poder e lealdade, e todos somam poder na guerra de gangues.
- Assaltante: mais poder nos roubos e guerras, mas leva comissão de cada roubo solo e pode morrer nas guerras. Piloto de fuga: menos chance de prisão, mas pode morrer ou ser preso na fuga quando o roubo dá errado. Contrabandista: coletas maiores dos prédios e extorsões, mas pode trair a gangue e sumir com parte do seu dinheiro.
- A lealdade cai com o tempo; pagar um bônus aumenta. Abaixo de 50% de lealdade o bandido pode trair. As mortes, prisões e traições ficam registradas em "Ocorrências" e aparecem nos resultados dos roubos e ataques.
- Saves antigos são atualizados automaticamente (versão 8 do save).

### v4.56.1
- Gangstar — "Minha Cidade": nova versão da arte da cidade abandonada, com ruas e calçadas mais limpas e postes de luz. Prédios, posições e funções continuam os mesmos.

### v4.56.0
- Gangstar — nova arte da "Minha Cidade": os 11 prédios agora aparecem como prédios abandonados de verdade (hotel em ruínas, igreja gótica, fábricas velhas, boate fechada, todos com placas de "vende-se"), no lugar das casinhas iguais. As funções, posições e botões de cada prédio continuam os mesmos; ao comprar, ele vira a versão construída como antes.

### v4.55.0
- Gangstar — cabeçalho: contagem regressiva da prisão (some sozinha quando a pena acaba), nome e gangue com fontes "de crime" (Pirata One e Special Elite) e o evento do dia alinhado à direita.
- Eventos diários pelo dia real da semana: segunda XP da academia em dobro, terça XP da escola em dobro, quarta coletas +20%, quinta regeneração em dobro (energia, vida e vício), sexta chance de prisão +50%, sábado dia livre e domingo chance de prisão pela metade.
- Delegacia: botão de Motim com 12% de chance de fugir; se falhar, +5 minutos de pena e nada de novo motim nessa prisão.
- Hospital: tratamento de desintoxicação pago (−20 de vício ou completo).
- Escola e Academia: 3 níveis de curso/treino cada (ganho de +5, +10 e +18 no atributo, gastando energia e dando XP), os avançados liberados pelo nível do personagem.
- Extorsões (prédio da torre de vidro no Hub): domine estabelecimentos com o seu poder e eles pagam proteção por hora; cada coleta tem risco de flagrante (perde o valor e vai preso).
- Saves antigos são atualizados automaticamente (versão 7 do save).

### v4.54.0
- Gangstar — Escola e Academia ganharam novas ilustrações pixel art no topo da tela (o interior da escola e da academia), no lugar dos desenhos simples anteriores.

### v4.53.0
- Gangstar — o Hub ganhou um mapa ilustrado do centro da cidade com os prédios clicáveis: hospital, banco, academia, escola, delegacia/penitenciária, mercado negro e boate. Tocar num prédio abre o serviço; a lista de serviços continua logo abaixo do mapa.
- Nova tela da Delegacia: mostra se você está preso (com o botão de fiança) ou livre, e quantas vezes já foi preso.

### v4.52.0
- Gangstar — cabeçalho: o valor em dinheiro agora é o seu saldo em mãos (antes mostrava o patrimônio, por isso não mudava ao comprar). As caixas ficam abaixo do seu nome e ganharam Vida e Vício.
- Minha Cidade: abaixo do mapa aparece quanto a sua cidade arrecada por hora.
- Popups do jogo agora abrem no centro da tela.
- Roubos: 8 roubos solo novos (celular no metrô, bilhete premiado, farmácia, loja de eletrônicos, sequestro relâmpago, mansão, galeria de arte e cofre do cassino) e 6 missões em equipe novas (caminhão de cigarros, desmanche, sequestro de empresário, data center, museu e terminal de cargas do aeroporto).
- Boate: três jeitos de recuperar energia — Bebidas, Drogas e Garotas — cada um com preço, ganho de energia e nível de intoxicação (vício); com vício no máximo não dá pra consumir mais.
- Gangues rivais: agora são 20, bem mais fortes.
- Prestígio passa a exigir R$ 100.000 de patrimônio.

### v4.51.0
- Gangstar — "Minha Cidade" agora é uma ilustração da cidade com 11 prédios abandonados à venda. Cada um tem uma função fixa: 2 hotéis (cantos de cima), loja de bebidas, drogaria e loja de armas, destilaria (fábrica de bebidas), fábrica de drogas, fábrica de medicamentos, prédio de gestão, boate e fábrica de armas.
- Não existe mais lote vazio nem expansão de quarteirões: ao comprar, o prédio já vem reformado e funcionando (nível 1), e o desenho dele muda no mapa para a versão construída. Prédios com dinheiro para coletar mostram uma moedinha pulsando.
- Saves antigos são migrados automaticamente: cada prédio antigo vai para o prédio do mesmo tipo no mapa novo (lojas antigas viram as lojas novas), e os lotes comprados (e o que não couber) são reembolsados em dinheiro.

### v4.50.0
- Gangstar — "Minha Cidade" ganhou um mapa novo, desenhado do zero em SVG (estética pixelada/rua noturna): fundo com prédios abandonados só de cenário (futuramente vão virar praças, casas modernas, etc.) e, na frente, a rua de verdade com calçada, pistas com carros passando e postes — seus lotes aparecem nela em 3 estados (lote à venda com placa de preço, lote limpo esperando construção, ou prédio construído com as cores do tipo). Nenhum prédio tem nome escrito: um clique abre o popup de sempre pra comprar, construir ou gerenciar.
- Cabeçalho do Gangstar: energia, respeito e patrimônio agora ficam alinhados na mesma linha do seu nome/gangue (antes ficavam embaixo, numa faixa separada).
- Roubos solo: 3 golpes novos no topo da escala (carro-forte, trem de carga e Reserva Federal) e todos os roubos ficaram mais difíceis — menos dinheiro, menor chance de sucesso.
- Roubos (solo e em equipe): o resultado de cada tentativa agora aparece num popup central (sucesso, fuga ou prisão), em vez de um aviso no topo da página.
- Escola e Academia: limite de 5 treinos por dia em cada uma, com um aviso de quantas vezes ainda restam hoje e botão desabilitado ao bater o limite; as duas telas ganharam uma ilustração pixelada (escola e academia).
- Criar uma gangue agora custa R$ 10.000.

### v4.49.0
- Gangstar — Fase 3 (Gangues e complexidade): crew de NPCs contratados (atirador, motorista, hacker, negociador) na aba Gangue, com nível e lealdade que sobem fazendo missões; roubos em equipe (aba Roubos) que exigem montar uma equipe com as especialidades certas; guerra de território contra as 7 gangues rivais de IA (cada uma com estilo agressivo, econômico ou discreto) — ataque zonas da Cidade para ganhar desconto no mercado negro ou produção extra, mas as gangues podem tentar retomar; ranking de respeito agora mostra as gangues rivais evoluindo com o tempo; mercado negro com preços oscilando e eventos aleatórios da cidade (polícia em greve, batida nas boates, escassez de drogas, promoção do banco); Prestígio opcional (reinicia o progresso por um bônus permanente de dinheiro). O mapa isométrico de "Minha Cidade" não foi mexido nesta atualização.

### v4.48.1
- Gangstar — "Minha Cidade" virou um mapa isométrico de verdade (pixel art), igual pedido: lotes vazios com placa "À VENDA", e ao construir aparece o prédio em 3D isométrico (cor e altura diferentes por tipo: fábricas, loja, boate, hotel, prédio de gestão). Agora são 6 lotes por quarteirão (antes eram 4). Clicar num lote abre um popup: comprar o lote, escolher o que construir, ou ver o prédio (coletar renda / evoluir).

### v4.48.0
- Gangstar — ajustes na Fase 1 + Fase 2 (construção e serviços da cidade):
  - Corrigido o rodapé das abas: agora fica sempre fixo na parte de baixo da tela (antes, em telas com mais conteúdo, ele ficava lá embaixo, exigindo rolar a página pra ver).
  - Cabeçalho ganhou uma faixa com Energia, Respeito e Patrimônio sempre visíveis.
  - "Minha Cidade" e a "Cidade" (hub) ganharam uma faixa decorativa com o horizonte da cidade em pixel art (prédios, carro, policial e pedestres).
  - Fase 2: agora dá pra construir prédios nos lotes comprados (Fábrica de Armas, Fábrica de Bebidas, Fábrica de Drogas, Loja, Boate, Hotel e o único Prédio de Gestão), cada um rendendo dinheiro com o tempo (até um teto) pra você coletar; prédios também podem ser evoluídos até o nível 3. O lote começa com a estética clássica de "lote à venda" e evolui visualmente para o prédio construído.
  - Fase 2: Hospital (cura a vida pagando), Banco (deposita/saca e rende CDI sozinho com o tempo), Escola (treina intelecto) e Academia (treina força) ficaram funcionais na aba Cidade; Boates agora recuperam energia (com um pequeno aumento no vício).

### v4.47.7
- Gangstar Fase 1 (MVP): primeira versão jogável do modo "construção de império do crime". Criação de personagem (nome + 4 classes com bônus próprios), tela "Minha Cidade" com mapa de lotes vazios para comprar e expandir, aba "Cidade" com Mercado Negro (compra e equipa armas) e Prisão (prende ao falhar um roubo, paga fiança ou aguarda), aba "Roubos" com 9 golpes progressivos que desbloqueiam por nível, aba "Gangue" com nome da sua gangue e ranking de respeito contra 7 gangues de IA, e aba "Perfil" com vida/energia/vício, atributos (sobem ao subir de nível) e dinheiro/respeito. Vida e energia regeneram sozinhas com o tempo real. Hospital, boates, banco, escola, academia e construção de prédios ficam para a próxima fase.

### v4.47.6
- Adicionado o rótulo "Jogue também" acima do botão do Gangstar, na tela inicial.

### v4.47.5
- Ajuste no botão do Gangstar no rodapé da tela inicial: agora ele tem exatamente a proporção da imagem (sem cortar nada), em vez de uma faixa fixa que recortava parte da arte.

### v4.47.4
- Primeiro passo do novo modo "Gangstar" (construção de império do crime, estética pixel/retrô/arcade, totalmente separado do FutOnze): na tela inicial, o botão "Modo Multiplayer" foi ocultado, "Modo Carreira" e "Modo Agente" ficaram mais centralizados, e foi adicionado um botão no rodapé (preenchido pela arte do Gangstar) que abre a tela de boas-vindas do novo modo, com título, subtítulo "Construa seu império" e opção de novo jogo/continuar. O mapa da cidade e os prédios (fábricas, boates, hotéis etc.) entram em uma próxima atualização.

