#!/usr/bin/env python3
"""
Gera a dublagem do DEVO (DIRECAO-2 §5) a partir de scripts/voz/exportar.ts.

  python scripts/voz/gerar.py linhas.json public/audio/voz

Motor: Kokoro-82M (Apache-2.0), português do Brasil (lang_code='p'), vozes pf_dora / pm_alex / pm_santa.
Reserva: Piper (pt_BR-faber-medium) se o Kokoro não carregar.
Cada fala vira um WAV cru → ffmpeg com o tratamento do personagem → .ogg (Opus) e .m4a (AAC, Safari).
Manifesto: manifest.json com arquivo, duração e hash (falas que não mudaram não são regeradas).
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile

SR = 24000

# Elenco: voz base do TTS + velocidade + cadeia de filtros ffmpeg (aplicada ao WAV de 24 kHz).
LOUD = "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-17:TP=-1.5:LRA=9"
CAST = {
    # Narrador: neutro, próximo, sem efeito.
    "narrator": {"voice": "pm_alex", "speed": 0.96, "fx": f"highpass=f=70,{LOUD}"},
    # Melissa: natural, um pouco mais presente.
    "melissa": {"voice": "pf_dora", "speed": 1.0, "fx": f"highpass=f=90,equalizer=f=3200:t=q:w=1:g=2,{LOUD}"},
    # "???" (a Antiga Voz): grave, lenta, com eco de catedral.
    "voice": {
        "voice": "pm_santa",
        "speed": 0.9,
        "fx": f"asetrate={SR}*0.84,aresample={SR},atempo=1.19,lowpass=f=3600,aecho=0.8:0.75:160|310:0.35|0.22,{LOUD}",
    },
    # Sistema DEVO: voz de rádio/terminal (banda estreita + grão digital).
    "system": {
        "voice": "pf_dora",
        "speed": 0.97,
        "fx": f"highpass=f=320,lowpass=f=3400,asoftclip=type=tanh:threshold=0.5,aecho=0.6:0.35:14:0.3,{LOUD}",
    },
    # Herdeiro: mais grave e seco, sala pequena.
    "herdeiro": {
        "voice": "pm_alex",
        "speed": 0.94,
        "fx": f"asetrate={SR}*0.92,aresample={SR},atempo=1.087,equalizer=f=180:t=q:w=1:g=3,aecho=0.7:0.4:28:0.12,{LOUD}",
    },
    # Rato: mais agudo e sinistro, com leve distorção e tremor (tremolo; o vibrato do ffmpeg gera NaN no início).
    "rato": {
        "voice": "pm_santa",
        "speed": 1.06,
        "fx": f"asetrate={SR}*1.2,aresample={SR},atempo=0.8333,tremolo=f=6:d=0.18,asoftclip=type=atan:threshold=0.6,highpass=f=140,{LOUD}",
    },
}


def text_hash(cast, tts):
    cfg = CAST[cast]
    key = f"{cast}|{cfg['voice']}|{cfg['speed']}|{cfg['fx']}|{tts}"
    return hashlib.sha1(key.encode()).hexdigest()[:16]


class Kokoro:
    name = "kokoro"

    def __init__(self):
        from kokoro import KPipeline

        self.pipe = KPipeline(lang_code="p")

    def synth(self, text, voice, speed, out_wav):
        import numpy as np
        import soundfile as sf

        chunks = []
        for _, _, audio in self.pipe(text, voice=voice, speed=speed, split_pattern=r"\n+"):
            chunks.append(audio.numpy() if hasattr(audio, "numpy") else audio)
        sf.write(out_wav, np.concatenate(chunks), SR)


class Piper:
    name = "piper"

    def __init__(self):
        self.model = os.environ.get("PIPER_MODEL", "pt_BR-faber-medium.onnx")
        if not os.path.exists(self.model):
            raise RuntimeError(f"modelo Piper ausente: {self.model}")

    def synth(self, text, voice, speed, out_wav):
        raw = out_wav + ".raw.wav"
        subprocess.run(
            ["piper", "--model", self.model, "--output_file", raw, "--length_scale", f"{1 / speed:.3f}"],
            input=text.encode(),
            check=True,
            capture_output=True,
        )
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-ar", str(SR), "-ac", "1", out_wav], check=True)
        os.remove(raw)


def engine():
    try:
        return Kokoro()
    except Exception as err:  # noqa: BLE001
        print(f"[dublagem] Kokoro indisponível ({err}); tentando Piper", file=sys.stderr)
        return Piper()


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
        capture_output=True,
        text=True,
        check=True,
    )
    return round(float(out.stdout.strip()), 3)


def main():
    lines_path, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    with open(lines_path, encoding="utf-8") as fh:
        lines = json.load(fh)
    manifest_path = os.path.join(out_dir, "manifest.json")
    old = {}
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as fh:
            old = json.load(fh).get("lines", {})

    eng = None
    result = {}
    made = kept = 0
    with tempfile.TemporaryDirectory() as tmp:
        for line in lines:
            lid, cast, tts = line["id"], line["cast"], line["tts"]
            cfg = CAST[cast]
            h = text_hash(cast, tts)
            ogg = os.path.join(out_dir, f"{lid}.ogg")
            m4a = os.path.join(out_dir, f"{lid}.m4a")
            prev = old.get(lid)
            if prev and prev.get("hash") == h and os.path.exists(ogg) and os.path.exists(m4a):
                result[lid] = prev
                kept += 1
                continue
            if eng is None:
                eng = engine()
                print(f"[dublagem] motor: {eng.name}", file=sys.stderr)
            raw = os.path.join(tmp, f"{lid}.wav")
            eng.synth(tts, cfg["voice"], cfg["speed"], raw)
            # Corta o silêncio inicial e deixa uma cauda curta para o eco não ser cortado.
            fx = f"silenceremove=start_periods=1:start_threshold=-50dB,{cfg['fx']},apad=pad_dur=0.25"
            common = ["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", fx, "-ac", "1"]
            subprocess.run([*common, "-ar", "48000", "-c:a", "libopus", "-b:a", "40k", ogg], check=True)
            subprocess.run([*common, "-ar", "44100", "-c:a", "aac", "-b:a", "56k", m4a], check=True)
            result[lid] = {"cast": cast, "voice": cfg["voice"], "hash": h, "duration": duration(ogg), "engine": eng.name}
            made += 1
            print(f"[dublagem] {lid} ({cast}) {result[lid]['duration']}s", file=sys.stderr)

    # Falas que saíram do roteiro: os arquivos também saem.
    valid = set(result)
    for f in os.listdir(out_dir):
        base, ext = os.path.splitext(f)
        if ext in (".ogg", ".m4a") and base not in valid:
            os.remove(os.path.join(out_dir, f))

    manifest = {"version": 1, "formats": ["ogg", "m4a"], "lines": dict(sorted(result.items()))}
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    total = sum(v["duration"] for v in result.values())
    print(f"[dublagem] {made} geradas, {kept} reaproveitadas, {len(result)} no total, {total:.1f}s de voz")


if __name__ == "__main__":
    main()
