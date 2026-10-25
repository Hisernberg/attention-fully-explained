---
title: Attention Fully Explained
emoji: "\U0001F3AF"
colorFrom: indigo
colorTo: purple
sdk: static
pinned: true
license: mit
short_description: Attention mechanism explained — Bangla + English
---

# Attention, Fully Explained — টোকেন থেকে আউটপুট পর্যন্ত

**Live Space:** https://huggingface.co/spaces/Nabidnur/attention-fully-explained
**Repo:** https://github.com/Hisernberg/attention-fully-explained

An interactive, fully bilingual (**Bangla + English**) explainer of the **attention mechanism** — the idea behind every modern LLM — from **tokenization all the way to the sampled output**, with **25+ hands-on 2-D and 3-D visualizations** (five of them full Three.js scenes), a short history of RNN/LSTM/Seq2Seq, a story-vs-math deep dive, and curated top YouTube lessons. Everything computes locally in the browser; nothing to install, no data leaves your device.

## What's inside — 25+ visualizations

| # | Visualization | What you learn |
|---|---------------|----------------|
| 1 | History timeline (1986 → 2020s) | Why RNN/LSTM/Seq2Seq led to attention |
| 2 | Interactive tokenizer (EN + BN) | Tokens, subwords (##), IDs |
| 3 | **BPE merge lab (auto-play)** | The real Byte Pair Encoding learning its cuts, step by step |
| 4 | **Byte anatomy (UTF-8)** | Why Bangla letters cost 3 bytes and 2–4× more tokens |
| 5 | **Special tokens cards** | [PAD]/[UNK]/[CLS]/[SEP]/[MASK]/BOS/EOS roles |
| 6 | **Three-tokenizer comparison** | Word vs subword vs character token counts, live |
| 7 | Embedding value strip | A token ID → vector of meaning |
| 8 | **Vector table, dim by dim** | Every number + what each toy dim learned |
| 9 | **One-hot × E lookup** | Where embedding rows really come from |
| 10 | **Cosine similarity calculator** | Full worked dot product, norms, angle sketch |
| 11 | 2-D semantic scatter map | Similar meanings cluster in space |
| 12 | king − man + woman animation | Word-vector arithmetic (cos ≈ 0.996 with queen) |
| 13 | **3-D embedding space** | Walk around meaning-space; animated 3-D analogy |
| 14 | Positional-encoding heatmap | sin/cos fingerprints per position |
| 15 | PE wave curves + position slider | Fast vs slow "clocks" |
| 16 | **3-D PE wave landscape** | The whole fingerprint terrain + slider-driven slice |
| 17 | Q · K · V intuition cards | Library analogy, three projections |
| 18 | **Q/K/V token inspector** | One token → x, q, k, v bars + raw score row, real numbers |
| 19 | Attention score matrix (EN/BN) | Rows=queries, cols=keys, click to select |
| 20 | Softmax temperature playground | Watch weights sharpen/melt live |
| 21 | BertViz-style arc diagram | See "it" attend to "mouse" ("সে"→"ইঁদুর") |
| 22 | Multi-head grid (4 specialist heads) | Syntax, coreference, position, semantic |
| 23 | **3-D multi-head tower** | Four head-floors; click a tower to sync every 2-D explorer |
| 24 | Causal mask toggle | Future cells → −∞ → weight 0 |
| 25 | 8-step full pipeline (real numbers) | Token → embed → +PE → QKV → scores → softmax(+mask) → A·V → next token |
| 26 | Next-token sampler + histogram | Logits → softmax → sampling; convergence |
| 27 | Story mode / Math mode toggle | Same idea at two altitudes |
| 28 | Worked numeric example (3 tokens, d=4) | Every matrix computed live |
| 29 | **3-D** transformer architecture explorer | Rotate/zoom/click blocks (Three.js) |
| 30 | **3-D** attention-weight surface | The matrix as a tower landscape |

Bonus: bilingual glossary (25 terms), curated video wall (3Blue1Brown, StatQuest, Karpathy, Umar Jamil), credits to the six landmark projects this was inspired by.

## Inspired by (and crediting)

- [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) — Georgia Tech Polo Club
- [AttentionViz](https://attentionviz.com/) — Harvard
- [Inspectus](https://github.com/labmlai/inspectus) — labmlai
- [BertViz](https://github.com/jessevig/bertviz) — Jesse Vig
- [Attention Playground](https://attention.streamlit.app/)
- [LLM Visualization](https://bbycroft.net/llm) — Brendan Bycroft
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) — Jay Alammar
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) — Vaswani et al., 2017

## Tech

Vanilla JavaScript + Canvas 2D + SVG + [Three.js](https://threejs.org/) + [KaTeX](https://katex.org/) + Google Fonts (Hind Siliguri / Noto Sans Bengali / Space Grotesk / JetBrains Mono). Static site — no build step, no server, no tracking.

## Run locally

```bash
python -m http.server 8000
# open http://localhost:8000
```

## License

MIT — see [LICENSE](LICENSE).
