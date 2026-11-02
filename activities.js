/* 체험 활동: 바닷가 대청소 · 분리배출 · 카페 체험 · 생태통로 짓기 · 산양 울타리 (game.js 이후 로드) */
'use strict';
let VX = null;
async function vox() { if (VX !== null) return VX; try { VX = await import('./walk.js'); } catch (e) { console.warn(e); VX = false; } return VX; }

const TRASH = {
  pet: { name: '투명 페트병', img: 't_pet', bin: 'pet', prep: ['라벨 떼기', '꾹 찌그러뜨리기'], tip: '라벨(비닐)을 떼고, 납작하게 찌그러뜨려 뚜껑을 닫아 투명 페트병 칸에!' },
  can: { name: '음료수 캔', img: 't_can', bin: 'can', prep: ['남은 음료 비우기'], tip: '안을 비우고 헹궈서 캔 칸에!' },
  glass: { name: '유리병', img: 't_glass', bin: 'glass', prep: ['뚜껑 빼고 헹구기'], tip: '뚜껑은 따로, 병은 헹궈서 유리병 칸에!' },
  paper: { name: '과자 상자', img: 't_paper', bin: 'paper', prep: ['테이프 떼고 펴기'], tip: '테이프를 떼고 납작하게 펴서 종이 칸에!' },
  vinyl: { name: '비닐봉지', img: 't_vinyl', bin: 'vinyl', prep: ['모래 털기'], tip: '이물질을 털어서 비닐 칸에!' },
  snack: { name: '과자 봉지', img: 't_snack', bin: 'vinyl', prep: ['부스러기 털기'], tip: '과자 봉지도 비닐류예요. 털어서 비닐 칸에!' },
  mask: { name: '마스크', img: 't_mask', bin: 'general', prep: ['끈 자르기'], tip: '마스크는 재활용이 안 돼요. 동물이 걸리지 않게 끈을 잘라 일반쓰레기로!' },
  straw: { name: '빨대', img: 't_straw', bin: 'general', prep: [], tip: '빨대는 너무 작아서 재활용이 어려워요. 일반쓰레기로! 그래서 처음부터 안 받는 게 최고예요.' },
  line: { name: '낚싯줄', img: 't_line', bin: 'general', prep: ['바늘 조심! 둘둘 감기'], tip: '낚싯줄은 재활용이 어려워요. 둘둘 감아 일반쓰레기로!' },
};
const BINS = [['pet', '투명 페트병', '#7fc8ff'], ['can', '캔', '#c9ced8'], ['glass', '유리병', '#c99a6b'], ['paper', '종이', '#e8c27a'], ['vinyl', '비닐', '#f3a6c8'], ['general', '일반쓰레기', '#a9a19a']];

/* ---------------- 바닷가 대청소 (3D) ---------------- */
async function beach() {
  const M = await vox();
  return new Promise(res => {
    const d = scene(`<div class="card" style="padding:16px"><div class="title-tag coral">바닷가 대청소</div>
      <h2 class="q" style="margin:4px 0 10px">구조대원을 움직여 바닷가 쓰레기를 모두 주워요! 그물에 걸린 꼬북이 친구 옆에 서 있으면 그물을 잘라 줘요.</h2><p class="hint" style="margin:0 0 8px">방향키(↑↓←→)를 누르거나, 화면을 누른 채 끌면 움직여요.</p>
      <div class="stage3d" style="height:min(60vh,520px)"><div class="badge3d">주운 쓰레기 <b class="cnt">0</b> / 12 · 그물 <b class="net">풀어 주기 전</b></div></div><div class="fb"></div></div>`);
    S.trash = [];
    const fin = () => { confetti(120, 'leaf'); addLeaves(40); save();
      $('.fb', d).innerHTML = `<p class="big" style="text-align:center">바닷가가 깨끗해졌어요! 우리나라 바다 동물이 가장 많이 걸린 쓰레기는 <b>낚싯줄·낚싯바늘(65.2%)</b>이었대요. 주운 쓰레기는 그냥 버리면 안 돼요. <b>분리배출</b>하러 가요!</p><div class="src">출처: 한국해양과학기술원 연구(77종 428마리, 2003~2023) – 경향신문(2025.3.11)</div><div class="next-row">${btn('분리배출하러 가기 ▶', 'sun big')}</div>`; waitClick($('.fb .btn', d)).then(res); };
    if (!M) { S.trash = ['pet', 'can', 'vinyl', 'mask', 'straw', 'line', 'glass', 'paper', 'snack', 'pet', 'can', 'vinyl']; fin(); return; }
    M.beachWalk($('.stage3d', d), { sfx, onPick: (k, n) => { S.trash.push(k); $('.cnt', d).textContent = n; toast(TRASH[k].name + ' 주웠어요!'); },
      onTurtleFree: () => { $('.net', d).textContent = '풀어 줬어요!'; toast('꼬북이 친구가 바다로 돌아갔어요!'); }, onAllDone: fin });
  });
}

/* ---------------- 분리배출 체험 ---------------- */
function recycle() {
  const list = (S.trash && S.trash.length ? S.trash : ['pet', 'can', 'vinyl', 'mask', 'straw', 'line', 'glass', 'paper', 'snack']).slice();
  const q = shuffle([...new Set(list)]).map(k => k); // 종류별 1개씩
  return new Promise(res => {
    const d = scene(`<div class="card"><div class="title-tag gold">분리배출 체험</div>
      <h2 class="q" style="margin:4px 0 8px">주운 쓰레기를 <span class="hl2">준비</span>하고 알맞은 통에 넣어요!</h2>
      <div class="tbar"><i class="pb" style="width:0%"></i></div>
      <div class="rc-wrap"><div class="rc-item"><img class="rc-img" alt=""><div class="rc-name jua"></div><div class="rc-prep"></div></div></div>
      <div class="rc-bins">${BINS.map(([k, n, c]) => `<button class="rc-bin" data-k="${k}" style="--c:${c}"><span class="lid"></span><b>${n}</b></button>`).join('')}</div>
      <div class="fb"></div></div>`);
    let i = 0, ready = false, wrong = 0;
    const img = $('.rc-img', d), nm = $('.rc-name', d), prep = $('.rc-prep', d), bins = $$('.rc-bin', d);
    function show() {
      if (i >= q.length) return end();
      const t = TRASH[q[i]]; img.src = `img/${t.img}.webp`; nm.textContent = t.name; img.style.transform = ''; img.style.filter = '';
      img.animate([{ transform: 'translateY(-40px) scale(.6)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 350, easing: 'cubic-bezier(.2,1.4,.4,1)' });
      ready = t.prep.length === 0; bins.forEach(b => b.classList.toggle('off', !ready));
      prep.innerHTML = t.prep.length ? t.prep.map((p, j) => `<button class="btn ${j ? 'ghost' : 'coral'} pp" data-j="${j}" ${j ? 'disabled' : ''}>${p}</button>`).join('') : '<p class="hint">준비할 것이 없어요. 바로 통을 골라요!</p>';
      $$('.pp', d).forEach(b => b.onclick = () => {
        const j = +b.dataset.j; sfx('place'); b.disabled = true; b.classList.add('done-pp'); b.textContent = '✓ ' + b.textContent;
        const fx = t.prep[j]; img.animate(fx.includes('찌그') ? [{ transform: 'scale(1)' }, { transform: 'scaleY(.55) scaleX(1.15)' }, { transform: 'scaleY(.7) scaleX(1.05)' }] : fx.includes('자르') ? [{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(-14px) rotate(-6deg)' }, { transform: 'translateX(14px) rotate(6deg)' }, { transform: 'translateX(0)' }], { duration: 500, fill: 'forwards' });
        const nb = $(`.pp[data-j="${j + 1}"]`, d); if (nb) { nb.disabled = false; nb.classList.replace('ghost', 'coral'); }
        else { ready = true; bins.forEach(x => x.classList.remove('off')); toast('준비 끝! 알맞은 통을 골라요'); }
      });
    }
    bins.forEach(b => b.onclick = () => {
      if (i >= q.length) return;
      const t = TRASH[q[i]];
      if (!ready) { sfx('wrong', .4); toast('먼저 준비 버튼을 눌러요!'); return; }
      if (b.dataset.k === t.bin) {
        sfx('correct', .6); addLeaves(10); b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 300 });
        const r1 = img.getBoundingClientRect(), r2 = b.getBoundingClientRect();
        img.animate([{ transform: 'none' }, { transform: `translate(${r2.left + r2.width / 2 - (r1.left + r1.width / 2)}px,${r2.top - r1.top}px) scale(.2) rotate(30deg)`, opacity: .2 }], { duration: 450, fill: 'forwards' });
        $('.fb', d).innerHTML = `<p class="big" style="text-align:center;color:#4f9b52"><b>정답!</b> ${t.tip}</p>`;
        i++; $('.pb', d).style.width = (i / q.length * 100) + '%'; setTimeout(show, 1500);
      } else { wrong++; sfx('wrong'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450); $('.fb', d).innerHTML = `<p class="big" style="text-align:center;color:#e26a5a">음… 다른 통이에요. 힌트: ${t.tip}</p>`; }
    });
    function end() {
      confetti(140); addLeaves(Math.max(10, 40 - wrong * 5));
      d.querySelector('.card').innerHTML = `<div class="title-tag gold">분리배출 완료!</div><h2 class="q">분리배출 달인이 되었어요!</h2>
        <p class="big">그런데 <b>빨대·마스크·낚싯줄</b>은 결국 <span class="hl">일반쓰레기</span>가 되어 태우거나 묻어야 해요. 분리배출도 중요하지만, <b>처음부터 쓰레기를 만들지 않는 것</b>이 가장 좋아요.</p>
        <p class="big">그럼 진짜로 일회용품을 안 받는 연습을 해 볼까요? <b>카페</b>로 가요!</p>`;
      d.insertAdjacentHTML('beforeend', `<div class="next-row">${btn('카페로 가기 ▶', 'sun big')}</div>`); waitClick($('.next-row .btn', d)).then(res);
    }
    show();
  });
}

/* ---------------- 카페 체험 (빨대·일회용품 거절하기) ---------------- */
function cafe() {
  const steps = [
    { q: '어서 와요! 무엇을 마실래요?', opts: [['시원한 초코 우유', 0], ['상큼한 딸기 주스', 0]] },
    { q: '여기서 마시고 가요, 가지고 가요?', opts: [['가지고 갈래요', 0], ['여기서 마실래요', 0]] },
    { q: (st) => st[1] === 1 ? '그럼 일회용 컵에 드릴까요, 머그잔에 드릴까요?' : '일회용 컵에 담아 드릴까요?', opts: (st) => st[1] === 1 ? [['일회용 컵이요', -1], ['머그잔에 주세요', 1, '머그잔']] : [['네, 일회용 컵이요', -1], ['제 텀블러에 담아 주세요!', 1, '텀블러']], item: 'cup' },
    { q: '빨대 꽂아 드릴까요?', opts: [['네, 주세요', -1], ['괜찮아요, 빨대는 빼 주세요!', 1, '빨대 안 받기']], item: 'straw' },
    { q: '비닐봉투에 담아 드릴까요?', opts: [['네, 담아 주세요', -1], ['손에 들고 갈게요 / 장바구니 있어요', 1, '비닐봉투 안 받기']], item: 'bag' },
    { q: '물티슈랑 냅킨도 넉넉히 넣어 드릴게요~', opts: [['네, 주세요', -1], ['손수건 있어요, 괜찮아요!', 1, '물티슈 안 받기']], item: 'tissue' },
  ];
  const nudge = { cup: '일회용 컵 하나는 약 20g의 플라스틱이에요. 모두가 하루 한 개씩만 줄여도 가정 폐플라스틱이 10% 줄어요!', straw: '빨대는 너무 작아서 재활용도 안 돼요. 바다로 가면 꼬북이 친구 코에 꽂힐 수도 있어요…', bag: '비닐봉지는 물속에서 해파리처럼 보여서 바다거북이 먹어요…', tissue: '물티슈는 플라스틱 섬유로 만들어져서 잘 썩지 않아요.' };
  return new Promise(res => {
    const st = [], refused = [];
    const d = scene(`<div class="card" style="padding:16px"><div class="title-tag coral">카페 체험</div>
      <div class="cafe"><img class="cafe-bg" src="img/c_cafe.webp" alt=""><img class="cafe-owl" src="img/c_owl.webp" alt="">
      <div class="cafe-tray"><span class="jua">내 쟁반</span><div class="tray-items"></div></div>
      <div class="cafe-meter"><span class="jua">줄인 일회용품</span><b class="saved">0</b></div></div>
      <div class="talk" style="cursor:default;margin-top:12px"><div class="bubble" style="min-height:0"><span class="nm" style="background:#8f6440">부엉 사장님</span><div class="tx cq"></div></div></div>
      <div class="opts cafe-opts" style="margin-top:12px"></div></div>`);
    const tray = $('.tray-items', d);
    const addTray = (src, label, off) => { const el = document.createElement('div'); el.className = 'ti' + (off ? ' off' : ''); el.innerHTML = `<img src="${src}"><span>${label}</span>`; tray.appendChild(el); el.animate([{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,1.4,.4,1)' }); };
    let k = 0;
    function typeQ(text) { const el = $('.cq', d); el.textContent = ''; let n = 0; const tm = setInterval(() => { n++; el.textContent = text.slice(0, n); if (n % 2 === 0) blip(); if (n >= text.length) clearInterval(tm); }, 32); }
    function step() {
      if (k >= steps.length) return end();
      const s = steps[k]; const q = typeof s.q === 'function' ? s.q(st) : s.q; const opts = typeof s.opts === 'function' ? s.opts(st) : s.opts;
      typeQ(q); const box = $('.cafe-opts', d);
      box.innerHTML = opts.map(([t], i) => `<button class="opt" data-i="${i}"><span class="l">${'AB'[i]}</span><span>${t}</span></button>`).join('');
      $$('.opt', box).forEach(b => b.onclick = () => {
        const [t, v, lab] = opts[+b.dataset.i]; sfx('click');
        if (v === -1 && s.item && !s.nudged) { // 한 번 더 생각해 보기
          s.nudged = true; box.innerHTML = `<div class="talk" style="cursor:default"><img class="who" style="width:100px" src="img/mascot.webp"><div class="bubble" style="min-height:0;padding:20px 24px"><span class="nm">꼬북이 생각</span><div class="tx" style="font-size:20px">${nudge[s.item]}</div></div></div>
            <div class="next-row"><button class="btn ghost keep">그래도 받을래요</button><button class="btn sun change">다시 고를래요</button></div>`;
          $('.keep', box).onclick = () => { sfx('click'); st[k] = 0; addTray(s.item === 'cup' ? 'img/c_cup.webp' : s.item === 'straw' ? 'img/t_straw.webp' : s.item === 'bag' ? 'img/t_vinyl.webp' : 'img/t_paper.webp', '받음', false); k++; step(); };
          $('.change', box).onclick = () => { sfx('click'); step(); };
          return;
        }
        st[k] = +b.dataset.i;
        if (v === 1) { refused.push(lab); sfx('correct', .5); addLeaves(10); $('.saved', d).textContent = refused.length; confetti(30, 'leaf');
          addTray(s.item === 'cup' ? 'img/c_tumbler.webp' : s.item === 'straw' ? 'img/t_straw.webp' : s.item === 'bag' ? 'img/t_vinyl.webp' : 'img/t_paper.webp', lab, s.item !== 'cup'); }
        k++; setTimeout(step, 450);
      });
    }
    function end() {
      S.choices = refused.slice(); save();
      const n = refused.length;
      $('.cq', d).textContent = n >= 3 ? '와, 오늘 손님 덕분에 바다가 웃겠어요! 또 오세요~' : '주문 완료! 다음엔 일회용품을 조금 더 줄여 볼까요?';
      $('.cafe-opts', d).innerHTML = `<div class="card paper"><p class="big">내가 거절한 일회용품: <b class="hl3">${n ? refused.join(', ') : '없음'}</b> (${n}개)</p>
        <p class="big">이렇게 <b>"빼 주세요", "제 컵에 주세요"</b>라고 말하는 것이 진짜 실천이에요. 이 실천이 바다를 얼마나 바꾸는지 꼬북이와 확인해 봐요!</p></div><div class="next-row">${btn('다음 ▶', 'sun big')}</div>`;
      sfx(n >= 3 ? 'clear' : 'key', .6); if (n >= 3) confetti(120, 'leaf');
      waitClick($('.cafe-opts .btn', d)).then(res);
    }
    step();
  });
}

/* ---------------- 생태통로 짓기 (3D, 뚝딱뚝딱) ---------------- */
async function bridge() {
  const M = await vox();
  return new Promise(res => {
    const d = scene(`<div class="card" style="padding:16px"><div class="title-tag forest">생태통로 짓기</div>
      <h2 class="q stage-t" style="margin:4px 0 10px">구조대원을 움직여 <b>통나무·돌·흙</b>을 모아요! 돌은 길 건너편에 있어요. <span class="hl">차 조심!</span></h2>
      <div class="stage3d" style="height:min(60vh,520px)"><div class="inv"><span class="iv" data-k="wood"><i style="background:#b5835a"></i>통나무 <b>0</b>/<em>10</em></span><span class="iv" data-k="stone"><i style="background:#b9b6ad"></i>돌 <b>0</b>/<em>8</em></span><span class="iv" data-k="soil"><i style="background:#8fd16a"></i>흙 <b>0</b>/<em>10</em></span></div></div>
      <p class="hint" style="text-align:center;margin:8px 0 0">방향키(↑↓←→)를 누르거나 화면을 누른 채 끌면 움직여요. 쓰러진 통나무만 써요. 살아 있는 나무는 베지 않아요!</p><div class="fb"></div></div>`);
    const fin = () => { confetti(160, 'leaf'); addLeaves(60);
      $('.fb', d).innerHTML = `<p class="big" style="text-align:center">내가 지은 <b>생태통로</b>로 동물 친구들이 안전하게 건넜어요! 생태통로는 도로 때문에 끊어진 숲과 숲을 이어 주는 <span class="hl3">동물 전용 길</span>이에요.</p><div class="next-row">${btn('다음 ▶', 'sun big')}</div>`;
      $('.fb', d).scrollIntoView({ behavior: 'smooth', block: 'center' }); waitClick($('.fb .btn', d)).then(res); };
    if (!M) { fin(); return; }
    M.bridgeWalk($('.stage3d', d), { sfx, onHit: () => { S.hits = (S.hits || 0) + 1; },
      onInv: (inv, need) => $$('.iv', d).forEach(el => { const k = el.dataset.k; $('b', el).textContent = inv[k]; el.classList.toggle('full', inv[k] >= need[k]); }),
      onStage: (s, name) => { $('.stage-t', d).innerHTML = s < 3 ? `<span class="hl2">${name}</span> — 초록 동그라미 위에 올라서면 뚝딱뚝딱 지어져요!${s > 0 ? ' <span class="hl">차 조심!</span>' : ''}` : '<span class="hl3">완성!</span> 동물 친구들이 건너가요!'; },
      onDone: fin });
  });
}

/* ---------------- 산양 울타리 (3D) ---------------- */
async function fence() {
  const M = await vox();
  return new Promise(res => {
    const d = scene(`<div class="card" style="padding:16px"><div class="title-tag forest">구조 작전!</div><h2 class="q" style="margin:4px 0 10px">구조대원을 움직여 빨간 동그라미에 서 있으면 울타리가 열려요! 산양의 길을 열어 주세요.</h2>
      <div class="stage3d" style="height:min(56vh,480px)"><div class="badge3d">남은 울타리 <b class="left">3</b></div></div><div class="fb"></div></div>`);
    const done = () => { confetti(80, 'leaf'); addLeaves(20); $('.fb', d).innerHTML = `<p class="big" style="text-align:center">길이 열리자 산양이 먹이가 있는 골짜기로 내려갈 수 있게 됐어요!</p><div class="next-row">${btn('다음 ▶')}</div>`; waitClick($('.fb .btn', d)).then(res); };
    if (M) M.fenceWalk($('.stage3d', d), { sfx, onCut: n => { $('.left', d).textContent = 3 - n; }, onFree: done }); else setTimeout(done, 500);
  });
}
