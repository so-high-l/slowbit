import { background, glow, type ScenePainter } from "./drawing";

const TAU = Math.PI * 2;

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number) {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

type Point = { x: number; y: number };
type Curve = { start: Point; c1: Point; c2: Point; end: Point };

function fieldCurve(left: Point, right: Point, amount: number, h: number): Curve {
    const offset = amount * h * 0.32;
    return {
        start: { x: left.x, y: left.y + amount * 10 },
        c1: { x: left.x + (right.x - left.x) * 0.27, y: left.y + offset },
        c2: { x: left.x + (right.x - left.x) * 0.73, y: right.y + offset },
        end: { x: right.x, y: right.y + amount * 10 },
    };
}

function drawCurve(ctx: CanvasRenderingContext2D, curve: Curve, color: string, width: number) {
    ctx.beginPath();
    ctx.moveTo(curve.start.x, curve.start.y);
    ctx.bezierCurveTo(curve.c1.x, curve.c1.y, curve.c2.x, curve.c2.y, curve.end.x, curve.end.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
}

export const paintMagneticField: ScenePainter = ({ ctx, w, h, t }) => {
    background(ctx, w, h, "#03070b", "#0b151d");

    const left: Point = {
        x: w * 0.38 + Math.sin(t * 0.045) * w * 0.025,
        y: h * 0.5 + Math.cos(t * 0.037) * h * 0.035,
    };
    const right: Point = {
        x: w * 0.62 + Math.cos(t * 0.041) * w * 0.025,
        y: h * 0.5 + Math.sin(t * 0.033) * h * 0.035,
    };

    const fieldGlow = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, Math.min(w, h) * 0.45);
    fieldGlow.addColorStop(0, "rgba(42,95,115,0.08)");
    fieldGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fieldGlow;
    ctx.fillRect(0, 0, w, h);

    const lineCount = 19;
    ctx.lineCap = "round";
    for (let i = 0; i < lineCount; i++) {
        const amount = (i - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
        const curve = fieldCurve(left, right, amount, h);
        const strength = 1 - Math.abs(amount) * 0.35;
        drawCurve(ctx, curve, `rgba(95, 188, 207, ${0.025 + strength * 0.035})`, 5);
        drawCurve(ctx, curve, `rgba(160, 224, 231, ${0.08 + strength * 0.12})`, 1);
    }

    for (const [i, amount] of [-0.72, -0.32, 0.28, 0.7].entries()) {
        const curve = fieldCurve(left, right, amount, h);
        const progress = (t * (0.025 + i * 0.004) + i * 0.23) % 1;
        const x = cubicPoint(curve.start.x, curve.c1.x, curve.c2.x, curve.end.x, progress);
        const y = cubicPoint(curve.start.y, curve.c1.y, curve.c2.y, curve.end.y, progress);
        glow(ctx, x, y, 10, "rgba(170,235,235,0.12)");
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, TAU);
        ctx.fillStyle = "rgba(225,250,246,0.65)";
        ctx.fill();
    }

    glow(ctx, left.x, left.y, 46, "rgba(110,220,220,0.11)");
    glow(ctx, right.x, right.y, 46, "rgba(155,170,240,0.10)");
    ctx.beginPath();
    ctx.arc(left.x, left.y, 4, 0, TAU);
    ctx.fillStyle = "rgba(185,242,235,0.78)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(right.x, right.y, 4, 0, TAU);
    ctx.fillStyle = "rgba(198,208,245,0.75)";
    ctx.fill();

    for (let i = 1; i <= 2; i++) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.25 + i);
        const radius = 11 + i * 9 + pulse * 3;
        ctx.beginPath();
        ctx.arc(left.x, left.y, radius, 0, TAU);
        ctx.strokeStyle = `rgba(145,220,218,${0.035 + pulse * 0.025})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(right.x, right.y, radius, 0, TAU);
        ctx.strokeStyle = `rgba(175,190,236,${0.035 + pulse * 0.025})`;
        ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, 80, w * 0.5, h * 0.5, Math.max(w, h) * 0.76);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.4)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
};
