import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

function threadPoint(q: number, t: number, w: number, h: number) {
    const cx = w * 0.5 + Math.sin(t * 0.035) * w * 0.045;
    const cy = h * 0.5 + Math.cos(t * 0.027) * h * 0.035;
    const angle = q + Math.sin(q * 0.31 + t * 0.025) * 0.38;
    const breathing = 1 + Math.sin(q * 0.71 - t * 0.04) * 0.08;
    return {
        x: cx + Math.cos(angle) * w * 0.27 * breathing + Math.sin(q * 1.73 + t * 0.03) * w * 0.035,
        y: cy + Math.sin(angle * 1.17) * h * 0.21 * breathing + Math.sin(q * 2.13 - t * 0.025) * h * 0.022,
    };
}

export const paintFlowingThread: ScenePainter = ({ ctx, w, h, t }) => {
    background(ctx, w, h, "#03070d", "#0a1520");

    const atmosphere = ctx.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.62);
    atmosphere.addColorStop(0, "rgba(36, 72, 92, 0.12)");
    atmosphere.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = atmosphere;
    ctx.fillRect(0, 0, w, h);

    const segments = 150;
    const headQ = t * 0.22;
    const tailLength = 7.2;
    let previous = threadPoint(headQ - tailLength, t, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const point = threadPoint(headQ - tailLength + progress * tailLength, t, w, h);
        const alpha = Math.pow(progress, 2.1);

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(110, 206, 218, ${alpha * 0.07})`;
        ctx.lineWidth = 8 + alpha * 6;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(142, 226, 230, ${alpha * 0.22})`;
        ctx.lineWidth = 2.8 + alpha * 1.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = `rgba(220, 248, 246, ${alpha * 0.7})`;
        ctx.lineWidth = 0.7 + alpha * 1.1;
        ctx.stroke();
        previous = point;
    }

    const head = threadPoint(headQ, t, w, h);
    glow(ctx, head.x, head.y, 32, "rgba(130,230,230,0.16)");
    glow(ctx, head.x, head.y, 11, "rgba(220,250,245,0.2)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.2, 0, TAU);
    ctx.fillStyle = "rgba(235,255,250,0.86)";
    ctx.fill();

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, 70, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
};
