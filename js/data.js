/* ============================================================
   data.js — all bilingual content (Bangla + English)
   ============================================================ */
const DATA = {

  /* ---------- preset sentences for attention ---------- */
  presets: {
    'en': { label: 'EN: The cat chased the mouse because it was hungry',
      tokens: ['The','cat','chased','the','mouse','because','it','was','hungry'],
      focus: 6, focusHint: '"it" → ?' },
    'bn': { label: 'বাংলা: বিড়ালটি ইঁদুর তাড়া করেছিল কারণ সে ক্ষুধার্ত ছিল',
      tokens: ['বিড়ালটি','ইঁদুর','তাড়া','করেছিল','কারণ','সে','ক্ষুধার্ত','ছিল'],
      focus: 5, focusHint: '"সে" → ?' }
  },

  /* ---------- rule-based heads (i = query row, j = key col) ---------- */
  headRules: {
    en: [
      { id:'prev', en:'Head 1 · Syntax / previous word', bn:'হেড ১ · বাক্য-গঠন / আগের শব্দ',
        fn:(i,j)=> j===i-1 ? 3.0 : (j===i ? 0.8 : -0.6) },
      { id:'coref', en:'Head 2 · Coreference ("it" = ?)', bn:'হেড ২ · নির্দেশ-সম্পর্ক ("সে" = কে?)',
        fn:(i,j)=>{ const m={ '6,4':4.0,'6,1':2.2,'2,1':2.0,'2,4':2.2,'7,6':2.0,'8,6':1.6,'8,4':1.6 };
          return m[i+','+j] !== undefined ? m[i+','+j] : (j===i ? 0.6 : -0.8); } },
      { id:'sink', en:'Head 3 · Position sink (first token)', bn:'হেড ৩ · অবস্থান (বাক্যের শুরু)',
        fn:(i,j)=> j===0 ? 2.2 : (j===i ? 0.9 : -0.5) },
      { id:'sem', en:'Head 4 · Semantic / content words', bn:'হেড ৪ · অর্থবোধক শব্দ',
        fn:(i,j)=>{ const c=[1,2,4,8];
          return (c.includes(i)&&c.includes(j)) ? 1.4 : (j===i ? 0.7 : -1.0); } }
    ],
    bn: [
      { id:'prev', en:'Head 1 · Syntax / previous word', bn:'হেড ১ · বাক্য-গঠন / আগের শব্দ',
        fn:(i,j)=> j===i-1 ? 3.0 : (j===i ? 0.8 : -0.6) },
      { id:'coref', en:'Head 2 · Coreference ("সে" = ?)', bn:'হেড ২ · নির্দেশ-সম্পর্ক ("সে" = কে?)',
        fn:(i,j)=>{ const m={ '5,1':4.0,'5,0':2.2,'2,0':2.0,'2,1':2.2,'7,5':2.0,'6,5':1.6,'6,1':1.6 };
          return m[i+','+j] !== undefined ? m[i+','+j] : (j===i ? 0.6 : -0.8); } },
      { id:'sink', en:'Head 3 · Position sink (first token)', bn:'হেড ৩ · অবস্থান (বাক্যের শুরু)',
        fn:(i,j)=> j===0 ? 2.2 : (j===i ? 0.9 : -0.5) },
      { id:'sem', en:'Head 4 · Semantic / content words', bn:'হেড ৪ · অর্থবোধক শব্দ',
        fn:(i,j)=>{ const c=[0,1,2,6];
          return (c.includes(i)&&c.includes(j)) ? 1.4 : (j===i ? 0.7 : -1.0); } }
    ]
  },

  /* ---------- history timeline ---------- */
  history: [
    { yr:'1986', en:'RNN — Recurrent Neural Network', bn:'RNN — রিকারেন্ট নিউরাল নেটওয়ার্ক',
      den:'Networks read text one token at a time, passing a hidden state forward. Beautiful idea — but by the end of a long sentence the gradient (the learning signal) has faded: the vanishing gradient problem.',
      dbn:'নেটওয়ার্ক একটার পর একটা টোকেন পড়ে, হিডেন স্টেট সামনে পাঠায়। চমৎকার আইডিয়া — কিন্তু লম্বা বাক্যের শেষে গ্র্যাডিয়েন্ট (শেখার সংকেত) মিলিয়ে যায় — এটাই vanishing gradient সমস্যা।' },
    { yr:'1997', en:'LSTM — Long Short-Term Memory', bn:'LSTM — লং শর্ট-টার্ম মেমরি',
      den:'Hochreiter and Schmidhuber add "gates": the network learns what to remember and what to forget. Much better memory — but still strictly sequential, so slow, and distant context is still hard.',
      dbn:'Hochreiter আর Schmidhuber "গেট" যোগ করেন: নেটওয়ার্ক নিজেই শেখে কী মনে রাখবে আর কী ভুলবে। স্মৃতি অনেক ভালো — তবু ক্রমধর্মী (sequential), তাই ধীর, আর দূরের প্রসঙ্গ ধরা এখনো কঠিন।' },
    { yr:'2014', en:'Seq2Seq — the bottleneck', bn:'Seq2Seq — বাধাটা এখানেই',
      den:'Encoder-decoder for translation. The whole source sentence is squeezed into ONE fixed vector — the bottleneck. Long sentences lose meaning in that squeeze.',
      dbn:'অনুবাদের জন্য encoder-decoder। পুরো সোর্স বাক্য চেপে ঢোকানো হয় একটা ফিক্সড ভেক্টরে — এটাই bottleneck। লম্বা বাক্যের অর্থ এই চাপে হারিয়ে যায়।' },
    { yr:'2014', en:'Bahdanau Attention — first look around', bn:'Bahdanau Attention — প্রথমবার "চারপাশে তাকানো"',
      den:'"Neural Machine Translation by Jointly Learning to Align and Translate": the decoder peeks at ALL encoder states with learned weights. Attention is born.',
      dbn:'"Neural Machine Translation by Jointly Learning to Align and Translate" পেপার: ডিকোডার এখন এনকোডারের সব স্টেটে শেখা ওজন দিয়ে "চোখ রাখতে" পারে। এখানেই Attention-এর জন্ম।' },
    { yr:'2017', en:'"Attention Is All You Need" — Transformer', bn:'"Attention Is All You Need" — Transformer-এর জন্ম',
      den:'Vaswani et al. throw away recurrence entirely: only self-attention + feed-forward, fully parallel. Scaling becomes easy — the modern era begins.',
      dbn:'Vaswani ও সহকর্মীরা recurrence সম্পূর্ণ বাদ দেন: শুধু self-attention + feed-forward, পুরোপুরি parallel। এতে মডেল বড় করা সহজ হয় — আধুনিক যুগের সূচনা।' },
    { yr:'2018', en:'BERT & GPT', bn:'BERT আর GPT',
      den:'Two ways to use the block: BERT reads both directions (understanding), GPT predicts the next token with a causal mask (generating).',
      dbn:'একই ব্লক দুইভাবে ব্যবহার: BERT দুই দিক থেকে পড়ে (বোঝার জন্য), GPT causal mask দিয়ে পরের টোকেন অনুমান করে (লেখার জন্য)।' },
    { yr:'2020+', en:'The Attention Era — GPT-3 to ChatGPT', bn:'Attention-এর যুগ — GPT-3 থেকে ChatGPT',
      den:'Scale + attention = LLMs. The same mechanism now reads images (ViT), audio, code and protein structures. You are using its descendant right now.',
      dbn:'স্কেল + attention = LLM। একই মেকানিজম এখন ছবি (ViT), অডিও, কোড, এমনকি প্রোটিন স্ট্রাকচারও পড়ে। তুমি এই মুহূর্তে এরই বংশধর ব্যবহার করছ।' }
  ],

  /* ---------- toy 2D embedding map (hand-set semantic clusters) ---------- */
  scatter: [
    {w:'cat',   bn:'বিড়াল',  x:-0.62, y: 0.50},
    {w:'dog',   bn:'কুকুর',   x:-0.50, y: 0.66},
    {w:'lion',  bn:'সিংহ',    x:-0.74, y: 0.38},
    {w:'fish',  bn:'মাছ',     x:-0.38, y: 0.34},
    {w:'king',  bn:'রাজা',    x: 0.58, y: 0.56},
    {w:'queen', bn:'রানী',    x: 0.72, y: 0.68},
    {w:'prince',bn:'রাজকুমার',x: 0.52, y: 0.74},
    {w:'man',   bn:'পুরুষ',   x: 0.44, y: 0.30},
    {w:'woman', bn:'নারী',    x: 0.58, y: 0.40},
    {w:'apple', bn:'আপেল',    x:-0.30, y:-0.58},
    {w:'banana',bn:'কলা',     x:-0.14, y:-0.70},
    {w:'mango', bn:'আম',      x:-0.44, y:-0.50},
    {w:'run',   bn:'দৌড়ানো', x: 0.10, y: 0.06},
    {w:'walk',  bn:'হাঁটা',   x: 0.02, y: 0.14},
    {w:'jump',  bn:'লাফ',     x: 0.24, y:-0.02},
    {w:'eat',   bn:'খাওয়া',   x: 0.04, y:-0.10},
    {w:'red',   bn:'লাল',     x: 0.78, y:-0.42},
    {w:'blue',  bn:'নীল',     x: 0.88, y:-0.30},
    {w:'green', bn:'সবুজ',    x: 0.66, y:-0.26}
  ],

  /* ---------- next-word demo ---------- */
  nextword: {
    en: { ctx:'The cat sat on the', cands:['mat','sofa','floor','chair','moon','banana'],
          logits:[3.2, 1.6, 1.3, 0.9, 0.2, 0.1] },
    bn: { ctx:'আমি প্রতিদিন রাতে বই', cands:['পড়ি','লিখি','দেখি','কিনি','রান্না','খাই'],
          logits:[3.1, 1.3, 0.9, 0.6, 0.15, 0.1] }
  },

  /* ---------- pipeline presets ---------- */
  pipe: ['en','bn'],

  /* ---------- videos (IDs verified) ---------- */
  videos: [
    { id:'eMlx5fFNoYc', ch:'3Blue1Brown', len:'27 min',
      ten:'Attention in transformers, step-by-step | Deep Learning Ch. 6',
      tbn:'Attention in transformers, step-by-step | ডিপ লার্নিং পর্ব ৬',
      wen:'THE visual intuition of Q, K, V. If you watch only one video, watch this.',
      wbn:'Q, K, V-এর সেরা ভিজ্যুয়াল ব্যাখ্যা। একটা ভিডিও দেখলে এটাই দেখো।' },
    { id:'wjZofJX0v4M', ch:'3Blue1Brown', len:'27 min',
      ten:'Transformers, the tech behind LLMs | Deep Learning Ch. 5',
      tbn:'Transformers, the tech behind LLMs | ডিপ লার্নিং পর্ব ৫',
      wen:'The full transformer pipeline — embeddings, attention block, MLP, softmax.',
      wbn:'পুরো Transformer পাইপলাইন — এমবেডিং, attention block, MLP, softmax।' },
    { id:'zxQyTK8quyY', ch:'StatQuest with Josh Starmer', len:'36 min',
      ten:'Transformer Neural Networks, ChatGPT\u2019s foundation — Clearly Explained',
      tbn:'Transformer Neural Networks, ChatGPT\u2019s foundation — সহজ ব্যাখ্যা',
      wen:'Encoder-decoder walked one step at a time. Great for the "why" of each piece.',
      wbn:'Encoder-decoder ধাপে ধাপে। প্রতিটা অংশের "কেন" বোঝার জন্য দারুণ।' },
    { id:'kCc8FmEb1nY', ch:'Andrej Karpathy', len:'1h 56m',
      ten:'Let\u2019s build GPT: from scratch, in code, spelled out',
      tbn:'Let\u2019s build GPT: from scratch, in code, spelled out',
      wen:'Build a real GPT in PyTorch, line by line. The best way to make attention concrete.',
      wbn:'PyTorch-এ লাইন ধরে ধরে আসল GPT বানানো। Attention-কে হাতে-কলমে বোঝার সেরা উপায়।' },
    { id:'bCz4OMemCcA', ch:'Umar Jamil', len:'43 min',
      ten:'Attention is all you need (Transformer) — Model explanation, including math',
      tbn:'Attention is all you need (Transformer) — মডেল ব্যাখ্যা, গণিতসহ',
      wen:'The original 2017 paper explained slowly and completely — every formula.',
      wbn:'মূল ২০১৭ পেপারটাই ধীরে, প্রতিটা সূত্রসহ, সম্পূর্ণ ব্যাখ্যা করা।' },
    { id:'4bdcM4vB6ts', ch:'StatQuest with Josh Starmer', len:'17 min',
      ten:'Neural Networks Pt. 2 — Backpropagation Main Ideas',
      tbn:'Neural Networks Pt. 2 — Backpropagation Main Ideas',
      wen:'Bonus: the gradient-descent engine that trains every W_Q, W_K, W_V behind attention.',
      wbn:'বোনাস: যে গ্র্যাডিয়েন্ট-ডিসেন্ট ইঞ্জিন অ্যাটেনশনের পেছনের প্রতিটা W_Q, W_K, W_V প্রশিক্ষণ দেয়।' }
  ],

  /* ---------- credits / inspirations ---------- */
  credits: [
    { n:'Transformer Explainer', u:'https://poloclub.github.io/transformer-explainer/',
      den:'Interactive sandbox by Georgia Tech Polo Club — run a live transformer in your browser. Our pipeline section is inspired by it.',
      dbn:'Georgia Tech Polo Club-এর ইন্টারঅ্যাক্টিভ স্যান্ডবক্স — ব্রাউজারেই জীবন্ত transformer চালাও। আমাদের pipeline সেকশনের অনুপ্রেরণা।' },
    { n:'AttentionViz', u:'https://attentionviz.com/',
      den:'Harvard visualization of global Q·K patterns. Inspired our Q/K/V scatter thinking.',
      dbn:'Harvard-এর global Q·K প্যাটার্ন ভিজ্যুয়ালাইজেশন। আমাদের Q/K/V ভাবনায় অনুপ্রেরণা।' },
    { n:'Inspectus', u:'https://github.com/labmlai/inspectus',
      den:'Python library for attention heatmaps between multiple layers/tokens.',
      dbn:'একাধিক লেয়ার/টোকেনের attention heatmap বানানোর Python লাইব্রেরি।' },
    { n:'BertViz', u:'https://github.com/jessevig/bertviz',
      den:'The classic interactive attention-head explorer. Our arc diagram is a tribute to it.',
      dbn:'ক্লাসিক ইন্টারঅ্যাক্টিভ attention-head এক্সপ্লোরার। আমাদের arc diagram এর প্রতি শ্রদ্ধা।' },
    { n:'Attention Playground', u:'https://attention.streamlit.app/',
      den:'Streamlit playground for playing with Q, K, V and softmax live.',
      dbn:'Q, K, V আর softmax নিয়ে খেলার Streamlit প্লেগ্রাউন্ড।' },
    { n:'LLM Visualization', u:'https://bbycroft.net/llm',
      den:'Brendan Bycroft\u2019s legendary 3D LLM explorer. Our 3D section stands on its shoulders.',
      dbn:'Brendan Bycroft-এর কিংবদন্তি 3D LLM এক্সপ্লোরার। আমাদের 3D সেকশন এর কাঁধে দাঁড়িয়ে।' },
    { n:'The Illustrated Transformer', u:'https://jalammar.github.io/illustrated-transformer/',
      den:'Jay Alammar\u2019s illustrated blog post — the most-shared attention explainer ever.',
      dbn:'Jay Alammar-এর চিত্রিত ব্লগ — ইতিহাসের সবচেয়ে বেশি শেয়ার হওয়া attention ব্যাখ্যা।' },
    { n:'Attention Is All You Need', u:'https://arxiv.org/abs/1706.03762',
      den:'The original 2017 paper (Vaswani et al.). Read it after finishing this site.',
      dbn:'মূল ২০১৭ পেপার (Vaswani et al.)। এই সাইট শেষ করে এটা পড়ো।' }
  ],

  /* ---------- glossary ---------- */
  glossary: [
    {t:'Token', b:'টোকেন', den:'A small chunk of text — a word or piece of a word — that the model reads.', dbn:'টেক্সটের ছোট টুকরো — পুরো শব্দ বা শব্দের অংশ — যেটা মডেল পড়ে।'},
    {t:'Tokenization', b:'টোকেনাইজেশন', den:'Splitting text into tokens and mapping each to an integer ID.', dbn:'টেক্সটকে টোকেনে ভাগ করা এবং প্রতিটাকে পূর্ণসংখ্যা ID দেওয়া।'},
    {t:'BPE', b:'BPE (বাইট পেয়ার এনকোডিং)', den:'Byte Pair Encoding — the subword algorithm that learns vocabulary from data.', dbn:'Byte Pair Encoding — ডেটা থেকে ভোকাবুলারি শেখা সাবওয়ার্ড অ্যালগরিদম।'},
    {t:'Embedding', b:'এমবেডিং', den:'A dense vector that represents a token\u2019s meaning in high-dimensional space.', dbn:'ঘন ভেক্টর, যা টোকেনের অর্থকে উচ্চ-মাত্রিক স্পেসে প্রকাশ করে।'},
    {t:'Positional Encoding', b:'পজিশনাল এনকোডিং', den:'A unique pattern (sin/cos waves) added to embeddings so the model knows word order.', dbn:'এমবেডিংয়ের সাথে যোগ করা ইউনিক প্যাটার্ন (sin/cos ওয়েভ), যাতে মডেল শব্দের ক্রম জানে।'},
    {t:'Query (Q)', b:'কুয়েরি (Q)', den:'What a token is looking for in other tokens.', dbn:'একটা টোকেন অন্য টোকেনদের মধ্যে কী খুঁজছে।'},
    {t:'Key (K)', b:'কী (K)', den:'What a token offers to be matched against queries.', dbn:'কুয়েরির সাথে মেলার জন্য টোকেন যা প্রস্তাব করে।'},
    {t:'Value (V)', b:'ভ্যালু (V)', den:'The information a token passes along once it is attended to.', dbn:'টোকেনের ওপর attention পড়লে সে যে তথ্য হস্তান্তর করে।'},
    {t:'Dot product', b:'ডট প্রোডাক্ট', den:'Multiply two vectors elementwise and sum — a similarity score.', dbn:'দুই ভেক্টর গুণ করে যোগ করা — একটা সাদৃশ্য স্কোর।'},
    {t:'Scaling (√dk)', b:'স্কেলিং (√dk)', den:'Dividing scores by \u221Adk keeps softmax gradients healthy when vectors are long.', dbn:'স্কোরকে \u221Adk দিয়ে ভাগ করলে বড় ভেক্টরেও softmax-এর গ্র্যাডিয়েন্ট সুস্থ থাকে।'},
    {t:'Attention score', b:'অ্যাটেনশন স্কোর', den:'Raw relevance of key j to query i: qi·kj/\u221Adk.', dbn:'কী j কুয়েরি i-এর কতটা প্রাসঙ্গিক — কাঁচা সংখ্যা: qi·kj/\u221Adk।'},
    {t:'Softmax', b:'সফটম্যাক্স', den:'Turns any list of numbers into a probability distribution (sums to 1).', dbn:'যেকোনো সংখ্যার তালিকাকে প্রোবাবিলিটিতে বদলায় (যোগফল ১)।'},
    {t:'Attention weight', b:'অ্যাটেনশন ওয়েট', den:'A softmaxed score — how much token i looks at token j (0 to 1).', dbn:'সফটম্যাক্স-করা স্কোর — টোকেন i টোকেন j-এর দিকে কতটা তাকায় (০ থেকে ১)।'},
    {t:'Context vector', b:'কনটেক্সট ভেক্টর', den:'The weighted average of values — what attention outputs for one token.', dbn:'ভ্যালুগুলোর ওজনসমষ্টি — এক টোকেনের জন্য attention-এর আউটপুট।'},
    {t:'Self-attention', b:'সেলফ-অ্যাটেনশন', den:'Tokens attending to other tokens of the SAME sequence.', dbn:'একই সিকোয়েন্সের টোকেনরা একে অপরের দিকে attention দেয়।'},
    {t:'Cross-attention', b:'ক্রস-অ্যাটেনশন', den:'Queries from one sequence, keys/values from another (e.g., translation).', dbn:'কুয়েরি এক সিকোয়েন্সের, কী/ভ্যালু আরেকটার (যেমন অনুবাদ)।'},
    {t:'Multi-Head Attention', b:'মাল্টি-হেড অ্যাটেনশন', den:'Several attention heads in parallel, each learning a different relationship.', dbn:'সমান্তরালে কয়েকটা attention head — প্রতিটা আলাদা সম্পর্ক শেখে।'},
    {t:'Causal mask', b:'কজ্যুয়াল মাস্ক', den:'Hides future tokens (sets their scores to \u2212\u221E) so generation stays honest.', dbn:'ভবিষ্যতের টোকেন লুকিয়ে রাখে (স্কোর \u2212\u221E), যাতে জেনারেশন সৎ থাকে।'},
    {t:'Logits', b:'লজিটস', den:'Raw, unnormalized scores for every vocabulary token before softmax.', dbn:'softmax-এর আগে ভোকাবুলারির প্রতিটা টোকেনের কাঁচা স্কোর।'},
    {t:'Temperature', b:'টেম্পারেচার', den:'Divides logits in softmax: low = sharp and confident, high = flat and random.', dbn:'softmax-এ লজিটকে ভাগ করে: কম = ধারালো/আত্মবিশ্বাসী, বেশি = সমতল/এলোমেলো।'},
    {t:'Residual connection', b:'রেসিডুয়াল কানেকশন', den:'Adding a block\u2019s input to its output, helping gradients flow in deep stacks.', dbn:'ব্লকের ইনপুট আউটপুটে যোগ করা — গভীর স্ট্যাকে গ্র্যাডিয়েন্ট চলাচল সহজ করে।'},
    {t:'LayerNorm', b:'লেয়ারনর্ম', den:'Normalizes each token\u2019s vector to stable scale between blocks.', dbn:'প্রতিটা টোকেনের ভেক্টরকে স্থিতিশীল স্কেলে আনে, ব্লকের মাঝে।'},
    {t:'Feed-Forward (MLP)', b:'ফিড-ফরোয়ার্ড (MLP)', den:'A per-token two-layer network where tokens "think" individually after attending.', dbn:'প্রতি-টোকেন দুই-স্তরের নেটওয়ার্ক — attention-এর পর টোকেন একা "ভাবে"।'},
    {t:'Encoder / Decoder', b:'এনকোডার / ডিকোডার', den:'Encoder builds understanding; decoder generates output step by step.', dbn:'এনকোডার বোঝা তৈরি করে; ডিকোডার ধাপে ধাপে আউটপুট লেখে।'},
    {t:'Transformer', b:'ট্রান্সফরমার', den:'The architecture from "Attention Is All You Need" — attention + MLP, no recurrence.', dbn:'"Attention Is All You Need"-এর আর্কিটেকচার — attention + MLP, recurrence ছাড়া।'}
  ],

  /* ---------- 3D architecture blocks ---------- */
  arch: [
    { id:'emb',  label:'Embedding',  cy:0,
      en:'Embedding matrix — each token ID looks up its dense meaning-vector. Real GPT: ~12,288 dimensions.',
      bn:'এমবেডিং ম্যাট্রিক্স — প্রতিটা টোকেন-ID তার ঘন অর্থ-ভেক্টর ধার করে। আসল GPT-তে প্রায় ১২,২৮৮ ডাইমেনশন।' },
    { id:'pos',  label:'Position', cy:0.35,
      en:'Positional encoding — sin/cos fingerprints added so the model knows the order of words.',
      bn:'পজিশনাল এনকোডিং — sin/cos ফিঙ্গারপ্রিন্ট যোগ হয়, যাতে মডেল শব্দের ক্রম জানে।' },
    { id:'mha',  label:'Multi-Head Attention', cy:0.8,
      en:'Multi-head self-attention — every token asks every other token: "are you relevant to me?" Heads run in parallel, each learning its own relationship pattern.',
      bn:'মাল্টি-হেড সেলফ-অ্যাটেনশন — প্রতিটা টোকেন বাকিদের জিজ্ঞেস করে: "তুমি কি আমার জন্য প্রাসঙ্গিক?" কয়েকটা হেড সমান্তরালে চলে, প্রতিটা নিজের সম্পর্ক-প্যাটার্ন শেখে।' },
    { id:'an1',  label:'Add & Norm', cy:1.15,
      en:'Residual connection + LayerNorm — the original information survives, training stays stable.',
      bn:'রেসিডুয়াল কানেকশন + LayerNorm — মূল তথ্য টিকে থাকে, ট্রেনিং স্থিতিশীল থাকে।' },
    { id:'ffn',  label:'Feed-Forward', cy:1.55,
      en:'Feed-forward MLP — each token independently "thinks" about what it just gathered (2 layers, 4× wider).',
      bn:'ফিড-ফরোয়ার্ড MLP — প্রতিটা টোকেন একা "ভাবে" সবেমাত্র পাওয়া তথ্য নিয়ে (২ স্তর, ৪ গুণ চওড়া)।' },
    { id:'out',  label:'Linear + Softmax', cy:2.05,
      en:'Unembedding: project to vocabulary size, softmax to probabilities, sample the next token. Then repeat the whole stack.',
      bn:'আন-এমবেডিং: ভোকাবুলারি সাইজে প্রজেক্ট করে softmax দিয়ে প্রোবাবিলিটি, তারপর পরের টোকেন স্যাম্পল। তারপর পুরো স্ট্যাক আবার চলে।' }
  ]
};
