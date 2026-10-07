import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

const fract = (n: number) => n - Math.floor(n);

const rand = (n: number) => fract(Math.sin(n * 127.1) * 43758.5453123);

function waveY(
    x: number,
    t: number,
    base: number,
    amp: number,
    freq: number,
    speed: number,
    phase: number
) {
    return (
        base +
        Math.sin(x * freq + t * speed + phase) * amp +
        Math.sin(x * freq * 0.45 - t * speed * 0.55 + phase * 1.7) * amp * 0.45 +
        Math.sin(x * freq * 1.8 + t * speed * 0.18 + phase * 0.7) * amp * 0.15
    );
}

function drawWaveLayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    {
        base,
        amp,
        freq,
        speed,
        phase,
        fillTop,
        fillBottom,
        stroke,
        lineWidth = 1.5,
        opacity = 1,
    }: {
        base: number;
        amp: number;
        freq: number;
        speed: number;
        phase: number;
        fillTop: string;
        fillBottom: string;
        stroke: string;
        lineWidth?: number;
        opacity?: number;
    }
) {
    const step = 8;

    const grad = ctx.createLinearGradient(0, base - amp * 2, 0, h);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBottom);

    ctx.save();
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
        const y = waveY(x, t, base, amp, freq, speed, phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
        const y = waveY(x, t, base, amp, freq, speed, phase);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.restore();
}

function drawMoonAndReflection(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number
) {
    const moonX = w * 0.72;
    const moonY = h * 0.22;
    const moonR = Math.min(w, h) * 0.045;

    // Soft sky glow
    glow(ctx, moonX, moonY, moonR * 5, "#9ee7ff22");

    // Moon
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, TAU);
    ctx.fillStyle = "rgba(210, 245, 255, 0.9)";
    ctx.fill();

    // Reflection on water
    for (let i = 0; i < 18; i++) {
        const y = h * 0.38 + i * 13 + Math.sin(t * 0.3 + i * 0.7) * 1.5;
        const width = 18 + i * 8 + Math.sin(t * 0.5 + i) * 6;
        const alpha = clamp(0.12 - i * 0.005, 0.015, 0.12);

        ctx.beginPath();
        ctx.ellipse(
            moonX + Math.sin(t * 0.25 + i) * 2,
            y,
            width,
            2.2,
            0,
            0,
            TAU
        );
        ctx.fillStyle = `rgba(180, 235, 245, ${alpha})`;
        ctx.fill();
    }
}

function drawHorizonMist(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
) {
    const y = h * 0.38;

    const mist = ctx.createLinearGradient(0, y - 25, 0, y + 40);
    mist.addColorStop(0, "rgba(170, 230, 235, 0)");
    mist.addColorStop(0.5, "rgba(170, 230, 235, 0.11)");
    mist.addColorStop(1, "rgba(170, 230, 235, 0)");

    ctx.fillStyle = mist;
    ctx.fillRect(0, y - 25, w, 65);
}

function drawWaterShimmer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number
) {
    for (let i = 0; i < 36; i++) {
        const rx = rand(i + 10.3);
        const ry = rand(i + 88.8);

        const x = rx * w;
        const y = h * (0.45 + ry * 0.38);

        const pulse = 0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.9);
        const len = 8 + rand(i + 3.2) * 18;
        const alpha = 0.03 + pulse * 0.08;

        ctx.beginPath();
        ctx.moveTo(x - len * 0.5, y);
        ctx.lineTo(x + len * 0.5, y);
        ctx.strokeStyle = `rgba(210, 248, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function drawFoamHighlights(
    ctx: CanvasRenderingContext2D,
    w: number,
    t: number,
    base: number,
    amp: number,
    freq: number,
    speed: number,
    phase: number
) {
    for (let x = 0; x <= w; x += 24) {
        const y = waveY(x, t, base, amp, freq, speed, phase);
        const alpha =
            0.05 + (0.05 * (1 + Math.sin(x * 0.03 + t * 0.8 + phase))) / 2;

        ctx.beginPath();
        ctx.moveTo(x - 6, y + 1);
        ctx.lineTo(x + 6, y + 1);
        ctx.strokeStyle = `rgba(235, 250, 255, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
}

function drawFloatingSpecks(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    t: number,
    particles?: Array<{ x?: number; y?: number; size?: number }>
) {
    const count = particles?.length ? Math.min(particles.length, 24) : 18;

    for (let i = 0; i < count; i++) {
        const px =
            particles?.[i]?.x != null
                ? (particles[i].x as number) * w
                : rand(i + 50) * w;

        const pyBase =
            particles?.[i]?.y != null
                ? (particles[i].y as number) * h
                : h * (0.52 + rand(i + 90) * 0.35);

        const size = particles?.[i]?.size ?? (1 + rand(i + 12) * 2.2);

        const x = px + Math.sin(t * 0.18 + i * 1.3) * 8;
        const y = pyBase + Math.sin(t * 0.22 + i * 2.1) * 5;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, TAU);
        ctx.fillStyle = `rgba(195, 240, 245, ${0.03 + rand(i + 33) * 0.05})`;
        ctx.fill();
    }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const vignette = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        Math.min(w, h) * 0.15,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75
    );

    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.22)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
}

export const paintOcean: ScenePainter = ({ ctx, w, h, t, particles }) => {
    // Base background
    background(ctx, w, h, "#04111c", "#0c3d53");

    // Extra sky/water gradient for more depth
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#061724");
    sky.addColorStop(0.35, "#0a2b3c");
    sky.addColorStop(0.55, "#0d4658");
    sky.addColorStop(1, "#082b3d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    drawMoonAndReflection(ctx, w, h, t);
    drawHorizonMist(ctx, w, h);

    // Back water layers
    drawWaveLayer(ctx, w, h, t, {
        base: h * 0.52,
        amp: 8,
        freq: 0.010,
        speed: 0.28,
        phase: 0.0,
        fillTop: "rgba(22, 92, 110, 0.22)",
        fillBottom: "rgba(8, 48, 63, 0.34)",
        stroke: "rgba(170, 228, 230, 0.12)",
        lineWidth: 1.5,
    });

    drawWaveLayer(ctx, w, h, t, {
        base: h * 0.60,
        amp: 11,
        freq: 0.012,
        speed: 0.34,
        phase: 0.9,
        fillTop: "rgba(18, 97, 112, 0.24)",
        fillBottom: "rgba(6, 56, 73, 0.42)",
        stroke: "rgba(180, 235, 235, 0.12)",
        lineWidth: 1.7,
    });

    drawWaveLayer(ctx, w, h, t, {
        base: h * 0.69,
        amp: 14,
        freq: 0.014,
        speed: 0.42,
        phase: 2.0,
        fillTop: "rgba(20, 110, 122, 0.26)",
        fillBottom: "rgba(7, 66, 85, 0.54)",
        stroke: "rgba(190, 240, 238, 0.13)",
        lineWidth: 1.9,
    });

    // Front layer
    const frontBase = h * 0.79;
    const frontAmp = 18;
    const frontFreq = 0.017;
    const frontSpeed = 0.52;
    const frontPhase = 3.1;

    drawWaveLayer(ctx, w, h, t, {
        base: frontBase,
        amp: frontAmp,
        freq: frontFreq,
        speed: frontSpeed,
        phase: frontPhase,
        fillTop: "rgba(16, 120, 132, 0.28)",
        fillBottom: "rgba(3, 40, 52, 0.86)",
        stroke: "rgba(220, 250, 248, 0.17)",
        lineWidth: 2.2,
    });

    drawWaterShimmer(ctx, w, h, t);
    drawFoamHighlights(ctx, w, t, frontBase, frontAmp, frontFreq, frontSpeed, frontPhase);
    drawFloatingSpecks(ctx, w, h, t, particles);
    drawVignette(ctx, w, h);
};