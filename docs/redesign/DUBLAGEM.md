# Dublagem da Entrada (prólogo e tutorial)

DIRECAO-2 §5: todas as falas do prólogo e do tutorial têm voz. As vozes são geradas no CI com um TTS neural
livre em pt-BR e versionadas em `public/audio/voz/`.

## Como funciona

| Peça | Arquivo |
|---|---|
| Lista única de falas e ids | `lib/devo/voice-lines.ts` (`pr-012`, `pr-021-1-0`, `tu-07`, `rato-risada`) |
| Exportar falas → JSON | `scripts/voz/exportar.ts` (`npx -y tsx scripts/voz/exportar.ts`) |
| Gerar vozes + tratamento | `scripts/voz/gerar.py` (Kokoro → ffmpeg → `.ogg` Opus 40k + `.m4a` AAC 56k) |
| Workflow | `.github/workflows/dublagem.yml` (manual ou quando os roteiros mudam) |
| Player no jogo | `lib/devo/voice.ts` (arquivo → `speechSynthesis` pt-BR de reserva) |
| Botão | "Dublagem" na barra superior do prólogo/tutorial, ao lado do som (`DubToggle` em `intro/vn.tsx`) |

- O workflow commita os arquivos de volta na branch com `[skip ci]` (não dispara capturas nem a si mesmo).
  O log vai para a branch `dublagem-log/<branch>` (`dublagem.log`, `motor.log`, `manifest.json`, `arquivos.txt`).
- `manifest.json` guarda, por fala: elenco, voz base, hash (texto + voz + tratamento) e duração. Falas que não
  mudaram não são regeradas.
- O nome do personagem (`{nome}`) **não é dublado**: a frase é falada sem o nome ("acordou, {nome}." →
  "acordou."), e o nome aparece na legenda. Na voz de reserva do aparelho, o nome é falado.
- A digitação acompanha a fala: velocidade = duração do áudio × 0,9 ÷ número de letras (14–90 ms por letra).
- O mudo global (`setMuted`) corta a voz na hora; o botão "Dublagem" desliga só as vozes (preferência local).
- Enquanto alguém fala, a trilha do prólogo abaixa (`duckPrologueMusic`).

## Elenco (voz base + tratamento ffmpeg)

| Personagem | Voz Kokoro | Tratamento |
|---|---|---|
| Narrador | `pm_alex` (0,96×) | neutro: passa-alta, compressor, loudnorm −17 LUFS |
| Melissa | `pf_dora` | natural, presença em 3,2 kHz |
| ??? (Antiga Voz) | `pm_santa` (0,9×) | tom −16%, passa-baixa 3,6 kHz, eco de catedral (160/310 ms) |
| DEVO · Sistema | `pf_dora` (0,97×) | rádio/terminal: banda 320–3400 Hz, saturação leve, eco curto |
| Herdeiro | `pm_alex` (0,94×) | tom −8%, grave reforçado, sala pequena |
| Rato | `pm_santa` (1,06×) | tom +20%, tremolo, saturação leve (sinistro); a risadinha usa o mesmo tratamento |

## Licenças

- **Kokoro-82M** (hexgrad): pesos e vozes sob **Apache-2.0** (model card do Hugging Face). Vozes pt-BR:
  `pf_dora`, `pm_alex`, `pm_santa`, `lang_code='p'`; o próprio VOICES.md avisa que o suporte a idiomas
  não ingleses pode ser fraco (fonética via espeak-ng, pouco dado de treino).
- **misaki** (G2P do Kokoro): MIT. **espeak-ng**: GPL-3.0, usado só no CI para gerar a fonética; não é distribuído
  com o jogo.
- **Reserva Piper** (só se o Kokoro falhar): `pt_BR-faber-medium`, dataset do projeto OHF-Voice sob **CC0**.
- O áudio gerado não traz restrição de uso dessas licenças. Nenhuma voz de pessoa real foi clonada.

## Limitações conhecidas

- A prosódia em pt-BR do Kokoro é competente mas não é de ator: entonação às vezes plana, e "…" vira pausa
  curta. Interjeições como "Huuummm" e "Hihihi" saem sintéticas.
- As três vozes base são poucas para o elenco: o tratamento diferencia Narrador/Herdeiro (mesma base) e
  Melissa/Sistema (mesma base).
- Falas com o nome do personagem omitem o nome na voz.
- iPhone/Safari usa `.m4a`; os demais, `.ogg` (Opus).
