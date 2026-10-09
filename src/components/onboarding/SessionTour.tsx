"use client";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { sessionTourSteps, SESSION_TOUR_ID } from "@/data/onboarding";
import { usePreferences } from "@/hooks/usePreferences";
import { analytics } from "@/lib/analytics";

type SessionTourProps = {
    enabled: boolean;
    force?: boolean;
    onActiveChange?: (active: boolean) => void;
};

type SpotlightRect = {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
};

type TooltipPosition = {
    top: number;
    left: number;
};

const SPOTLIGHT_PADDING = 10;
const TOOLTIP_WIDTH = 300;
const VIEWPORT_PADDING = 16;
const MASK_ID = "slowbit-session-tour-mask";

function targetSelector(target: string) {
    return `[data-tour="${target}"]`;
}

export default function SessionTour({ enabled, force = false, onActiveChange }: SessionTourProps) {
    const { hasCompletedTour, completeTour } = usePreferences();
    const [portalReady, setPortalReady] = useState(false);
    const [open, setOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
    const [tooltip, setTooltip] = useState<TooltipPosition | null>(null);
    const spotlightRef = useRef<SVGRectElement>(null);
    const ringRef = useRef<SVGRectElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);
    const targetRef = useRef<Element | null>(null);
    const startedRef = useRef(false);
    const viewedStepRef = useRef(-1);
    const reducedMotionRef = useRef(false);
    const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setPortalReady(true);
        reducedMotionRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    const finish = useCallback((skipped: boolean) => {
        const step = sessionTourSteps[stepIndex];
        if (skipped) analytics.tourSkipped(SESSION_TOUR_ID, stepIndex + 1, step.target);
        else analytics.tourCompleted(SESSION_TOUR_ID, stepIndex + 1, step.target);
        completeTour(SESSION_TOUR_ID);
        setOpen(false);
        setSpotlight(null);
        setTooltip(null);
        targetRef.current = null;
        onActiveChange?.(false);
        previousFocus.current?.focus({ preventScroll: true });
        previousFocus.current = null;
    }, [completeTour, onActiveChange, stepIndex]);

    const positionTooltip = useCallback((rect: SpotlightRect): TooltipPosition => {
        const cardHeight = tooltipRef.current?.offsetHeight ?? 190;
        const cardWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
        const spaceBelow = window.innerHeight - (rect.y + rect.height);
        const top = spaceBelow >= cardHeight + VIEWPORT_PADDING
            ? rect.y + rect.height + VIEWPORT_PADDING
            : rect.y - cardHeight - VIEWPORT_PADDING;
        return {
            top: Math.max(VIEWPORT_PADDING, Math.min(top, window.innerHeight - cardHeight - VIEWPORT_PADDING)),
            left: Math.max(VIEWPORT_PADDING, Math.min(
                rect.x + rect.width / 2 - cardWidth / 2,
                window.innerWidth - cardWidth - VIEWPORT_PADDING,
            )),
        };
    }, []);

    const measureTarget = useCallback(() => {
        if (!open) return;
        const step = sessionTourSteps[stepIndex];
        const target = document.querySelector(targetSelector(step.target));
        if (!target) {
            const nextIndex = sessionTourSteps.findIndex(
                (candidate, index) => index > stepIndex && document.querySelector(targetSelector(candidate.target)),
            );
            if (nextIndex >= 0) setStepIndex(nextIndex);
            else finish(true);
            return;
        }
        targetRef.current = target;
        const bounds = target.getBoundingClientRect();
        const computed = getComputedStyle(target);
        const parsedRadius = Number.parseFloat(computed.borderRadius);
        const nextRect: SpotlightRect = {
            x: Math.max(6, bounds.left - SPOTLIGHT_PADDING),
            y: Math.max(6, bounds.top - SPOTLIGHT_PADDING),
            width: Math.min(window.innerWidth - 12, bounds.width + SPOTLIGHT_PADDING * 2),
            height: Math.min(window.innerHeight - 12, bounds.height + SPOTLIGHT_PADDING * 2),
            rx: Number.isFinite(parsedRadius) ? parsedRadius + SPOTLIGHT_PADDING : 12,
        };
        setViewport({ width: window.innerWidth, height: window.innerHeight });
        setTooltip(positionTooltip(nextRect));
        if (!spotlightRef.current) {
            setSpotlight(nextRect);
        } else if (reducedMotionRef.current) {
            gsap.set(spotlightRef.current, { attr: nextRect });
            if (ringRef.current) gsap.set(ringRef.current, { attr: nextRect });
        } else {
            gsap.killTweensOf(spotlightRef.current);
            if (ringRef.current) gsap.killTweensOf(ringRef.current);
            gsap.to(spotlightRef.current, {
                attr: nextRect,
                duration: 0.55,
                ease: "power3.inOut",
            });
            if (ringRef.current) {
                gsap.to(ringRef.current, {
                    attr: nextRect,
                    duration: 0.55,
                    ease: "power3.inOut",
                });
            }
        }
    }, [finish, open, positionTooltip, stepIndex]);

    const findFirstTarget = useCallback((attempt: number) => {
        const first = document.querySelector(targetSelector(sessionTourSteps[0].target));
        if (first) {
            previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setStepIndex(0);
            setOpen(true);
            onActiveChange?.(true);
            analytics.tourStarted(SESSION_TOUR_ID, 1, sessionTourSteps[0].target);
            return;
        }
        if (attempt < 8) {
            retryRef.current = setTimeout(() => findFirstTarget(attempt + 1), 100);
        }
    }, [onActiveChange]);

    useEffect(() => {
        if (!portalReady || !enabled || startedRef.current || (!force && hasCompletedTour(SESSION_TOUR_ID))) return;
        startedRef.current = true;
        const timer = setTimeout(() => findFirstTarget(0), 700);
        return () => {
            clearTimeout(timer);
            if (retryRef.current) clearTimeout(retryRef.current);
        };
    }, [enabled, findFirstTarget, force, hasCompletedTour, portalReady]);

    useEffect(() => {
        if (!open) return;
        const frame = requestAnimationFrame(measureTarget);
        const onViewportChange = () => measureTarget();
        window.addEventListener("resize", onViewportChange);
        window.addEventListener("scroll", onViewportChange, true);
        document.addEventListener("fullscreenchange", onViewportChange);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", onViewportChange);
            window.removeEventListener("scroll", onViewportChange, true);
            document.removeEventListener("fullscreenchange", onViewportChange);
        };
    }, [measureTarget, open, stepIndex]);

    useEffect(() => {
        if (!open) return;
        const step = sessionTourSteps[stepIndex];
        if (viewedStepRef.current !== stepIndex) {
            viewedStepRef.current = stepIndex;
            if (stepIndex > 0) analytics.tourStepViewed(SESSION_TOUR_ID, stepIndex + 1, step.target);
        }
        requestAnimationFrame(() => tooltipRef.current?.focus());
    }, [open, stepIndex]);

    useEffect(() => {
        if (!enabled && open) finish(true);
    }, [enabled, finish, open]);

    useEffect(() => {
        if (!open) return;
        const key = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                finish(true);
            } else if (event.key === "ArrowRight" || event.key === "Enter") {
                event.preventDefault();
                if (stepIndex === sessionTourSteps.length - 1) finish(false);
                else setStepIndex((value) => value + 1);
            } else if (event.key === "ArrowLeft" && stepIndex > 0) {
                event.preventDefault();
                setStepIndex((value) => value - 1);
            }
        };
        window.addEventListener("keydown", key);
        return () => window.removeEventListener("keydown", key);
    }, [finish, open, stepIndex]);

    if (!portalReady || !open || !spotlight || !tooltip) return null;
    const step = sessionTourSteps[stepIndex];
    const isLast = stepIndex === sessionTourSteps.length - 1;
    return createPortal(
        <div className="session-tour" role="presentation">
            <svg
                className="session-tour-overlay"
                aria-hidden="true"
                width={viewport.width}
                height={viewport.height}
                viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            >
                <defs>
                    <mask id={MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width={viewport.width} height={viewport.height}>
                        <rect width={viewport.width} height={viewport.height} fill="white" />
                        <rect ref={spotlightRef} {...spotlight} fill="black" />
                    </mask>
                </defs>
                <rect width={viewport.width} height={viewport.height} fill="rgba(0, 0, 0, 0.76)" mask={`url(#${MASK_ID})`} />
                <rect ref={ringRef} {...spotlight} className="session-tour-ring" />
            </svg>
            <div
                ref={tooltipRef}
                className="session-tour-tooltip"
                role="dialog"
                aria-modal="true"
                aria-labelledby="session-tour-title"
                tabIndex={-1}
                style={{ top: tooltip.top, left: tooltip.left, width: "min(300px, calc(100vw - 32px))" }}
            >
                <span className="session-tour-step">{stepIndex + 1} / {sessionTourSteps.length}</span>
                <h2 id="session-tour-title">{step.title}</h2>
                <p>{step.description}</p>
                <div className="session-tour-actions">
                    <button className="session-tour-skip" onClick={() => finish(true)}>Skip</button>
                    {stepIndex > 0 && <button onClick={() => setStepIndex((value) => value - 1)}>Back</button>}
                    <button className="session-tour-next" onClick={() => isLast ? finish(false) : setStepIndex((value) => value + 1)}>
                        {isLast ? "Done" : "Next"}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
