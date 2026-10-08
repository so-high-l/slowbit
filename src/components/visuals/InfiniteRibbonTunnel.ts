import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;
const fract = (n: number) => n - Math.floor(n);

type TunnelRing = { depth: number; index: number };

function drawRibbonRing(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    t: number,
    index: number,
    alpha: number,
    rotation: number,
) {
    const points = 64;
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
        const p = i / points;
        const angle = p * TAU + rotation;
        const wobble =
            1 +
            Math.sin(angle * 3 + index * 0.9 + t * 0.075) * 0.045 +
            Math.sin(angle * 5 - t * 0.043 + index) * 0.018;
        const x = cx + Math.cos(angle) * radius * 1.55 * wobble;
        const y = cy + Math.sin(angle) * radius * 0.72 * wobble;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(125, 202, 220, ${alpha * 0.17})`;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(188, 235, 240, ${alpha * 0.52})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
}

export const paintRibbonTunnel: ScenePainter = ({ ctx, w, h, t }) => {
    background(ctx, w, h, "#02060c", "#091522");
    const centerX = w * 0.5 + Math.sin(t * 0.035) * w * 0.035;
    const centerY = h * 0.49 + Math.cos(t * 0.029) * h * 0.025;
    glow(ctx, centerX, centerY, Math.min(w, h) * 0.18, "rgba(90,160,190,0.08)");
    glow(ctx, centerX, centerY, Math.min(w, h) * 0.07, "rgba(140,210,220,0.09)");

    const rings: TunnelRing[] = [];
    const ringCount = 14;
    for (let i = 0; i < ringCount; i++) {
        rings.push({ index: i, depth: fract(i / ringCount + t * 0.018) });
    }
    rings.sort((a, b) => a.depth - b.depth);

    for (const ring of rings) {
        const depth = Math.pow(ring.depth, 1.75);
        const radius = Math.min(w, h) * (0.035 + depth * 0.68);
        const alpha = 0.08 + Math.pow(depth, 1.2) * 0.48;
        const driftX = Math.sin(t * 0.025 + ring.index * 0.71) * w * 0.015 * depth;
        const driftY = Math.cos(t * 0.021 + ring.index * 0.63) * h * 0.012 * depth;
        const rotation = t * 0.018 * (ring.index % 2 === 0 ? 1 : -1) + ring.index * 0.16;
        drawRibbonRing(ctx, centerX + driftX, centerY + driftY, radius, t, ring.index, alpha, rotation);
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, 1.8, 0, TAU);
    ctx.fillStyle = "rgba(222,245,248,0.62)";
    ctx.fill();

    const vignette = ctx.createRadialGradient(centerX, centerY, 60, w * 0.5, h * 0.5, Math.max(w, h) * 0.74);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
};
