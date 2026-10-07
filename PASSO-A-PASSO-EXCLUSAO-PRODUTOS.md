# Como excluir produtos do catálogo a partir das imagens do WhatsApp

Passo a passo para repetir o processo de: receber fotos de produtos a excluir → extrair os nomes por OCR → excluir de `public/products/` apenas o que corresponder (comparando **por nome**, ignorando preço) → manter as fotos na pasta e registrar tudo em manifestos.

## Pré-requisitos

- `tesseract` com o idioma **por (português)** já instalado:

  - Se estiver no linuxbrew (usado nesta máquina):
    - `/home/linuxbrew/.linuxbrew/bin/tesseract`
  - Conferir o idioma:
    ```bash
    tesseract --list-langs | grep por
    ```
  - Se não existir, instalar com o gerenciador de pacotes (ex.: `brew install tesseract-lang` via linuxbrew).
- `python3` (bibliotecas padrão apenas — `subprocess`, `glob`, `re`, `os`; **não** precisa de Pillow/pytesseract, o script chama o `tesseract` via linha de comando e lê a saída TSV).
- O shell precisa ter o `tesseract` no `PATH`. Se necessário:
  ```bash
  export PATH="/home/linuxbrew/.linuxbrew/bin:$PATH"
  ```

## Como funciona (regras aplicadas)

1. **OCR**: cada imagem é processada com `tesseract image stdout -l por --psm 6 tsv`. As palavras de preço (`R$ xx,xx`) delimitam os "cards" (pontos médios entre os preços); as palavras acima dos preços e abaixo da metade da imagem formam o nome de cada produto. Uma imagem pode conter 2+ produtos.
2. **Nome, não preço**: a comparação é feita só pelo nome. O preço do OCR é usado **apenas como desempate** entre variantes de tamanho.
3. **Variantes de tamanho (P/G/M)**: as letras `P`, `G`, `M` são preservadas como tokens, então `Brinco Floema Citrino P` só casa com o arquivo `... P` e **não** com o `... G`. Quando o OCR não traz o tamanho e existem várias variantes de mesmo nome, o preço desempata: `Argola Click Trama @R$79,90` → só o arquivo `Argola Trama Click G R$ 79,90`.
4. **O que é excluído**:
   - tokens exatos igual → exclui;
   - tokens do OCR são subconjunto do arquivo, com candidato único → exclui;
   - candidato único pela menor quantidade de tokens quando há categoria no nome (brinco, colar, anel...) → exclui;
   - empate de variantes resolvido por preço → exclui.
5. **O que NÃO é excluído** (vai para `LISTA-NAO-IDENTIFICADAS-*.txt` para revisão manual):
   - nome genérico/incompleto (ex.: só preço no card);
   - nome ambíguo (2+ candidatos sem desempate).

## Passo a passo

1. **Mova/cole as imagens** em uma nova pasta dentro de `public/`, ex.:
   ```bash
   mkdir "public/WhatsApp Catalogo Excluir"
   # coloque os .jpg/.jpeg lá dentro
   ```
2. **Salve o script** `excluir_produtos.py` (ao final deste arquivo) na raiz do projeto.
3. **Edite a variável `DIR`** no início do script para o nome da pasta criada.
4. **Rode em modo revisão** (padrão — NÃO exclui nada):
   ```bash
   python3 excluir_produtos.py
   ```
   O script imprime:
   - `ARQUIVOS A EXCLUIR: N` + a lista completa;
   - `FOTOS COM DUVIDA: M` + as fotos/names que não puderam ser identificados.
   **Revise com cuidado** antes de prosseguir, principalmente os itens da lista de dúvida.
5. **Exclua de verdade**:
   ```bash
   python3 excluir_produtos.py --execute
   ```
6. **Confira o resultado**:
   ```bash
   find public/products -type f | wc -l          # contagem nova de produtos
   git status --short                              # só os D* esperados (nada além)
   cat LISTA-EXCLUSAO-*.txt                        # manifestos gerados
   ```
   O script gera dois manifestos na raiz do projeto:
   - `LISTA-EXCLUSAO-<pasta>.txt` — cada arquivo excluído com o nome OCR que casou;
   - `LISTA-NAO-IDENTIFICADAS-<pasta>.txt` — fotos que ficaram para revisão.

## Observações

- As **fotos da pasta de origem nunca são apagadas** — só os arquivos de `public/products/` que casam são excluídos.
- Se precisar desfazer: `git checkout -- public/products` recupera arquivos que estavam versionados (os que nunca foram commitados não são recuperáveis).
- O catálogo lê `public/products/` recursivamente em `app/api/products/route.js` — a exclusão reflete na API automaticamente.
- Nomes de arquivo no padrão `NNN. Nome Produto R$ preço.ext` (o `NNN. ` e o preço são ignorados na comparação).

---

## Script `excluir_produtos.py`

```python
#!/usr/bin/env python3
"""Extrai nomes de produtos por OCR das imagens de uma pasta em public/
e casa com os arquivos de public/products/ (por nome, preço só desempata
variantes de tamanho). Gera manifestos e opcionalmente exclui (--execute)."""
import glob, os, re, subprocess, sys, unicodedata

BASE = os.path.dirname(os.path.abspath(__file__))
DIR  = os.path.join(BASE, "public/WhatsApp Catalogo Excluir")  # <-- TROQUE AQUI
EXECUTE = "--execute" in sys.argv

def norm(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.lower()
    return re.sub(r'[^a-z0-9]+', ' ', s)

STOP = set("de do da dos das para por e em na no nas nos um uma a o as os "
"consultar consulta disponivel disponiveis tamanho tamanhos numeracao numeracoes "
"numeraçao numerações cores cor letra letras cada prn ra".split())
SIZE = {"p", "g", "m"}

def tokens(s):
    t = set(norm(s).split())
    return {x for x in t
            if (x in SIZE) or (x not in STOP and len(x) > 1 and not re.fullmatch(r'\d{1,3}', x))}

PRICE_RE = re.compile(r"R\$\s*(\d+,\d+)", re.I)
PRICE = re.compile(r'R\$\s*[\d.,]+', re.I)
pf = lambda s: float(s.replace(',', '.')) if s else None

def tsv_words(path):
    out = subprocess.run(["tesseract", path, "stdout", "-l", "por", "--psm", "6", "tsv"],
                         capture_output=True, text=True).stdout
    words = []
    for line in out.splitlines()[1:]:
        p = line.split("\t")
        if len(p) != 12:
            continue
        txt = p[11].strip()
        try:
            conf = float(p[10])  # conf é float no TSV
        except ValueError:
            continue
        if not txt or conf < 45:
            continue
        words.append({"text": txt, "x": int(p[6]), "top": int(p[7]), "w": int(p[8]), "h": int(p[9])})
    return words

def extract(path):
    words = tsv_words(path)
    if not words:
        return []
    for w in words:
        w["cx"] = w["x"] + w["w"] / 2.0
        w["cy"] = w["top"] + w["h"] / 2.0
        w["bottom"] = w["top"] + w["h"]
    iw = max(w["x"] + w["w"] for w in words) + 50
    prices = sorted([w for w in words if PRICE_RE.search(w["text"])], key=lambda w: w["cx"])
    if not prices:
        return []
    B = []
    for i, p in enumerate(prices):
        L = 0 if i == 0 else (prices[i - 1]["cx"] + p["cx"]) / 2.0
        R = iw if i == len(prices) - 1 else (p["cx"] + prices[i + 1]["cx"]) / 2.0
        B.append((L, R, PRICE_RE.search(p["text"]).group(1)))
    img_h = max(w["bottom"] for w in words)
    names = [w for w in words if not PRICE_RE.search(w["text"])
             and w["cy"] > img_h * 0.5 and w["cy"] < prices[0]["top"] + 12]
    out = []
    for L, R, pr in B:
        cell = sorted([w for w in names if L <= w["cx"] <= R], key=lambda w: (w["top"], w["cx"]))
        out.append((" ".join(w["text"] for w in cell).strip(), pr))
    return out

ocr = []
for f in sorted(glob.glob(os.path.join(DIR, "*.jpeg")) + glob.glob(os.path.join(DIR, "*.jpg"))):
    for n, pr in extract(f):
        ocr.append((os.path.basename(f), n, pr))

prods = []
for f in glob.glob(os.path.join(BASE, "public/products/**/*"), recursive=True):
    if os.path.isdir(f) or not os.path.exists(f):
        continue
    raw = os.path.splitext(os.path.basename(f))[0]
    n = re.sub(r'^\d+\.\s*', '', raw)
    np_name = PRICE.sub(' ', n)
    nn = re.sub(r'\(.*?\)', ' ', np_name)
    nn = re.sub(r'(_mais_|_e_|\bde\b|\bpor\b)', ' ', nn, flags=re.I)
    nn = re.sub(r'\s+', ' ', nn).strip()
    rprices = set(pf(x.replace(',', '.')) for x in PRICE_RE.findall(raw))
    prods.append({"path": f, "tokens": tokens(nn), "prices": rprices})

CAT = {"brinco","colar","anel","argola","pulseira","pulseiras","kit","conjunto",
       "escapulario","bracelete","corrente","porta","piercing","pingente","acessorio"}
matched = {}
flagged = {}
for img, name, price in ocr:
    ot = tokens(name)
    ocr_p = pf(price)
    if len(ot) < 2:
        flagged.setdefault(img, []).append((name, price, "nome genérico", []))
        continue
    exact = [p for p in prods if p["tokens"] == ot]
    if exact:
        for h in exact:
            matched.setdefault(h["path"], []).append(f"{name} (R$ {price})")
        continue
    subs = [p for p in prods if ot.issubset(p["tokens"]) or ot == p["tokens"]]
    subs.sort(key=lambda p: (len(p["tokens"]), p["path"]))
    has_cat = bool(ot & CAT)
    chosen = None
    if len(subs) == 1:
        chosen = subs[0]
    elif subs:
        if has_cat and len(subs[0]["tokens"]) < len(subs[1]["tokens"]):
            chosen = subs[0]
        elif len(subs[0]["tokens"]) == len(subs[-1]["tokens"]):
            same = [p for p in subs if p["tokens"] == subs[0]["tokens"]]
            by_price = [p for p in same if ocr_p in p["prices"]]
            if len(by_price) == 1:
                chosen = by_price[0]
    if chosen:
        matched.setdefault(chosen["path"], []).append(f"{name} (R$ {price})")
    else:
        cands = [os.path.relpath(p["path"], BASE) for p in subs]
        flagged.setdefault(img, []).append((name, price, "ambíguo" if subs else "sem arquivo", cands))

tag = os.path.basename(DIR.rstrip("/"))
with open(os.path.join(BASE, f"LISTA-EXCLUSAO-{tag}.txt"), "w", encoding="utf-8") as fh:
    fh.write(f"# Arquivos a excluir de public/products (OCR da pasta '{tag}')\n")
    for path in sorted(matched):
        fh.write(f"{os.path.relpath(path, BASE)}  <==  {'; '.join(matched[path])}\n")
with open(os.path.join(BASE, f"LISTA-NAO-IDENTIFICADAS-{tag}.txt"), "w", encoding="utf-8") as fh:
    fh.write(f"# Fotos da pasta '{tag}' com produtos que NÃO puderam ser identificados\n")
    for img in sorted(flagged.keys()):
        fh.write(f"\n[{img}]\n")
        for name, price, reason, cands in flagged[img]:
            extra = "  -> " + " | ".join(c[:70] for c in cands[:4]) if cands else ""
            fh.write(f"   - {name!r} (R$ {price}) -> {reason}{extra}\n")

print(f"OCR cards: {len(ocr)} | ARQUIVOS A EXCLUIR: {len(matched)} | FOTOS COM DUVIDA: {len(flagged)}")
print("=" * 70)
for path in sorted(matched):
    print(os.path.relpath(path, BASE))
if flagged:
    print("-" * 70)
    for img in sorted(flagged.keys()):
        print(f"[{img}]")
        for name, price, reason, cands in flagged[img]:
            extra = "  -> " + " | ".join(c[:70] for c in cands[:4]) if cands else ""
            print(f"   - {name!r} (R$ {price}) -> {reason}{extra}")

if EXECUTE:
    deleted = 0
    for path in sorted(matched):
        if os.path.exists(path):
            os.remove(path)
            deleted += 1
    print("-" * 70)
    print(f"EXCLUÍDOS: {deleted} arquivos")
else:
    print("-" * 70)
    print("MODO REVISÃO: nada foi excluído. Rode com --execute para excluir.")
```