// Shared by the visual and audio trigger; time follows the scene's motion pace.
export const pondRippleCycle = (time: number, ripple: number) => time * 0.075 + ripple * 0.34;
export function pondDropStarted(previous: number, current: number): boolean {
  return current > previous && [0, 1, 2].some(r =>
    Math.floor(pondRippleCycle(current, r)) > Math.floor(pondRippleCycle(previous, r)));
}
