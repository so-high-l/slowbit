import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

const fract = (n: number) => n - Math.floor(n);
const rand = (n: number) => fract(Math.sin(n * 127.1) * 43758.5453123);

function smoothstep(edge0: number, edge1: number, x: number) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

function drawShootingStar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    progress: number,
    startX: number,
    startY: number,
    dx: number,
    dy: number,
    brightness = 1,
) {
    const x = startX + dx * progress;
    const y = startY + dy * progress;

    const angle = Math.atan2(dy, dx);
    const tailLength = 140;

    const tailGrad = ctx.createLinearGradient(
        x - Math.cos(angle) * tailLength,
        y - Math.sin(angle) * tailLength,
        x,
        y,
    );

    tailGrad.addColorStop(0, "rgba(255,255,255,0)");
    tailGrad.addColorStop(0.35, `rgba(196,226,255,${0.04 * brightness})`);
    tailGrad.addColorStop(1, `rgba(255,247,220,${0.55 * brightness})`);

    ctx.beginPath();
    ctx.moveTo(
        x - Math.cos(angle) * tailLength,
        y - Math.sin(angle) * tailLength,
    );
    ctx.lineTo(x, y);
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(
        x - Math.cos(angle) * tailLength * 0.7,
        y - Math.sin(angle) * tailLength * 0.7,
    );
    ctx.lineTo(x, y);
    ctx.strokeStyle = `rgba(210,232,255,${0.08 * brightness})`;
    ctx.lineWidth = 4.8;
    ctx.stroke();

    glow(ctx, x, y, 22, `rgba(255,241,201,${0.18 * brightness})`);

    ctx.beginPath();
    ctx.arc(x, y, 2.7, 0, TAU);
    ctx.fillStyle = `rgba(255,247,228,${0.95 * brightness})`;
    ctx.fill();
}

export const paintNightSky: ScenePainter = ({
    ctx,
    w,
    h,
    t,
    particles,
}) => {
    background(ctx, w, h, "#040812", "#0b1830");

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#030711");
    sky.addColorStop(0.45, "#081427");
    sky.addColorStop(0.75, "#132443");
    sky.addColorStop(1, "#0a1222");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const moonX = w * 0.78;
    const moonY = h * 0.18;

    glow(ctx, moonX, moonY, Math.min(w, h) * 0.22, "rgba(189,210,255,0.10)");
    glow(ctx, moonX, moonY, Math.min(w, h) * 0.1, "rgba(235,241,255,0.08)");

    ctx.beginPath();
    ctx.arc(moonX, moonY, Math.min(w, h) * 0.035, 0, TAU);
    ctx.fillStyle = "rgba(220,228,242,0.78)";
    ctx.fill();

    ctx.save();
    ctx.translate(w * 0.25, h * 0.18);
    ctx.rotate(-0.45);
    const band = ctx.createLinearGradient(0, -h * 0.3, 0, h * 0.3);
    band.addColorStop(0, "rgba(255,255,255,0)");
    band.addColorStop(0.5, "rgba(180,200,240,0.06)");
    band.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = band;
    ctx.fillRect(-w * 0.2, -h * 0.15, w * 1.1, h * 0.3);
    ctx.restore();

    const starCount = Math.max(80, Math.min(180, Math.floor(w / 12)));
    for (let i = 0; i < starCount; i++) {
        const x = rand(i + 10.1) * w;
        const y = rand(i + 44.2) * h * 0.72;
        const nearMoon = Math.hypot(x - moonX, y - moonY) < Math.min(w, h) * 0.09;
        if (nearMoon && i % 2 === 0) continue;

        const size = 0.6 + rand(i + 91.7) * 1.8;
        const twinkleBase = rand(i + 133.7) * TAU;
        const twinkle = 0.45 + 0.55 * Math.sin(t * (0.12 + rand(i + 66.6) * 0.35) + twinkleBase);
        const alpha = 0.18 + twinkle * (0.12 + rand(i + 12.3) * 0.28);

        if (size > 1.6) glow(ctx, x, y, 7 + size * 2, `rgba(200,220,255,${alpha * 0.09})`);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fillStyle = `rgba(235,240,255,${alpha})`;
        ctx.fill();

        if (size > 1.8 && i % 11 === 0) {
            ctx.beginPath();
            ctx.moveTo(x - 4, y);
            ctx.lineTo(x + 4, y);
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x, y + 4);
            ctx.strokeStyle = `rgba(228,235,255,${alpha * 0.22})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    const horizon = ctx.createLinearGradient(0, h * 0.68, 0, h);
    horizon.addColorStop(0, "rgba(83,106,160,0.02)");
    horizon.addColorStop(0.35, "rgba(78,95,145,0.05)");
    horizon.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, h * 0.66, w, h * 0.34);

    const layers = [
        { y: 0.76, amp: 24, color: "rgba(11,16,27,0.56)", freq: 0.01 },
        { y: 0.83, amp: 38, color: "rgba(8,11,20,0.78)", freq: 0.014 },
        { y: 0.9, amp: 28, color: "rgba(4,7,13,0.96)", freq: 0.02 },
    ];

    for (const layer of layers) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, h * layer.y);
        for (let x = 0; x <= w; x += 12) {
            const y =
                h * layer.y -
                Math.sin(x * layer.freq) * layer.amp -
                Math.sin(x * layer.freq * 0.37 + 1.4) * layer.amp * 0.32;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
    }

    for (let i = 0; i < Math.min(particles.length, 18); i++) {
        const p = particles[i];
        const x = (p.x * w + Math.sin(t * 0.08 + i) * 5 + w) % w;
        const y = h * (0.78 + p.y * 0.18);
        const pulse = 0.35 + 0.65 * Math.sin(t * 0.4 + i * 0.9);
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + p.r * 0.6, 0, TAU);
        ctx.fillStyle = `rgba(170,190,220,${0.015 + pulse * 0.03})`;
        ctx.fill();
    }

    const firstCycle = 45;
    const firstDuration = 1.4;
    const firstTime = t % firstCycle;
    if (firstTime < firstDuration) {
        drawShootingStar(ctx, w, h, smoothstep(0, firstDuration, firstTime), w * 0.16, h * 0.16, w * 0.3, h * 0.16);
    }

    const secondCycle = 60;
    const secondDuration = 1.6;
    const secondTime = (t + 22) % secondCycle;
    if (secondTime < secondDuration) {
        drawShootingStar(ctx, w, h, smoothstep(0, secondDuration, secondTime), w * 0.62, h * 0.12, w * 0.18, h * 0.11, 0.92);
    }

    const vignette = ctx.createRadialGradient(
        w * 0.52,
        h * 0.4,
        80,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.78,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
};
