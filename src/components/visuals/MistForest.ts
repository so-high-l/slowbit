import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;
const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 91.7) * 43758.5453);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function drawCaveFrame(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const opening = new Path2D();
    opening.moveTo(w * 0.14, h);
    opening.lineTo(w * 0.19, h * 0.7);
    opening.quadraticCurveTo(w * 0.22, h * 0.46, w * 0.24, h * 0.32);
    opening.quadraticCurveTo(w * 0.29, h * 0.16, w * 0.42, h * 0.12);
    opening.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.58, h * 0.12);
    opening.quadraticCurveTo(w * 0.71, h * 0.16, w * 0.76, h * 0.32);
    opening.quadraticCurveTo(w * 0.78, h * 0.46, w * 0.81, h * 0.7);
    opening.lineTo(w * 0.86, h);
    opening.closePath();

    ctx.fillStyle = "rgba(2, 8, 10, 0.88)";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(opening);
    ctx.restore();

    const leftWall = ctx.createLinearGradient(0, 0, w * 0.33, 0);
    leftWall.addColorStop(0, "rgba(2, 7, 9, 0.98)");
    leftWall.addColorStop(0.45, "rgba(6, 18, 19, 0.92)");
    leftWall.addColorStop(1, "rgba(12, 32, 30, 0.38)");
    ctx.fillStyle = leftWall;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.26, 0);
    ctx.quadraticCurveTo(w * 0.28, h * 0.18, w * 0.24, h * 0.34);
    ctx.quadraticCurveTo(w * 0.2, h * 0.56, w * 0.17, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    const rightWall = ctx.createLinearGradient(w, 0, w * 0.67, 0);
    rightWall.addColorStop(0, "rgba(2, 7, 9, 0.98)");
    rightWall.addColorStop(0.45, "rgba(6, 18, 19, 0.92)");
    rightWall.addColorStop(1, "rgba(12, 32, 30, 0.38)");
    ctx.fillStyle = rightWall;
    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w * 0.74, 0);
    ctx.quadraticCurveTo(w * 0.72, h * 0.18, w * 0.76, h * 0.34);
    ctx.quadraticCurveTo(w * 0.8, h * 0.56, w * 0.83, h);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    const ceiling = ctx.createLinearGradient(0, 0, 0, h * 0.2);
    ceiling.addColorStop(0, "rgba(2, 6, 8, 1)");
    ceiling.addColorStop(1, "rgba(8, 22, 22, 0.72)");
    ctx.fillStyle = ceiling;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w * 0.76, h * 0.16);
    ctx.quadraticCurveTo(w * 0.5, h * 0.06, w * 0.24, h * 0.16);
    ctx.closePath();
    ctx.fill();

    const edgeShadow = ctx.createRadialGradient(
        w * 0.5,
        h * 0.42,
        80,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.7,
    );
    edgeShadow.addColorStop(0, "rgba(0,0,0,0)");
    edgeShadow.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = edgeShadow;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(4, 12, 13, 0.82)";
    for (let i = 0; i < 7; i++) {
        const x = w * (0.22 + i * 0.09) + Math.sin(i * 2.4 + t * 0.01) * 2;
        const length = h * (0.015 + rand(i + 11) * 0.03);
        ctx.beginPath();
        ctx.moveTo(x - 5, 0);
        ctx.lineTo(x + 5, 0);
        ctx.lineTo(x, length);
        ctx.closePath();
        ctx.fill();
    }
}

function drawMoss(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    phase: number,
    t: number,
) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 1; i <= 6; i++) {
        const p = i / 6;
        ctx.lineTo(
            x + Math.sin(t * 0.028 + phase + p * 2.5) * (2 + p * 6),
            y + length * p,
        );
    }
    ctx.strokeStyle = `rgba(96, 153, 116, ${0.18 + rand(phase) * 0.12})`;
    ctx.lineWidth = 1 + rand(phase * 2.1) * 1.5;
    ctx.stroke();
}

function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    for (let i = 0; i < 55; i++) {
        const x = rand(i + 10) * w;
        const y = rand(i + 200) * h * 0.42;
        const radius = 0.5 + rand(i + 400) * 1.4;
        const twinkle = 0.18 + (0.5 + 0.5 * Math.sin(t * (0.2 + rand(i + 700) * 0.2) + i)) * 0.42;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fillStyle = `rgba(230, 240, 255, ${twinkle})`;
        ctx.fill();

        if (radius > 1.3 && i % 9 === 0) {
            ctx.beginPath();
            ctx.moveTo(x - 3, y);
            ctx.lineTo(x + 3, y);
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x, y + 3);
            ctx.strokeStyle = `rgba(220, 235, 255, ${twinkle * 0.28})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
        }
    }
}

function drawCloudBand(
    ctx: CanvasRenderingContext2D,
    w: number,
    y: number,
    scale: number,
    alpha: number,
    speed: number,
    t: number,
    seed: number,
) {
    ctx.save();
    ctx.filter = "blur(10px)";

    for (let i = 0; i < 4; i++) {
        const cx =
            ((w * (0.15 + i * 0.28) + t * speed + Math.sin(seed + i) * 40) % (w * 1.4)) -
            w * 0.2;
        const cy = y + Math.sin(t * 0.01 + i + seed) * 8;
        const rw = w * scale * (0.7 + rand(seed + i * 9) * 0.4);
        const rh = rw * 0.16;

        const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, rw);
        gradient.addColorStop(0, `rgba(210, 224, 232, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(210, 224, 232, ${alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(210,224,232,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rw, rh, 0, 0, TAU);
        ctx.fill();
    }

    ctx.restore();
}

function drawMountainLayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    baseY: number,
    amp: number,
    color: string,
    seed: number,
) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);

    for (let x = 0; x <= w; x += 18) {
        const y =
            baseY -
            Math.sin(x * 0.006 + seed) * amp * 0.7 -
            Math.sin(x * 0.013 + seed * 1.8) * amp * 0.32 -
            Math.sin(x * 0.021 + seed * 0.7) * amp * 0.18;
        ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawMoon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    t: number,
) {
    const tone = 0.5 + 0.5 * Math.sin(t * 0.01);
    const red = Math.round(lerp(246, 232, tone));
    const green = Math.round(lerp(218, 240, tone));
    const blue = Math.round(lerp(184, 255, tone));

    glow(ctx, x, y, radius * 3.2, `rgba(${red}, ${green}, ${blue}, 0.08)`);
    glow(ctx, x, y, radius * 1.8, `rgba(${red}, ${green}, ${blue}, 0.11)`);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.96)`;
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.01);

    for (let i = 0; i < 5; i++) {
        const angle = i * 1.2 + 0.6;
        const distance = radius * (0.18 + (i % 3) * 0.12);
        const craterX = Math.cos(angle) * distance;
        const craterY = Math.sin(angle) * distance * 0.86;
        ctx.beginPath();
        ctx.ellipse(craterX, craterY, radius * 0.12, radius * 0.08, angle * 0.3, 0, TAU);
        ctx.fillStyle = `rgba(${Math.max(red - 28, 0)}, ${Math.max(green - 24, 0)}, ${Math.max(blue - 22, 0)}, 0.18)`;
        ctx.fill();
    }

    ctx.restore();
}

function drawMoonReflection(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    moonX: number,
    moonY: number,
    tone: number,
) {
    const reflectionX = moonX + Math.sin(moonY) * 2;
    const reflectionY = h * 0.73;
    const reflectionW = w * 0.035;
    const reflectionH = h * 0.14;

    ctx.save();
    ctx.filter = "blur(8px)";

    const red = Math.round(lerp(244, 226, tone));
    const green = Math.round(lerp(218, 238, tone));
    const blue = Math.round(lerp(190, 252, tone));

    const gradient = ctx.createRadialGradient(reflectionX, reflectionY, 6, reflectionX, reflectionY, reflectionH);
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.2)`);
    gradient.addColorStop(0.4, `rgba(${red}, ${green}, ${blue}, 0.08)`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(reflectionX, reflectionY, reflectionW, reflectionH, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
}

export const paintMistForest: ScenePainter = ({ ctx, w, h, t }) => {
    background(ctx, w, h, "#051015", "#132f31");

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#04101a");
    sky.addColorStop(0.25, "#0a1a2b");
    sky.addColorStop(0.5, "#102938");
    sky.addColorStop(0.76, "#11302f");
    sky.addColorStop(1, "#081718");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const moonX = w * 0.63 + Math.sin(t * 0.003) * w * 0.015;
    const moonY = h * 0.25 + Math.sin(t * 0.0025) * h * 0.01;
    const moonRadius = Math.min(w, h) * 0.048;
    drawStars(ctx, w, h, t);
    drawMoon(ctx, moonX, moonY, moonRadius, t);

    drawCloudBand(ctx, w, h * 0.21, 0.18, 0.05, 1.6, t, 1);
    drawCloudBand(ctx, w, h * 0.3, 0.24, 0.04, 1.1, t, 2);
    drawCloudBand(ctx, w, h * 0.38, 0.28, 0.03, 0.8, t, 3);

    const mist = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.74);
    mist.addColorStop(0, "rgba(180, 220, 214, 0.08)");
    mist.addColorStop(0.55, "rgba(160, 205, 190, 0.06)");
    mist.addColorStop(1, "rgba(160,205,190,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, h * 0.46, w, h * 0.32);

    drawMountainLayer(ctx, w, h, h * 0.58, h * 0.07, "rgba(18, 36, 44, 0.42)", 1.2);
    drawMountainLayer(ctx, w, h, h * 0.64, h * 0.11, "rgba(11, 24, 28, 0.66)", 2.7);
    drawMountainLayer(ctx, w, h, h * 0.72, h * 0.12, "rgba(7, 16, 18, 0.9)", 4.1);

    const water = ctx.createLinearGradient(0, h * 0.7, 0, h);
    water.addColorStop(0, "rgba(14, 36, 38, 0.28)");
    water.addColorStop(0.35, "rgba(8, 22, 26, 0.48)");
    water.addColorStop(1, "rgba(3, 9, 12, 0.84)");
    ctx.fillStyle = water;
    ctx.fillRect(0, h * 0.69, w, h * 0.31);

    for (let i = 0; i < 7; i++) {
        const y = h * (0.73 + i * 0.03);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
            const rippleY = y + Math.sin(x * 0.012 + t * 0.03 + i * 1.2) * (1.2 + i * 0.15);
            if (x === 0) ctx.moveTo(x, rippleY);
            else ctx.lineTo(x, rippleY);
        }
        ctx.strokeStyle = `rgba(166, 216, 206, ${0.025 - i * 0.002})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawMoonReflection(ctx, w, h, moonX, moonY, 0.5 + 0.5 * Math.sin(t * 0.01));
    drawCaveFrame(ctx, w, h, t);

    const floor = ctx.createLinearGradient(0, h * 0.62, 0, h);
    floor.addColorStop(0, "rgba(7, 28, 26, 0)");
    floor.addColorStop(1, "rgba(2, 10, 12, 0.84)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.58, w, h * 0.42);

    for (let i = 0; i < 22; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const x = side > 0 ? w * (0.16 + rand(i + 30) * 0.12) : w * (0.72 + rand(i + 30) * 0.12);
        const y = h * (0.06 + rand(i + 60) * 0.5);
        drawMoss(ctx, x, y, h * (0.03 + rand(i + 90) * 0.11), i + 2, t);
    }

    for (let i = 0; i < 26; i++) {
        const phase = i * 1.7;
        const x = w * (0.24 + rand(i + 120) * 0.52) + Math.sin(t * 0.018 + phase) * 7;
        const y = h * (0.18 + rand(i + 180) * 0.58) + Math.sin(t * 0.024 + phase) * 5;
        const alpha = 0.05 + (0.5 + 0.5 * Math.sin(t * 0.22 + phase)) * 0.15;

        ctx.beginPath();
        ctx.arc(x, y, 0.7 + rand(i + 240) * 1.5, 0, TAU);
        ctx.fillStyle = `rgba(155, 228, 170, ${alpha})`;
        ctx.fill();

        if (i % 6 === 0) glow(ctx, x, y, 8, `rgba(155, 228, 170, ${alpha * 0.14})`);
    }

    for (let i = 0; i < 12; i++) {
        const x = w * (0.22 + rand(i + 300) * 0.56);
        const y = h * (0.78 + rand(i + 330) * 0.15);
        ctx.beginPath();
        ctx.ellipse(x, y, 8 + rand(i + 360) * 14, 2 + rand(i + 390) * 3, rand(i + 420) * 0.45, 0, TAU);
        ctx.fillStyle = i % 3 === 0 ? "rgba(18, 68, 58, 0.26)" : "rgba(20, 40, 36, 0.34)";
        ctx.fill();
    }

    const haze = ctx.createLinearGradient(0, 0, 0, h);
    haze.addColorStop(0, "rgba(210, 228, 232, 0.025)");
    haze.addColorStop(0.2, "rgba(210, 228, 232, 0.015)");
    haze.addColorStop(1, "rgba(210, 228, 232, 0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    const vignette = ctx.createRadialGradient(
        w * 0.5,
        h * 0.42,
        70,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.78,
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 4, 6, 0.46)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
};
