/* =====================================================================
   ROSE INTRO — màn mở đầu hoa hồng cho ngày 20/10
   1) Cánh hồng nhẹ nhàng bay khắp màn hình, ngày càng nhiều
   2) Hội tụ theo vòng xoáy thành một bông hồng nhìn từ trên xuống
   3) Bông hồng xoay, thu lại thành nhụy rồi nở bung to ra
   4) Phát nổ thành những cánh hồng phấp phới rồi tan biến
   ===================================================================== */
(() => {
    'use strict';

    // ---------- Tuỳ chỉnh nhanh ----------
    const CONFIG = {
        autoMusic: true, // bấm "Mở quà" là nhạc tự phát
    };

    // Mốc thời gian (giây)
    const T = {
        conv: 4.2,        // bắt đầu hội tụ
        convSpread: 3.2,  // thời gian cánh hoa lần lượt bay vào
        convDur: 2.6,     // mỗi cánh bay vào trong bao lâu
    };
    T.roseDone = T.conv + T.convSpread + T.convDur; // ~10.0s: hoa hoàn chỉnh
    T.spin0 = T.roseDone + 0.2;  // bắt đầu xoay & thu thành nhụy
    T.bloom0 = T.spin0 + 2.8;    // bắt đầu nở
    T.burst = T.bloom0 + 2.4;    // phát nổ
    T.text = T.bloom0 - 0.3;     // hiện lời chúc

    const root = document.getElementById('rose-intro');
    if (!root) return;
    const canvas = document.getElementById('rose-intro-canvas');
    const ctx = canvas.getContext('2d');
    const startEl = document.getElementById('rose-intro-start');
    const openBtn = document.getElementById('rose-intro-open');
    const skipBtn = document.getElementById('rose-intro-skip');
    const textEl = document.getElementById('rose-intro-text');

    // ---------- Tiện ích ----------
    const TAU = Math.PI * 2;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const wrapPi = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; };
    const wrapPos = (a) => { a %= TAU; return a < 0 ? a + TAU : a; };
    const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const eOut = (t) => 1 - Math.pow(1 - t, 3);
    const eInQ = (t) => t * t;
    const eOutQ = (t) => 1 - (1 - t) * (1 - t);
    const eBack = (t) => { const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
    const smooth = (v, a, b) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };

    // ---------- Kích thước ----------
    let W, H, dpr, cx, cy, R, Sb, ms;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        cx = W / 2;
        cy = H * 0.45;
        R = Math.min(W * 0.36, H * 0.27);       // bán kính bông hồng lúc hoàn chỉnh
        Sb = Math.min(1.95, (0.5 * Math.min(W, H)) / R); // độ phóng đại lúc nở
        ms = W < 600 ? 0.75 : 1;                // thu nhỏ chi tiết trên điện thoại
    }
    resize();
    window.addEventListener('resize', resize);

    // ---------- Vẽ sẵn cánh hoa thành sprite (nhanh & đẹp) ----------
    const Lc = 400, Wc = 340, PAD = 44, PW = 0.92;
    function petalPath(c) {
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(-Wc * 0.30, -Lc * 0.06, -Wc * 0.62, -Lc * 0.42, -Wc * 0.50, -Lc * 0.78);
        c.bezierCurveTo(-Wc * 0.42, -Lc * 0.96, -Wc * 0.14, -Lc * 1.02, 0, -Lc * 0.97);
        c.bezierCurveTo(Wc * 0.14, -Lc * 1.02, Wc * 0.42, -Lc * 0.96, Wc * 0.50, -Lc * 0.78);
        c.bezierCurveTo(Wc * 0.62, -Lc * 0.42, Wc * 0.30, -Lc * 0.06, 0, 0);
        c.closePath();
    }
    function makeSprite(tone) {
        const c = document.createElement('canvas');
        c.width = Wc + PAD * 2;
        c.height = Lc + PAD * 2;
        const g = c.getContext('2d');
        g.translate(c.width / 2, PAD + Lc);

        // bóng đổ mềm
        g.save();
        g.shadowColor = 'rgba(70, 0, 25, 0.5)';
        g.shadowBlur = 26;
        g.shadowOffsetY = 8;
        petalPath(g);
        g.fillStyle = tone.base;
        g.fill();
        g.restore();

        // màu chính: đậm ở gốc → nhạt ở mép
        const lg = g.createLinearGradient(0, 0, 0, -Lc);
        lg.addColorStop(0, tone.base);
        lg.addColorStop(0.42, tone.mid);
        lg.addColorStop(1, tone.tip);
        petalPath(g);
        g.fillStyle = lg;
        g.fill();

        g.save();
        petalPath(g);
        g.clip();

        // vùng sáng giữa cánh
        const rg = g.createRadialGradient(0, -Lc * 0.7, 10, 0, -Lc * 0.7, Lc * 0.55);
        rg.addColorStop(0, 'rgba(255,255,255,0.34)');
        rg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = rg;
        g.fillRect(-Wc, -Lc * 1.2, Wc * 2, Lc * 1.3);

        // tối ở gốc cánh (tạo chiều sâu khi chồng lớp)
        const dg = g.createLinearGradient(0, 0, 0, -Lc * 0.42);
        dg.addColorStop(0, 'rgba(60,0,22,0.55)');
        dg.addColorStop(1, 'rgba(60,0,22,0)');
        g.fillStyle = dg;
        g.fillRect(-Wc, -Lc * 0.5, Wc * 2, Lc * 0.55);

        // gân cánh
        g.strokeStyle = 'rgba(120,15,50,0.14)';
        g.lineWidth = 2.2;
        for (let i = -3; i <= 3; i++) {
            g.beginPath();
            g.moveTo(0, -Lc * 0.04);
            g.quadraticCurveTo(i * Wc * 0.07, -Lc * 0.45, i * Wc * 0.15, -Lc * 0.88);
            g.stroke();
        }

        // viền tối bên trong
        petalPath(g);
        g.strokeStyle = 'rgba(110,10,45,0.28)';
        g.lineWidth = 16;
        g.stroke();
        g.restore();

        // viền sáng ở mép trên (cánh cuộn nhẹ)
        g.beginPath();
        g.moveTo(-Wc * 0.50, -Lc * 0.78);
        g.bezierCurveTo(-Wc * 0.42, -Lc * 0.96, -Wc * 0.14, -Lc * 1.02, 0, -Lc * 0.97);
        g.bezierCurveTo(Wc * 0.14, -Lc * 1.02, Wc * 0.42, -Lc * 0.96, Wc * 0.50, -Lc * 0.78);
        g.strokeStyle = tone.rim;
        g.lineWidth = 6;
        g.lineCap = 'round';
        g.stroke();

        c.cx = c.width / 2;
        c.by = PAD + Lc;
        return c;
    }

    const ROSE_TONES = [
        { tip: '#ffd3df', mid: '#f68fab', base: '#d9507a', rim: 'rgba(255,240,244,0.85)' },
        { tip: '#ffc0d0', mid: '#ee7399', base: '#c43d68', rim: 'rgba(255,230,236,0.8)' },
        { tip: '#fbaac1', mid: '#e05a82', base: '#a82a54', rim: 'rgba(255,215,226,0.75)' },
        { tip: '#f08aa8', mid: '#c93f6b', base: '#8a1a41', rim: 'rgba(255,200,215,0.7)' },
    ];
    const AMB_TONES = [
        { tip: '#ffe6ec', mid: '#ffb3c6', base: '#f07a9e', rim: 'rgba(255,255,255,0.9)' },
        { tip: '#ffd9e3', mid: '#ff9db8', base: '#e8658d', rim: 'rgba(255,248,250,0.85)' },
        { tip: '#ffcadb', mid: '#fb86a8', base: '#dd5580', rim: 'rgba(255,240,245,0.85)' },
    ];
    const roseSprites = ROSE_TONES.map(makeSprite);
    const ambSprites = AMB_TONES.map(makeSprite);

    function drawPetal(spr, x, y, rot, len, wid, flip, alpha) {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = alpha;
        ctx.scale((wid / (Wc * PW)) * flip, len / (Lc * 0.99));
        ctx.drawImage(spr, -spr.cx, -spr.by);
        ctx.restore();
    }

    // ---------- Cấu trúc bông hồng (nhìn từ trên xuống) ----------
    // b = khoảng cách gốc cánh tới tâm, l = chiều dài cánh (đơn vị R)
    const RINGS = [
        { n: 10, b: 0.30, l: 0.70, tone: 0 },
        { n: 9, b: 0.25, l: 0.60, tone: 0 },
        { n: 8, b: 0.20, l: 0.52, tone: 1 },
        { n: 7, b: 0.16, l: 0.44, tone: 1 },
        { n: 6, b: 0.12, l: 0.36, tone: 2 },
        { n: 5, b: 0.08, l: 0.29, tone: 2 },
        { n: 4, b: 0.05, l: 0.22, tone: 3 },
        { n: 3, b: 0.02, l: 0.15, tone: 3 },
    ];

    const rosePetals = [];
    let extras = [];
    let bursts = [];
    let particles = [];
    const shocks = [];

    (function buildRose() {
        let rank = 0;
        const total = RINGS.reduce((s, r) => s + r.n, 0);
        RINGS.forEach((rg, k) => {
            for (let j = 0; j < rg.n; j++) {
                const l = rg.l * rnd(0.94, 1.04);
                const b = rg.b * rnd(0.97, 1.03);
                const p = {
                    kind: 'rose', ring: k, tone: rg.tone,
                    a0: k * 0.62 + (j * TAU) / rg.n + rnd(-0.07, 0.07),
                    b, l,
                    w: ((TAU * (b + l * 0.55)) / rg.n) * 1.5,
                    tilt: 0.26 + k * 0.025,
                    state: 'wait',
                    spawnAt: rnd(0, 3.2),
                    convAt: T.conv + (rank / total) * T.convSpread + rnd(0, 0.25),
                    turns: Math.random() < 0.5 ? 1 : 2,
                    sprite: roseSprites[rg.tone],
                };
                rank++;
                rosePetals.push(p);
            }
        });
    })();

    function initAmbient(p, onScreen) {
        p.len = rnd(38, 70) * ms;
        p.wid = p.len * 0.82;
        p.x = rnd(0, W);
        p.y = onScreen ? rnd(0, H * 0.75) : -rnd(40, 110);
        p.vx = rnd(-14, 14);
        p.vy = rnd(42, 85);
        p.swayA = rnd(14, 40);
        p.swayF = rnd(0.7, 1.6);
        p.swayP = rnd(0, TAU);
        p.rot = rnd(0, TAU);
        p.spin = rnd(-0.9, 0.9);
        p.flipP = rnd(0, TAU);
        p.flipF = rnd(1.4, 3.2);
    }

    function spawnExtra(onScreen) {
        const p = { kind: 'extra', state: 'amb', sprite: ambSprites[(Math.random() * ambSprites.length) | 0], dir: Math.random() < 0.5 ? -1 : 1 };
        initAmbient(p, onScreen);
        p.len = rnd(22, 60) * ms;
        p.wid = p.len * 0.8;
        if (!onScreen) p.x = rnd(-20, W + 20);
        extras.push(p);
    }
    for (let i = 0; i < 16; i++) spawnExtra(true);

    // ---------- Hạt lấp lánh ----------
    function emit(x, y, n, spd, life, size) {
        if (particles.length > 420) return;
        for (let i = 0; i < n; i++) {
            const a = rnd(0, TAU), s = rnd(0.2, 1) * spd;
            particles.push({
                x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * 0.1,
                age: 0, life: rnd(0.6, 1) * life, size: rnd(0.6, 1) * size,
            });
        }
    }

    // nhụy: các chấm vàng ở tâm
    const stamens = Array.from({ length: 38 }, () => ({
        a: rnd(0, TAU), r: Math.sqrt(Math.random()) * 0.1, s: rnd(1.2, 2.8),
    }));

    // ---------- Trạng thái chung của bông hồng ----------
    function roseState(tt) {
        const d1 = T.bloom0 - T.spin0, d2 = T.burst - T.bloom0;
        const u1 = clamp((tt - T.spin0) / d1), u2 = clamp((tt - T.bloom0) / d2);
        const A1 = TAU * 1.1, A2 = (A1 * d2) / d1; // liền mạch tốc độ xoay giữa 2 giai đoạn
        const close = eInOut(u1), open = eOut(u2);
        const phi = 0.06 * Math.min(tt, T.spin0) + A1 * eInQ(u1) + A2 * eOutQ(u2);
        const S = tt < T.bloom0 ? lerp(1, 0.8, close) : lerp(0.8, Sb, eBack(u2));
        const glow = clamp((tt - T.conv) / (T.roseDone - T.conv)) * 0.35 + close * 0.25 + open * 0.45;
        return { close, open, phi, S, glow };
    }

    function roseTarget(p, rs) {
        const closed = rs.close * (1 - rs.open);
        const ang = p.a0 + rs.phi + closed * p.ring * 0.30;
        return {
            ang,
            dist: p.b * R * rs.S,
            len: p.l * R * rs.S * (1 - 0.18 * closed + 0.1 * rs.open),
            wid: p.w * R * rs.S * (1 - 0.12 * closed + 0.08 * rs.open),
        };
    }

    // ---------- Phát nổ ----------
    let burstDone = false, burstT = 0, flash = 0;
    function doBurst() {
        burstDone = true;
        burstT = t;
        root.classList.add('reveal');
        const rs = roseState(T.burst);
        rosePetals.forEach((p) => {
            const tg = roseTarget(p, rs);
            const dx = Math.cos(tg.ang), dy = Math.sin(tg.ang);
            const sp = rnd(300, 950);
            bursts.push({
                x: cx + dx * tg.dist, y: cy + dy * tg.dist,
                vx: dx * sp + rnd(-70, 70), vy: dy * sp + rnd(-70, 70) - 40,
                rot: tg.ang + Math.PI / 2 + p.tilt, spin: rnd(-5, 5),
                len: tg.len * 0.9, wid: tg.wid * 0.9,
                flipP: rnd(0, TAU), flipF: rnd(3, 8),
                age: 0, life: rnd(4.8, 7.2),
                swayA: rnd(20, 60), swayF: rnd(1.2, 2.6), swayP: rnd(0, TAU),
                sprite: p.sprite,
            });
        });
        // thêm cánh nhỏ cho vụ nổ thêm hoành tráng
        for (let i = 0; i < 90; i++) {
            const a = rnd(0, TAU), d = rnd(0, R * rs.S * 0.8), sp = rnd(250, 1000);
            bursts.push({
                x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
                rot: rnd(0, TAU), spin: rnd(-7, 7),
                len: rnd(16, 46) * ms, wid: rnd(14, 38) * ms,
                flipP: rnd(0, TAU), flipF: rnd(3, 9),
                age: 0, life: rnd(4, 7),
                swayA: rnd(20, 70), swayF: rnd(1.2, 2.8), swayP: rnd(0, TAU),
                sprite: ambSprites[(Math.random() * 3) | 0],
            });
        }
        // tia sáng vàng
        for (let i = 0; i < 170; i++) {
            const a = rnd(0, TAU), s = rnd(120, 1100);
            particles.push({
                x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                age: 0, life: rnd(1.2, 3.2), size: rnd(1, 3.4), drag: 1.4,
            });
        }
        shocks.push({ age: 0 }, { age: -0.12 });
        flash = 1;
        rosePetals.forEach((p) => (p.state = 'gone'));
    }

    // ---------- Vòng lặp ----------
    let t = 0, last = 0, running = false, rafId = 0, finished = false, textShown = false, textHidden = false, releasedHeader = false;
    let rs = roseState(0);

    function update(dt) {
        if (!burstDone && t >= T.burst) doBurst();
        if (!textShown && t >= T.text) { textShown = true; textEl.classList.add('show'); }
        if (burstDone) {
            if (!releasedHeader && t - burstT > 0.5) {
                releasedHeader = true;
                document.body.classList.remove('intro-lock');
                document.documentElement.classList.remove('intro-lock');
            }
            if (!textHidden && t - burstT > 4.5) { textHidden = true; textEl.classList.remove('show'); }
        }
        rs = roseState(Math.min(t, T.burst));

        // sinh cánh hoa phụ: ngày càng nhiều
        if (t < T.conv) {
            const rate = lerp(4, 16, clamp(t / T.conv));
            if (Math.random() < rate * dt) spawnExtra(false);
        }

        // --- cánh hoa trong bông hồng ---
        if (!burstDone) {
            for (const p of rosePetals) {
                if (t < p.spawnAt) continue;
                if (p.state === 'wait') {
                    initAmbient(p, p.spawnAt < 1.2);
                    p.vy = rnd(45, 85);
                    p.state = 'amb';
                }
                if (p.state === 'amb') {
                    flutter(p, dt);
                    if (p.y > H + 80) p.y = -80; // chưa tới lúc hội tụ thì quay lại phía trên
                    if (t >= p.convAt) {
                        snapshot(p);
                        const tg = roseTarget(p, rs);
                        p.dA = wrapPos(tg.ang - p.a0s) + TAU * p.turns;
                        p.angSnap = tg.ang;
                        p.state = 'conv';
                    } else {
                        p.dx = p.x; p.dy = p.y; p.drot = p.rot; p.dlen = p.len; p.dwid = p.wid;
                        p.dflip = flipOf(p); p.dalpha = 1;
                        p.spr = ambSprites[p.tone % 3];
                    }
                }
                if (p.state === 'conv') {
                    const u = clamp((t - p.convAt) / T.convDur);
                    const e = eInOut(u);
                    const tg = roseTarget(p, rs);
                    const r = lerp(p.r0, tg.dist, e);
                    const a = p.a0s + p.dA * e + (tg.ang - p.angSnap) * e;
                    p.dx = cx + Math.cos(a) * r;
                    p.dy = cy + Math.sin(a) * r;
                    const base = a + Math.PI / 2 + p.tilt * e;
                    p.drot = base + wrapPi(p.rot0 - (p.a0s + Math.PI / 2)) * (1 - e);
                    p.dlen = lerp(p.len0, tg.len, e);
                    p.dwid = lerp(p.wid0, tg.wid, e);
                    p.flipP += p.flipF * dt;
                    p.dflip = lerp(flipOf(p), 1, e * e);
                    p.dalpha = 1;
                    p.spr = e > 0.6 ? p.sprite : ambSprites[p.tone % 3];
                    if (Math.random() < dt * 9) emit(p.dx, p.dy, 1, 40 * ms, 0.9, 2.4 * ms);
                    if (u >= 1) p.state = 'rose';
                }
                if (p.state === 'rose') {
                    const tg = roseTarget(p, rs);
                    p.dx = cx + Math.cos(tg.ang) * tg.dist;
                    p.dy = cy + Math.sin(tg.ang) * tg.dist;
                    p.drot = tg.ang + Math.PI / 2 + p.tilt;
                    p.dlen = tg.len; p.dwid = tg.wid; p.dflip = 1; p.dalpha = 1;
                    p.spr = p.sprite;
                }
            }
            // bụi vàng quanh bông hồng khi xoay & nở
            if (t > T.spin0) {
                const a = rnd(0, TAU), d = R * rs.S * rnd(0.5, 1.05);
                if (Math.random() < dt * (20 + 40 * rs.open)) emit(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 50 * ms, 1.3, 2.6 * ms);
            }
        }

        // --- cánh hoa phụ ---
        for (const p of extras) {
            if (t >= T.conv && p.state === 'amb' && p.convAt === undefined) p.convAt = t + rnd(0, T.convSpread * 0.9);
            if (p.state === 'amb') {
                flutter(p, dt);
                if (p.y > H + 80) p.dead = true;
                if (p.convAt !== undefined && t >= p.convAt) { snapshot(p); p.state = 'conv'; }
                p.dx = p.x; p.dy = p.y; p.drot = p.rot; p.dlen = p.len; p.dwid = p.wid; p.dflip = flipOf(p); p.dalpha = 1;
            }
            if (p.state === 'conv') {
                const u = clamp((t - p.convAt) / 2.4);
                const e = eInOut(u);
                const a = p.a0s + e * 2.4 * p.dir;
                const r = p.r0 * Math.pow(1 - e, 1.2);
                p.dx = cx + Math.cos(a) * r;
                p.dy = cy + Math.sin(a) * r;
                p.drot = a + Math.PI / 2 + wrapPi(p.rot0 - (p.a0s + Math.PI / 2)) * (1 - e);
                p.flipP += p.flipF * dt;
                p.dflip = flipOf(p);
                p.dlen = p.len0 * (1 - 0.7 * e);
                p.dwid = p.wid0 * (1 - 0.7 * e);
                p.dalpha = 1 - smooth(e, 0.55, 1);
                if (u >= 1) p.dead = true;
            }
        }
        extras = extras.filter((p) => !p.dead);

        // --- cánh hoa bay tung toé ---
        for (const b of bursts) {
            b.age += dt;
            const drag = Math.exp(-1.35 * dt);
            b.vx *= drag; b.vy *= drag;
            b.vy += 30 * dt;
            b.x += (b.vx + Math.sin(t * b.swayF + b.swayP) * b.swayA) * dt;
            b.y += b.vy * dt;
            b.rot += b.spin * dt;
            b.spin *= Math.exp(-0.2 * dt);
            b.flipP += b.flipF * dt;
        }
        bursts = bursts.filter((b) => b.age < b.life);

        // --- hạt sáng ---
        for (const q of particles) {
            q.age += dt;
            const d = Math.exp(-(q.drag || 1.2) * dt);
            q.vx *= d; q.vy *= d;
            q.x += q.vx * dt; q.y += q.vy * dt;
        }
        particles = particles.filter((q) => q.age < q.life);

        for (const s of shocks) s.age += dt;
        flash = Math.max(0, flash - dt * 1.3);

        // --- kết thúc ---
        if (burstDone && t - burstT > 2 && !bursts.length && !particles.length) finish();
        if (burstDone && t - burstT > 14) finish();
    }

    function flutter(p, dt) {
        p.y += p.vy * dt;
        p.x += (p.vx + Math.sin(t * p.swayF + p.swayP) * p.swayA) * dt;
        p.rot += p.spin * dt;
        p.flipP += p.flipF * dt;
    }
    const flipOf = (p) => 0.28 + 0.72 * Math.abs(Math.cos(p.flipP));
    function snapshot(p) {
        p.x0 = p.x; p.y0 = p.y; p.rot0 = p.rot; p.len0 = p.len; p.wid0 = p.wid;
        const dx = p.x - cx, dy = p.y - cy;
        p.r0 = Math.hypot(dx, dy);
        p.a0s = Math.atan2(dy, dx);
    }

    // ---------- Vẽ ----------
    function render() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        const bAge = burstDone ? t - burstT : 0;

        // tia sáng từ trên chiếu xuống
        if (t > T.spin0 - 1) {
            const a = smooth(t, T.spin0 - 1, T.spin0 + 0.8) * (burstDone ? clamp(1 - bAge / 1.2) : 1);
            if (a > 0.01) {
                ctx.globalCompositeOperation = 'lighter';
                const rad = R * rs.S;
                for (const [wTop, wBot, k] of [[W * 0.16, rad * 1.7, 0.34], [W * 0.05, rad * 0.8, 0.3]]) {
                    const g = ctx.createLinearGradient(0, 0, 0, cy + rad * 0.3);
                    g.addColorStop(0, `rgba(255,228,176,${a * k})`);
                    g.addColorStop(1, 'rgba(255,228,176,0)');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.moveTo(cx - wTop, 0); ctx.lineTo(cx + wTop, 0);
                    ctx.lineTo(cx + wBot, cy); ctx.lineTo(cx - wBot, cy);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        // quầng sáng sau bông hồng
        const glowA = burstDone ? rs.glow * clamp(1 - bAge / 1.6) : rs.glow;
        if (glowA > 0.01) {
            ctx.globalCompositeOperation = 'lighter';
            const rad = R * rs.S * (1.5 + rs.open * 0.5);
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
            g.addColorStop(0, `rgba(255,176,196,${0.5 * glowA})`);
            g.addColorStop(0.55, `rgba(235,95,140,${0.2 * glowA})`);
            g.addColorStop(1, 'rgba(235,95,140,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }

        // cánh hoa phụ (nằm dưới)
        for (const p of extras) drawPetal(p.sprite, p.dx, p.dy, p.drot, p.dlen, p.dwid, p.dflip, p.dalpha);

        if (!burstDone) {
            // nền tối sâu giữa bông hồng
            const fa = smooth(t, T.conv + 1, T.roseDone);
            if (fa > 0.01) {
                const rad = R * rs.S * 0.6;
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
                g.addColorStop(0, `rgba(80,10,36,${0.9 * fa})`);
                g.addColorStop(1, 'rgba(80,10,36,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(cx, cy, rad, 0, TAU); ctx.fill();
            }
            // cánh hoa hồng: ngoài → trong
            for (const p of rosePetals) {
                if (p.state === 'wait' || p.state === 'gone') continue;
                drawPetal(p.spr, p.dx, p.dy, p.drot, p.dlen, p.dwid, p.dflip, p.dalpha);
            }
            // nhụy vàng
            const pa = clamp(rs.close * 0.5 + rs.open * 0.9);
            if (pa > 0.02) {
                ctx.globalCompositeOperation = 'lighter';
                const rad = R * rs.S * (0.12 + 0.12 * rs.open);
                const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 2);
                g.addColorStop(0, `rgba(255,222,150,${0.85 * pa})`);
                g.addColorStop(1, 'rgba(255,200,120,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(cx, cy, rad * 2, 0, TAU); ctx.fill();
                ctx.fillStyle = `rgba(255,214,120,${clamp(rs.open * 1.6)})`;
                for (const s of stamens) {
                    const a = s.a + rs.phi * 0.5, d = s.r * R * rs.S * (0.5 + rs.open);
                    ctx.beginPath();
                    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, s.s * rs.S * 0.8, 0, TAU);
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        // cánh hoa bay phấp phới
        for (const b of bursts) {
            const k = b.age / b.life;
            const alpha = k < 0.6 ? 1 : Math.pow(1 - (k - 0.6) / 0.4, 1.4);
            const sc = 1 - 0.3 * k;
            const flip = 0.28 + 0.72 * Math.abs(Math.cos(b.flipP));
            drawPetal(b.sprite, b.x, b.y, b.rot, b.len * sc, b.wid * sc, flip, alpha);
        }

        // hạt sáng & sóng xung kích
        ctx.globalCompositeOperation = 'lighter';
        for (const q of particles) {
            const a = 1 - q.age / q.life;
            ctx.fillStyle = `rgba(255,214,130,${a * 0.9})`;
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.size * (0.5 + 0.5 * a), 0, TAU);
            ctx.fill();
        }
        for (const s of shocks) {
            if (s.age < 0) continue;
            const a = 1 - s.age / 1.3;
            if (a <= 0) continue;
            ctx.strokeStyle = `rgba(255,224,170,${a * 0.7})`;
            ctx.lineWidth = 2 + 10 * a;
            ctx.beginPath(); ctx.arc(cx, cy, 40 + s.age * Math.max(W, H) * 0.9, 0, TAU); ctx.stroke();
        }
        if (flash > 0.01) {
            const rad = Math.max(W, H) * 0.7;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
            g.addColorStop(0, `rgba(255,236,214,${flash * 0.85})`);
            g.addColorStop(1, 'rgba(255,200,200,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    function frame(now) {
        if (!running) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;
        update(dt);
        render();
        rafId = requestAnimationFrame(frame);
    }

    // ---------- Bắt đầu / kết thúc ----------
    function begin() {
        startEl.classList.add('hide');
        if (CONFIG.autoMusic) {
            const audio = document.getElementById('bg-music');
            const toggle = document.getElementById('music-toggle');
            if (audio && audio.paused && toggle) toggle.click();
        }
        running = true;
        last = performance.now();
        rafId = requestAnimationFrame(frame);
    }

    function finish() {
        if (finished) return;
        finished = true;
        running = false;
        cancelAnimationFrame(rafId);
        document.body.classList.remove('intro-lock');
        document.documentElement.classList.remove('intro-lock');
        root.classList.add('done');
        window.removeEventListener('resize', resize);
        document.dispatchEvent(new CustomEvent('rose-intro-done'));
        setTimeout(() => root.remove(), 1000);
    }

    openBtn.addEventListener('click', begin);
    skipBtn.addEventListener('click', () => {
        if (CONFIG.autoMusic && !running) {
            const audio = document.getElementById('bg-music');
            const toggle = document.getElementById('music-toggle');
            if (audio && audio.paused && toggle) toggle.click();
        }
        finish();
    });
})();