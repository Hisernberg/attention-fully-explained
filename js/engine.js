/* ============================================================
   Attention Engine — deterministic toy math for visualization
   Everything runs in the browser, no data leaves your device.
   ============================================================ */
const Engine = (() => {

  /* ---------- deterministic randomness ---------- */
  function hashStr(s){
    let h = 2166136261;
    for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a){
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function randVec(seed, d){
    const r = mulberry32(seed);
    return Array.from({length:d}, () => r()*2 - 1);
  }
  function randMat(seed, d){
    const r = mulberry32(seed);
    return Array.from({length:d}, () =>
      Array.from({length:d}, () => (r()*2 - 1) / Math.sqrt(d)));
  }

  /* ---------- linear algebra ---------- */
  const dot = (a,b) => a.reduce((s,v,i) => s + v*b[i], 0);
  const matVec = (W,x) => W.map(row => row.reduce((s,v,i) => s + v*x[i], 0));
  const transpose = A => A[0].map((_,j) => A.map(r => r[j]));
  const vadd = (a,b) => a.map((v,i) => v + b[i]);
  const zeros = n => Array(n).fill(0);

  function softmaxRaw(arr, temp = 1){
    const t = Math.max(temp, 1e-4);
    const m = Math.max(...arr.map(v => v === -Infinity ? -1e30 : v));
    const e = arr.map(v => Math.exp((v - m) / t));
    const s = e.reduce((a,b) => a + b, 0);
    return e.map(v => v / s);
  }

  /* ---------- tokenizer (educational, BERT-wordpiece-style) ---------- */
  const PRE = ['un','re','pre','dis','mis','over','under','anti'];
  const SUF = ['tion','ment','ness','able','ing','ed','ly','er','est','s'];
  function tokenize(text){
    const parts = text.match(/[\u0980-\u09FF]+|[A-Za-z']+|[০-৯0-9]+|[^\s]/g) || [];
    const out = [];
    for (const w of parts){
      if (/^[A-Za-z]{5,}$/.test(w)){
        const low = w.toLowerCase();
        let pre = null;
        for (const p of PRE){
          if (low.startsWith(p) && w.length - p.length >= 4){ pre = p; break; }
        }
        const r1 = pre ? w.slice(pre.length) : w;
        let suf = null;
        for (const s of SUF){
          if (low.startsWith(pre ? pre : '') &&
              r1.toLowerCase().endsWith(s) && r1.length - s.length >= 3){ suf = s; break; }
        }
        const stem = suf ? r1.slice(0, r1.length - suf.length) : r1;
        if (pre) out.push(pre);
        out.push(pre ? '##' + stem : stem);
        if (suf) out.push('##' + suf);
      } else {
        out.push(w);
      }
      if (out.length > 40) break;
    }
    return out;
  }
  const tokId = t => (hashStr('tok::' + t) % 49608) + 100;

  /* ---------- embeddings (deterministic toy vectors) ---------- */
  const DIM = 8;
  const embedToken = (t, d = DIM) => randVec(hashStr('emb::' + t), d);

  /* positional encoding — the real formula */
  const PE = (pos, i, d = 32) =>
    (i % 2 === 0 ? Math.sin(pos / Math.pow(10000, i / d))
                 : Math.cos(pos / Math.pow(10000, (i - 1) / d)));

  /* ---------- full self-attention for custom text ---------- */
  function compute(tokens, temp = 1){
    const X = tokens.map(t => embedToken(t));
    const Wq = randMat(hashStr('Wq-v1'), DIM),
          Wk = randMat(hashStr('Wk-v1'), DIM),
          Wv = randMat(hashStr('Wv-v1'), DIM);
    const Q = X.map(x => matVec(Wq, x)),
          K = X.map(x => matVec(Wk, x)),
          V = X.map(x => matVec(Wv, x));
    const S = Q.map(q => K.map(k => dot(q, k) / Math.sqrt(DIM)));
    const A = S.map(row => softmaxRaw(row, temp));
    const Out = A.map(row =>
      row.reduce((acc, w, j) => vadd(acc, V[j].map(v => v * w)), zeros(DIM)));
    return {X, Q, K, V, S, A, Out, d: DIM};
  }

  /* ---------- rule-based heads for the preset sentences ---------- */
  function fromRules(tokens, rule){
    const S = tokens.map((_, i) => tokens.map((__, j) => rule(i, j)));
    return S;
  }
  const maskRows = (S, causal = true) =>
    causal ? S.map((row, i) => row.map((v, j) => j > i ? -Infinity : v)) : S;

  function attentionWithRules(S, temp = 1){
    return S.map(row => softmaxRaw(row, temp));
  }

  return {hashStr, mulberry32, randVec, randMat, dot, matVec, transpose,
          vadd, zeros, softmaxRaw, tokenize, tokId, embedToken, PE,
          compute, fromRules, maskRows, attentionWithRules, DIM};
})();
