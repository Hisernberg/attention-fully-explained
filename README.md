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

An interactive, fully bilingual (**Bangla + English**) explainer of the **attention mechanism** — the idea behind every modern LLM — from **tokenization all the way to the sampled output**, with **16+ hands-on 2-D and 3-D visualizations**, a short history of RNN/LSTM/Seq2Seq, a story-vs-math deep dive, and curated top YouTube lessons. Everything computes locally in the browser; nothing to install, no data leaves your device.

## What's inside — 16+ visualizations

| # | Visualization | What you learn |
|---|---------------|----------------|
| 1 | History timeline (1986 → 2020s) | Why RNN/LSTM/Seq2Seq led to attention |
| 2 | Interactive tokenizer (EN + BN) | Tokens, subwords (##), IDs |
| 3 | Embedding value strip | A token ID → vector of meaning |
| 4 | 2-D semantic scatter map | Similar meanings cluster in space |
| 5 | king − man + woman animation | Word-vector arithmetic |
| 6 | Positional-encoding heatmap | sin/cos fingerprints per position |
| 7 | PE wave curves + position slider | Fast vs slow "clocks" |
| 8 | Q · K · V intuition cards | Library analogy, three projections |
| 9 | Attention score matrix (EN/BN) | Rows=queries, cols=keys, click to select |
| 10 | Softmax temperature playground | Watch weights sharpen/melt live |
| 11 | BertViz-style arc diagram | See "it" attend to "mouse" ("সে"→"ইঁদুর") |
| 12 | Multi-head grid (4 specialist heads) | Syntax, coreference, position, semantic |
| 13 | Causal mask toggle | Future cells → −∞ → weight 0 |
| 14 | 8-step full pipeline (real numbers) | Token → embed → +PE → QKV → scores → softmax(+mask) → A·V → next token |
| 15 | Next-token sampler + histogram | Logits → softmax → sampling; convergence |
| 16 | Story mode / Math mode toggle | Same idea at two altitudes |
| 17 | Worked numeric example (3 tokens, d=4) | Every matrix computed live |
| 18 | **3-D** transformer architecture explorer | Rotate/zoom/click blocks (Three.js) |
| 19 | **3-D** attention-weight surface | The matrix as a tower landscape |

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
