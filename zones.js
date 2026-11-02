/* 모든 선택 활동을 '캐릭터를 움직여 발판에 서기'로 바꾸는 레이어 (game.js · activities.js 이후 로드) */
'use strict';
let WK = null;
async function wk() { if (WK !== null) return WK; try { WK = await import('./walk.js'); } catch (e) { console.warn(e); WK = false; } return WK; }
const MOVE_HINT = '<p class="hint" style="text-align:center;margin:6px 0 0">방향키(↑↓←→)를 누르거나 화면을 누른 채 끌어서 구조대원을 움직여요. 발판 위에 잠깐 서 있으면 골라져요.</p>';
const L4 = 'ABCD';
function stageHTML(h = 'min(50vh,440px)') { return `<div class="stage3d zst" style="height:${h}"></div>${MOVE_HINT}`; }
function nextBtn(d, label = '다음 ▶', cls = '') { $('.fb', d).insertAdjacentHTML('beforeend', `<div class="next-row">${btn(label, cls)}</div>`); $('.fb', d).scrollIntoView({ behavior: 'smooth', block: 'center' }); return waitClick($('.fb .next-row:last-child .btn', d)); }

/* ---- 퀴즈: 정답 발판으로 걸어가기 ---- */
function quiz({ tag = '퀴즈', tc = '', q, img = null, opts, ans, hint, explain, pts = 30 }) {
  return new Promise(async res => {
    let tries = 0;
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag ${tc}">${tag}</div>
      <div class="qrow">${img ? `<img class="qimg" src="${img}" alt="">` : ''}<h2 class="q">${q}</h2></div>${stageHTML()}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res(0);
    W.zoneStage($('.zst', d), { sfx, zones: opts.map((o, i) => ({ html: `<b>${L4[i]}</b> ${o}` })), onEnter: (i, api) => {
      if (i === ans) { api.lock(true); api.flash(i, true); sfx('correct'); confetti(60); addLeaves(tries ? 10 : pts);
        $('.fb', d).innerHTML = `<div class="card paper" style="margin-top:16px;animation:rise .4s"><div class="title-tag forest">딩동댕! 정답</div>${explain}</div>`; nextBtn(d).then(() => res(tries)); }
      else { tries++; api.flash(i, false); sfx('wrong'); const c = $('.card', d); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
        $('.fb', d).innerHTML = `<div class="talk" style="cursor:default"><img class="who" style="width:100px" src="img/mascot.webp"><div class="bubble" style="min-height:0;padding:20px 24px"><span class="nm">힌트</span><div class="tx" style="font-size:20px">${hint}</div></div></div>`;
        setTimeout(() => api.home(), 650); }
    } });
  });
}

/* ---- 빨대의 여행: 그림 발판을 순서대로 밟기 ---- */
function straw() {
  const caps = ['길에 빨대를 버려요', '비에 쓸려 하수구로', '하천과 강으로', '바다까지 가요', '잘게 부서져요', '물고기가 먹어요'];
  return new Promise(async res => {
    const order = shuffle([1, 2, 3, 4, 5, 6]); let next = 1, tries = 0;
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag">빨대의 여행</div>
      <h2 class="q" style="margin:4px 0 8px">길에 버린 빨대는 어디로 갈까요? <span class="hl2">일어나는 순서대로</span> 그림 발판을 밟아요! <span class="jua nx" style="color:#ff8c7a">다음: 1번째</span></h2>${stageHTML('min(54vh,470px)')}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res();
    const zs = order.map(n => ({ html: `<img src="img/straw${n}.webp" alt="">${caps[n - 1]}` }));
    const api = W.zoneStage($('.zst', d), { sfx, zones: zs, onEnter: (i, a) => {
      const n = order[i];
      if (n === next) { sfx('correct', .5); a.flash(i, true); a.label(i, `<img src="img/straw${n}.webp" alt=""><b style="color:#ff8c7a">${next}번째 ✓</b> ${caps[n - 1]}`); next++; $('.nx', d).textContent = next <= 6 ? `다음: ${next}번째` : '완성!';
        if (next > 6) { a.lock(true); confetti(90); addLeaves(tries ? 15 : 40);
          $('.fb', d).innerHTML = `<div class="card paper" style="margin-top:14px"><div class="title-tag forest">정답!</div><p class="big">내가 버린 빨대 하나가 → 강과 바다를 거쳐 → 잘게 부서지고 → 물고기 배 속으로 → <span class="hl">결국 우리 식탁까지</span> 돌아와요. 생물은 먹고 먹히는 관계로 <b>모두 연결</b>되어 있어요.</p></div>`; nextBtn(d).then(res); } }
      else { tries++; sfx('wrong'); a.flash(i, false); toast('순서가 달라요! 처음부터 다시'); next = 1; $('.nx', d).textContent = '다음: 1번째'; order.forEach((m, j) => a.label(j, `<img src="img/straw${m}.webp" alt="">${caps[m - 1]}`)); setTimeout(() => a.home(), 600); }
    } });
  });
}

/* ---- 연결 고리 + 빈칸(실험관찰 ③): 낱말 발판 밟기 ---- */
async function linkChain() {
  await quiz({ tag: '연결 고리를 찾아라!', q: '바다거북은 <span class="hl2">해파리</span>를 먹고, 해파리는 <span class="hl2">물고기 알과 새끼</span>를 먹어요. <b>바다거북이 사라지면 해파리는?</b>',
    img: 'img/jelly.webp', opts: ['해파리가 많아질 수 있어요', '해파리가 적어질 수 있어요'], ans: 0, hint: '해파리를 먹던 동물이 사라지면 해파리를 잡아먹는 동물이 줄어요. 그러면?',
    explain: `<div class="grid g4">${[['img/turtle.webp', '바다거북이 줄어요'], ['img/sp_jelly.webp', '해파리가 많아져요'], ['img/straw6.webp', '물고기 알·새끼가 줄어요'], ['img/bird.webp', '바닷새와 사람도 곤란해요']].map(([im, t], i) => `<div class="chip" style="cursor:default;animation:rise .4s ${i * .35}s both"><img src="${im}" style="height:70px;max-width:100%;object-fit:contain;border-radius:12px;display:block;margin:0 auto 6px">${t}${i < 3 ? ' →' : ''}</div>`).join('')}</div><p class="big" style="margin-top:12px">한 생물에게 일어난 일이 <b>도미노처럼</b> 다른 생물에게 이어져요.</p>` });
  return new Promise(async res => {
    const bank = shuffle(['플라스틱', '생태계', '해파리', '종이', '바다거북만']); const ans = ['플라스틱', '생태계']; let fill = [];
    const d = scene(`<div class="card paper" style="padding:16px 18px"><div class="title-tag gold">실험관찰 ③</div>
      <p class="big jua" style="font-size:clamp(20px,2.6vw,27px);line-height:1.9;margin:4px 0 8px">바다거북을 살리기 위해 <span class="b0 chip" style="cursor:default;min-width:110px;display:inline-block">?</span> 사용을 줄이면 다른 생물과 <span class="b1 chip" style="cursor:default;min-width:110px;display:inline-block">?</span>를 보전하는 데에도 도움이 돼요.</p>
      ${stageHTML('min(46vh,400px)')}<p class="hint">빈칸에 들어갈 낱말 발판을 순서대로 밟아요. 완성한 문장은 실험관찰 27쪽 ③번에 옮겨 써요.</p><div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res();
    const show = () => [0, 1].forEach(i => $('.b' + i, d).textContent = fill[i] || '?');
    W.zoneStage($('.zst', d), { sfx, zones: bank.map(w => ({ html: w })), onEnter: (i, a) => {
      fill.push(bank[i]); show(); sfx('place');
      if (fill.length === 2) {
        if (fill[0] === ans[0] && fill[1] === ans[1]) { a.lock(true); sfx('correct'); confetti(70); addLeaves(25); S.notes.n3 = '바다거북을 살리기 위해 플라스틱 사용을 줄이면 다른 생물과 생태계를 보전하는 데에도 도움이 된다.'; save(); nextBtn(d, '미션 완료! ▶', 'sun big').then(res); }
        else { sfx('wrong'); toast('다시 해 볼까요?'); setTimeout(() => { fill = []; show(); a.home(); }, 800); }
      } else setTimeout(() => a.home(), 400);
    } });
  });
}

/* ---- 짝 맞추기: 장치마다 알맞은 설명 발판으로 ---- */
function matchGame() {
  const L = ['물고기가 다니는 길', '투명한 벽의 무늬 스티커', '생태계 보호 구역', '물고기를 잡지 못하는 기간'];
  const R = ['둑에 막힌 물고기가 오르내릴 수 있게 해요', '투명한 벽을 못 보고 부딪히는 새를 지켜요', '생물이 사는 곳을 통째로 지켜요 (한려해상 국립공원)', '물고기가 알을 낳고 새끼가 자라는 때를 지켜요'];
  return new Promise(async res => {
    const order = shuffle([0, 1, 2, 3]); let k = 0, miss = 0;
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag forest">짝 맞추기</div>
      <div class="qrow"><img class="qimg" src="img/textbook53.webp" style="width:220px;object-fit:contain;background:#fff" alt=""><h2 class="q qq"></h2></div>${stageHTML()}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res();
    const ask = () => { $('.qq', d).innerHTML = `<span class="jua" style="color:#ff8c7a">${k + 1}/4</span> <b>"${L[k]}"</b>은(는) 누구를, 어떻게 지켜 줄까요?`; };
    ask();
    W.zoneStage($('.zst', d), { sfx, zones: order.map(j => ({ html: R[j] })), onEnter: (i, a) => {
      if (order[i] === k) { sfx('correct', .6); a.flash(i, true); a.remove(i); k++; addLeaves(miss ? 5 : 8);
        if (k === 4) { a.lock(true); confetti(80); $('.fb', d).innerHTML = `<p class="big" style="text-align:center">국가와 사회는 생물이 <b>이동하고, 쉬고, 새끼를 낳을 수 있게</b> 도와요!</p>`; nextBtn(d).then(res); } else { ask(); setTimeout(() => a.home(), 500); } }
      else { miss++; sfx('wrong'); a.flash(i, false); setTimeout(() => a.home(), 600); }
    } });
  });
}

/* ---- 누구의 노력일까? 두 바구니 중 걸어가기 ---- */
function sortGame() {
  const items = shuffle([['물 아껴 쓰기', 0], ['냉난방 온도 지켜 에너지 아끼기', 0], ['음식 남기지 않기', 0], ['생태통로 만들기', 1], ['걷기·자전거·대중교통 이용', 0], ['생태계 보호 구역 정하기', 1], ['친환경 비누·세제 쓰기', 0], ['물고기 잡지 않는 기간 정하기', 1], ['나라끼리 오염 줄이기 약속', 1], ['일회용품 줄이고 분리배출', 0]]);
  return new Promise(async res => {
    let q = items.slice(), wrong = 0; const total = items.length, got = { 0: [], 1: [] };
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag gold">실험관찰 · 조사해요</div><h2 class="q" style="margin:4px 0 6px">카드를 들고 알맞은 곳으로 걸어가요!</h2>
      <div class="tbar"><i class="pb" style="width:0%"></i></div><div class="sortcard" style="margin:10px auto">?</div>${stageHTML('min(44vh,400px)')}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res(); const card = $('.sortcard', d);
    const show = () => { if (!q.length) return; card.textContent = q[0][0]; card.animate([{ transform: 'translateY(-20px) scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300 }); };
    W.zoneStage($('.zst', d), { sfx, zones: [{ html: '<img src="img/i_me.webp" style="object-fit:contain" alt="">나·우리의 노력', color: 0x7fd3c7 }, { html: '<img src="img/i_gov.webp" style="object-fit:contain" alt="">국가·사회의 노력', color: 0x9fdc8a }], onEnter: (i, a) => {
      const [t, k] = q[0];
      if (i === k) { got[k].push(t); q.shift(); sfx('correct', .5); a.flash(i, true); $('.pb', d).style.width = ((total - q.length) / total * 100) + '%';
        if (!q.length) { a.lock(true); confetti(120); addLeaves(Math.max(10, 50 - wrong * 5)); S.notes.sort = got; save();
          $('.fb', d).innerHTML = `<div class="card paper" style="margin-top:12px"><div class="row"><div class="col"><h3 class="jua hl2" style="font-size:22px">나·우리의 노력</h3><p class="big">${got[0].join('<br>')}</p></div><div class="col"><h3 class="jua hl3" style="font-size:22px">국가·사회의 노력</h3><p class="big">${got[1].join('<br>')}</p></div></div><p class="hint">실험관찰 27쪽 "조사해요"에 두 가지씩 옮겨 써요</p></div>`; nextBtn(d, '미션 완료! ▶', 'sun big').then(res); return; }
        show(); }
      else { wrong++; sfx('wrong'); a.flash(i, false); q.push(q.shift()); toast(k ? '나라·지역이 정하는 일이에요!' : '나도 할 수 있는 일이에요!'); show(); }
      setTimeout(() => a.home(), 450);
    } });
    show();
  });
}

/* ---- OX: O 구역 / X 구역으로 달려가기 ---- */
function oxRound() {
  const Q = [['생태계 보전을 위해 우리가 할 수 있는 노력에는 에너지 절약, 일회용품 줄이기, 분리배출, 대중교통 이용 등이 있어요.', 'O', '모두 우리가 생활 속에서 할 수 있는 노력이에요.'],
    ['생태통로는 사람이 산책하라고 만든 다리예요.', 'X', '생태통로는 끊어진 서식지를 이어서 동물이 안전하게 지나가게 하는 길이에요.'],
    ['국가나 사회는 생태계 보호 구역이나 보호 기간을 정해서 생물을 지켜요.', 'O', '한려해상 국립공원 같은 보호 구역, 물고기를 잡지 못하는 기간이 예예요.'],
    ['분리배출만 잘하면 일회용 플라스틱을 마음껏 써도 괜찮아요.', 'X', '분리배출도 필요하지만, 가장 힘센 방법은 처음부터 줄이는 거예요.'],
    ['바다거북을 살리려고 플라스틱 사용을 줄이면 다른 생물과 생태계를 보전하는 데에도 도움이 돼요.', 'O', '생물은 먹이 관계로 연결되어 있어서 한 생물을 지키면 생태계 전체를 지켜요.']];
  return new Promise(async res => {
    let q = Q.map((x, i) => [...x, i]), first = new Set(), combo = 0, solved = 0, tmr = null, busy = false;
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag gold">달려라 OX 퀴즈</div><div style="display:flex;justify-content:space-between" class="jua"><span class="qn" style="font-size:22px"></span><span class="cb" style="font-size:22px;color:#ff8c7a"></span></div>
      <div class="tbar"><i class="tb"></i></div><h2 class="q qq" style="min-height:2.6em;text-align:center;margin:8px 0"></h2>${stageHTML('min(44vh,400px)')}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res(); let api;
    const show = () => { if (!q.length) return; busy = false; const [t] = q[0]; $('.qq', d).textContent = t; $('.qn', d).textContent = `${solved + 1} / 5`; $('.cb', d).textContent = combo >= 2 ? `${combo} 콤보!` : ''; $('.fb', d).innerHTML = '';
      const tb = $('.tb', d); tb.style.transition = 'none'; tb.style.width = '100%'; void tb.offsetWidth; tb.style.transition = 'width 15s linear'; tb.style.width = '0%'; clearTimeout(tmr); tmr = setTimeout(() => answer(null), 15000); if (api) api.home(); };
    const answer = (a) => { if (busy) return; busy = true; clearTimeout(tmr); const [t, ans, ex, id] = q[0];
      if (a === ans) { combo++; solved++; q.shift(); sfx(combo >= 2 ? 'combo' : 'correct', .6); if (!first.has(id)) addLeaves(20); confetti(40); $('.fb', d).innerHTML = `<p class="big" style="text-align:center;color:#4f9b52"><b>정답!</b> ${ex}</p>`;
        if (!q.length) { api.lock(true); setTimeout(() => { confetti(120); $('.fb', d).innerHTML = `<p class="big" style="text-align:center"><b>5문제를 모두 통과했어요!</b></p>`; nextBtn(d, '마지막 열쇠 받기 ▶', 'sun big').then(res); }, 1500); return; }
        setTimeout(show, 2000); }
      else { combo = 0; first.add(id); q.push(q.shift()); sfx('wrong'); $('.fb', d).innerHTML = `<p class="big" style="text-align:center;color:#e26a5a">${a === null ? '시간 초과!' : '아쉬워요!'} 정답은 <b>${ans}</b>. ${ex}<br><small>이 문제는 마지막에 한 번 더 나와요.</small></p>`; setTimeout(show, 3200); } };
    api = W.zoneStage($('.zst', d), { sfx, zones: [{ html: '<span style="font-size:44px;color:#27978a">O</span>', color: 0x7fd3c7 }, { html: '<span style="font-size:44px;color:#e0453a">X</span>', color: 0xff9f8f }], onEnter: (i, a) => { a.flash(i, ['O', 'X'][i] === q[0][1]); answer(['O', 'X'][i]); } });
    show();
  });
}

/* ---- 비밀 금고: 글자 발판을 순서대로 ---- */
function vault() {
  const SEQ = ['생', '태', '계'], KEYS = shuffle(['계', '숲', '생', '물', '태', '환']);
  return new Promise(async res => {
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag gold">비밀 금고를 열어라!</div>
      <div class="qrow"><img class="qimg vimg" src="img/vault.webp" alt=""><div><p class="big" style="margin:0">모은 열쇠 글자 3개를 <b>미션 순서대로</b> 밟아요!</p><div class="slots" style="justify-content:flex-start;margin:8px 0 0"><i></i><i></i><i></i></div></div></div>${stageHTML()}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res(); let st = 0; const slots = $$('.slots i', d);
    W.zoneStage($('.zst', d), { sfx, zones: KEYS.map(k => ({ html: `<span style="font-size:40px">${k}</span>` })), onEnter: async (i, a) => {
      if (KEYS[i] === SEQ[st]) { sfx('place'); a.flash(i, true); slots[st].textContent = SEQ[st]; slots[st].classList.add('on'); st++; setTimeout(() => a.home(), 450);
        if (st === 3) { a.lock(true); bgm(null); sfx('unlock', .9); $('.vimg', d).animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15) rotate(-4deg)', filter: 'brightness(1.6)' }, { transform: 'scale(1)' }], { duration: 2000 }); await sleep(2100); confetti(200); addLeaves(50);
          $('.fb', d).innerHTML = `<div class="card" style="margin-top:14px;text-align:center"><div class="title-tag coral">금고가 열렸어요!</div><div class="jua" style="font-size:clamp(56px,9vw,100px);color:#4f9b52;animation:pop .8s">생태계</div><p class="big jua" style="font-size:24px">일회용품의 사용을 줄이면 <span class="hl">생태계</span>를 보전하는 데 도움이 됩니다.</p><p class="hint">교과서 53쪽 "한눈에 쏙 생각이 쑥" 1번 정답!</p></div>`; nextBtn(d, '나의 약속 정하기 ▶', 'sun big').then(res); } }
      else { sfx('beep'); a.flash(i, false); st = 0; slots.forEach(s => { s.textContent = ''; s.classList.remove('on'); }); toast('삐빅! 미션 1 → 2 → 3 순서로!'); setTimeout(() => a.home(), 600); }
    } });
  });
}

/* ---- 분리배출: 준비대에서 준비하고 알맞은 통으로 걸어가기 ---- */
function recycle() {
  const list = (S.trash && S.trash.length ? S.trash : ['pet', 'can', 'vinyl', 'mask', 'straw', 'line', 'glass', 'paper', 'snack']);
  const q = shuffle([...new Set(list)]);
  return new Promise(async res => {
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag gold">분리배출 체험</div>
      <h2 class="q" style="margin:4px 0 6px">주운 쓰레기를 들고 <span class="hl2">준비대</span>에서 준비한 뒤, 알맞은 통으로 걸어가요!</h2><div class="tbar"><i class="pb" style="width:0%"></i></div>
      <div class="carry" style="margin-top:10px"><img class="ci" alt=""><div><div class="jua cn" style="font-size:24px"></div><div class="st"></div></div></div>${stageHTML('min(50vh,440px)')}<div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res();
    let i = 0, ready = false, prepping = false, wrong = 0;
    const show = () => { const t = TRASH[q[i]]; $('.ci', d).src = `img/${t.img}.webp`; $('.cn', d).textContent = t.name; ready = t.prep.length === 0; $('.st', d).innerHTML = ready ? '<span style="color:#4f9b52">준비할 것 없음 → 바로 통으로!</span>' : `준비할 것: <b>${t.prep.join(' → ')}</b> (준비대로!)`; $('.ci', d).animate([{ transform: 'scale(.4)' }, { transform: 'scale(1)' }], { duration: 300 }); };
    const zones = [{ html: '<b>준비대</b>', color: 0xffd25a, table: true }, ...BINS.map(([k, n, c]) => ({ html: n, color: parseInt(c.slice(1), 16), bin: true }))];
    W.zoneStage($('.zst', d), { sfx, zones, onEnter: async (z, a) => {
      if (i >= q.length || prepping) return; const t = TRASH[q[i]];
      if (z === 0) { if (ready) { toast('이미 준비됐어요! 알맞은 통으로 가요'); setTimeout(() => a.home(), 400); return; }
        prepping = true; a.lock(true);
        for (const p of t.prep) { $('.st', d).innerHTML = `<b style="color:#c9820a">${p} 하는 중… 뚝딱뚝딱</b>`; sfx('place'); $('.ci', d).animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg) scale(.95)' }, { transform: 'rotate(10deg) scale(.9)' }, { transform: 'rotate(0) scale(1)' }], { duration: 800 }); await sleep(900); }
        ready = true; prepping = false; a.lock(false); $('.st', d).innerHTML = `<span style="color:#4f9b52">준비 끝! (${t.prep.join(', ')})</span> → 이제 알맞은 통으로!`; sfx('correct', .4); return; }
      const bin = BINS[z - 1][0];
      if (!ready) { sfx('wrong', .5); a.flash(z, false); toast('먼저 준비대에서 준비해요!'); setTimeout(() => a.home(), 500); return; }
      if (bin === t.bin) { sfx('correct', .6); a.flash(z, true); addLeaves(10); $('.fb', d).innerHTML = `<p class="big" style="text-align:center;color:#4f9b52"><b>정답!</b> ${t.tip}</p>`; i++; $('.pb', d).style.width = (i / q.length * 100) + '%';
        if (i >= q.length) { a.lock(true); confetti(140); addLeaves(Math.max(10, 40 - wrong * 5));
          $('.fb', d).innerHTML = `<div class="card paper" style="margin-top:10px"><div class="title-tag gold">분리배출 완료!</div><p class="big">그런데 <b>빨대·마스크·낚싯줄</b>은 결국 <span class="hl">일반쓰레기</span>가 되어 태우거나 묻어야 해요. 분리배출도 중요하지만, <b>처음부터 쓰레기를 만들지 않는 것</b>이 가장 좋아요. 그 연습을 하러 <b>카페</b>로 가요!</p></div>`; nextBtn(d, '카페로 가기 ▶', 'sun big').then(res); return; }
        setTimeout(() => { show(); a.home(); }, 1300); }
      else { wrong++; sfx('wrong'); a.flash(z, false); $('.fb', d).innerHTML = `<p class="big" style="text-align:center;color:#e26a5a">음… 다른 통이에요. 힌트: ${t.tip}</p>`; setTimeout(() => a.home(), 600); }
    } });
    show();
  });
}

/* ---- 카페: 내 대답 발판으로 걸어가기 ---- */
function cafe() {
  const steps = [
    { q: '어서 와요! 무엇을 마실래요?', opts: () => [['시원한 초코 우유', 0], ['상큼한 딸기 주스', 0]] },
    { q: '여기서 마시고 가요, 가지고 가요?', opts: () => [['가지고 갈래요', 0], ['여기서 마실래요', 0]] },
    { q: st => st[1] === 1 ? '일회용 컵에 드릴까요, 머그잔에 드릴까요?' : '일회용 컵에 담아 드릴까요?', opts: st => st[1] === 1 ? [['일회용 컵이요', -1], ['머그잔에 주세요', 1, '머그잔 쓰기']] : [['네, 일회용 컵이요', -1], ['제 텀블러에 담아 주세요!', 1, '텀블러 쓰기']], item: 'cup' },
    { q: '빨대 꽂아 드릴까요?', opts: () => [['네, 주세요', -1], ['빨대는 빼 주세요!', 1, '빨대 안 받기']], item: 'straw' },
    { q: '비닐봉투에 담아 드릴까요?', opts: () => [['네, 담아 주세요', -1], ['손에 들고 갈게요', 1, '비닐봉투 안 받기']], item: 'bag' },
    { q: '물티슈랑 냅킨도 넉넉히 넣어 드릴게요~', opts: () => [['네, 주세요', -1], ['손수건 있어요!', 1, '물티슈 안 받기']], item: 'tissue' },
  ];
  const nudge = { cup: '일회용 컵 하나는 약 20g의 플라스틱이에요. 모두가 하루 한 개씩만 줄여도 가정 폐플라스틱이 10% 줄어요!', straw: '빨대는 너무 작아서 재활용도 안 돼요. 바다로 가면 꼬북이 친구 코에 꽂힐 수도 있어요…', bag: '비닐봉지는 물속에서 해파리처럼 보여서 바다거북이 먹어요…', tissue: '물티슈는 플라스틱 섬유로 만들어져서 잘 썩지 않아요.' };
  const icon = { cup: 'img/c_cup.webp', straw: 'img/t_straw.webp', bag: 'img/t_vinyl.webp', tissue: 'img/t_paper.webp' };
  return new Promise(async res => {
    const st = [], refused = []; let k = 0, nudging = false;
    const d = scene(`<div class="card" style="padding:16px 18px"><div class="title-tag coral">카페 체험</div>
      <div class="owlrow"><img src="img/c_owl.webp" alt=""><div class="bubble" style="min-height:0;flex:1;padding:18px 22px"><span class="nm" style="background:#8f6440">부엉 사장님</span><div class="tx cq" style="font-size:22px"></div></div>
      <div class="cafe-meter" style="position:static"><span class="jua">줄인 일회용품</span><b class="saved">0</b></div></div>
      <div class="stage3d zst" style="height:min(46vh,400px);background-image:url(img/c_cafe.webp);background-size:cover"></div>${MOVE_HINT}<div class="tray-items" style="max-width:none;justify-content:center;margin-top:8px"></div><div class="fb"></div></div>`);
    const W = await wk(); if (!W) return res();
    const tray = $('.tray-items', d);
    const addTray = (src, label, off) => { const el = document.createElement('div'); el.className = 'ti' + (off ? ' off' : ''); el.innerHTML = `<img src="${src}"><span>${label}</span>`; tray.appendChild(el); };
    const typeQ = text => { const el = $('.cq', d); el.textContent = ''; let n = 0; const tm = setInterval(() => { n++; el.textContent = text.slice(0, n); if (n % 2 === 0) blip(); if (n >= text.length) clearInterval(tm); }, 30); };
    let api;
    const step = () => {
      if (k >= steps.length) return end();
      const s = steps[k]; typeQ(typeof s.q === 'function' ? s.q(st) : s.q); const opts = s.opts(st);
      api.set(opts.map(([t], i) => ({ html: t, color: i ? 0x9fdc8a : 0xffc9a8 })));
    };
    api = W.zoneStage($('.zst', d), { sfx, theme: 'cafe', zones: [], onEnter: (i, a) => {
      if (nudging) { nudging = false; const s = steps[k]; if (i === 0) { st[k] = 0; addTray(icon[s.item], '받음', false); k++; } step(); return; }
      const s = steps[k]; const [t, v, lab] = s.opts(st)[i];
      if (v === -1 && s.item && !s.nudged) { s.nudged = true; nudging = true; typeQ('(꼬북이 생각) ' + nudge[s.item]); a.set([{ html: '그래도 받을래요', color: 0xffc9a8 }, { html: '다시 고를래요', color: 0x9fdc8a }]); return; }
      st[k] = i;
      if (v === 1) { refused.push(lab); sfx('correct', .5); addLeaves(10); $('.saved', d).textContent = refused.length; confetti(30, 'leaf'); addTray(s.item === 'cup' ? 'img/c_tumbler.webp' : icon[s.item], lab, s.item !== 'cup'); }
      k++; setTimeout(step, 350);
    } });
    function end() {
      S.choices = refused.slice(); save(); const n = refused.length; api.lock(true);
      typeQ(n >= 3 ? '와, 오늘 손님 덕분에 바다가 웃겠어요! 또 오세요~' : '주문 완료! 다음엔 일회용품을 조금 더 줄여 볼까요?');
      $('.fb', d).innerHTML = `<div class="card paper" style="margin-top:10px"><p class="big">내가 거절한 일회용품: <b class="hl3">${n ? refused.join(', ') : '없음'}</b> (${n}개)</p><p class="big"><b>"빼 주세요", "제 컵에 주세요"</b>라고 말하는 것이 진짜 실천이에요. 이 실천이 바다를 얼마나 바꾸는지 꼬북이와 확인해 봐요!</p></div>`;
      sfx(n >= 3 ? 'clear' : 'key', .6); if (n >= 3) confetti(120, 'leaf'); nextBtn(d, '다음 ▶', 'sun big').then(res);
    }
    step();
  });
}
