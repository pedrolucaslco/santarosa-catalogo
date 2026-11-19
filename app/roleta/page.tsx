"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react";
import Image from "next/image";
import {
    Gift,
    Loader2,
    LockKeyhole,
    RefreshCw,
    RotateCcw,
    Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "./_components/Sparkles";
import { Wheel } from "./_components/Wheel";
import { campaign } from "./_lib/campaign";
import {
    calculateTargetRotation,
    formatDateTime,
    isCampaignExpired,
    type Prize,
    type StoredPrize,
} from "./_lib/roulette";

type PageStatus = "running" | "closed" | "maintenance";

interface RouletteStatus {
    prizes?: Prize[];
    soldOut?: boolean;
    spinsUsed: number;
    canSpin: boolean;
    lastPrize: StoredPrize | null;
}

export default function RoletaPage() {
    const [soldOut, setSoldOut] = useState(false);
    const [prizes, setPrizes] = useState<Prize[]>(campaign.prizes);
    const pageStatus: PageStatus = campaign.maintenance
        ? "maintenance"
        : isCampaignExpired(campaign.endDate) || soldOut
          ? "closed"
          : "running";

    const [statusLoaded, setStatusLoaded] = useState(false);
    const [checking, setChecking] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [canSpin, setCanSpin] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<StoredPrize | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [celebrating, setCelebrating] = useState(false);

    const lastPickedIsWinRef = useRef(false);

    const loadStatus = useCallback(async () => {
        setChecking(true);
        setLoadError(false);
        setCanSpin(false);

        try {
            const response = await fetch(
                `/api/roleta/status?campaign=${encodeURIComponent(campaign.id)}`,
                { cache: "no-store" },
            );

            if (!response.ok) throw new Error("status");

            const data = (await response.json()) as RouletteStatus;

            // Prêmios esgotados: só encerra para quem ainda não participou.
            if (data.prizes?.length) setPrizes(data.prizes);
            setSoldOut(Boolean(data.soldOut) && data.spinsUsed === 0);
            setCanSpin(data.canSpin);
            setResult(data.lastPrize);
            setShowResult(data.spinsUsed > 0);
            setStatusLoaded(true);
        } catch {
            setLoadError(true);
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        if (pageStatus !== "running") return;

        void loadStatus();
    }, [pageStatus, loadStatus]);

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduceMotion(media.matches);

        const handleChange = (event: MediaQueryListEvent) =>
            setReduceMotion(event.matches);

        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);

    useEffect(() => {
        if (!celebrating) return;

        const timer = window.setTimeout(() => setCelebrating(false), 2600);

        return () => window.clearTimeout(timer);
    }, [celebrating]);

    const handleSpinEnd = useCallback(() => {
        setSpinning(false);
        setShowResult(true);

        if (lastPickedIsWinRef.current) {
            setCelebrating(true);
        }
    }, []);

    const handleSpin = async () => {
        if (
            pageStatus !== "running" ||
            !canSpin ||
            checking ||
            loadError ||
            spinning ||
            preparing
        ) {
            return;
        }

        if (prizes.length === 0) {
            setError(campaign.messages.genericError);
            return;
        }

        setPreparing(true);
        setError(null);
        setCelebrating(false);

        try {
            const response = await fetch("/api/roleta/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ campaignId: campaign.id }),
                cache: "no-store",
            });
            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.ok) {
                if (response.status === 409) {
                    await loadStatus();
                    return;
                }

                setError(campaign.messages.genericError);
                return;
            }

            const nextStatus = data.status as RouletteStatus;
            const prizeIndex = data.prizeIndex;
            const drawnPrizes: Prize[] = data.prizes?.length ? data.prizes : prizes;

            if (
                !Number.isInteger(prizeIndex) ||
                prizeIndex < 0 ||
                prizeIndex >= drawnPrizes.length
            ) {
                setError(campaign.messages.genericError);
                return;
            }

            lastPickedIsWinRef.current = nextStatus.lastPrize?.isWin !== false;
            setCanSpin(nextStatus.canSpin);
            setShowResult(false);
            setResult(nextStatus.lastPrize);
            setRotation((current) =>
                calculateTargetRotation(
                    current,
                    prizeIndex,
                    drawnPrizes.length,
                    campaign.spin,
                ),
            );
            setPrizes(drawnPrizes);
            setSpinning(true);
        } catch {
            setError(campaign.messages.genericError);
        } finally {
            setPreparing(false);
        }
    };

    const themeVars = {
        "--roleta-bg": campaign.theme.background,
        "--roleta-primary": campaign.theme.primary,
        "--roleta-primary-hover": campaign.theme.primaryHover,
        "--roleta-text": campaign.theme.text,
        "--roleta-muted": campaign.theme.muted,
        "--roleta-card": campaign.theme.card,
        "--roleta-border": campaign.theme.border,
        "--roleta-highlight-bg": campaign.theme.highlight.background,
        "--roleta-highlight-text": campaign.theme.highlight.text,
        "--roleta-highlight-font": campaign.theme.highlight.fontFamily,
        "--roleta-highlight-font-style": campaign.theme.highlight.fontStyle,
    } as CSSProperties;

    const pageStyle: CSSProperties = {
        ...themeVars,
        backgroundColor: campaign.theme.background,
        color: campaign.theme.text,
    };

    if (pageStatus !== "running") {
        const isMaintenance = pageStatus === "maintenance";

        return (
            <main
                className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-6 text-center"
                style={pageStyle}
            >
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: `radial-gradient(circle at 50% 0%, ${campaign.theme.primary}, transparent 65%)`,
                        opacity: 0.08,
                    }}
                />

                <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
                    {campaign.logo.show && (
                        <Image
                            src={campaign.logo.url}
                            alt={campaign.logo.alt}
                            width={220}
                            height={72}
                            priority
                            unoptimized
                            className="h-auto w-40 brightness-0 invert"
                        />
                    )}

                    <div
                        className="mt-8 flex h-14 w-14 items-center justify-center rounded-full shadow-sm"
                        style={{
                            background: "var(--roleta-highlight-bg)",
                            color: "var(--roleta-highlight-text)",
                        }}
                    >
                        {isMaintenance ? (
                            <RefreshCw className="h-6 w-6" />
                        ) : (
                            <LockKeyhole className="h-6 w-6" />
                        )}
                    </div>

                    <h1 className="roleta-highlight-title mt-5 text-3xl text-[var(--roleta-text)]">
                        {isMaintenance
                            ? campaign.messages.maintenanceTitle
                            : campaign.messages.closedTitle}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-[var(--roleta-muted)]">
                        {isMaintenance
                            ? campaign.messages.maintenanceText
                            : campaign.messages.closedText}
                    </p>
                    <div
                        className="mt-4 h-1 w-16 rounded-full"
                        style={{ background: "var(--roleta-highlight-bg)" }}
                    />
                </div>
            </main>
        );
    }

    return (
        <main
            className="relative min-h-[100svh] w-full overflow-hidden"
            style={pageStyle}
        >
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 50% 0%, ${campaign.theme.primary}, transparent 65%)`,
                    opacity: 0.08,
                }}
            />

            <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center px-4 pb-10 pt-6 sm:px-5">
                <header className="flex w-full flex-col items-center text-center">
                    {campaign.logo.show && (
                        <Image
                            src={campaign.logo.url}
                            alt={campaign.logo.alt}
                            width={220}
                            height={72}
                            priority
                            unoptimized
                            className="h-auto w-36 sm:w-44 brightness-0 invert"
                        />
                    )}

                    <h1 className="roleta-highlight-title mt-3 text-4xl leading-tight text-[var(--roleta-text)] sm:text-5xl">
                        {campaign.title}
                    </h1>
                    <p className="mt-2 max-w-sm text-lg font-semibold uppercase leading-6 tracking-wide text-[var(--roleta-primary)]">
                        {campaign.subtitle}
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--roleta-muted)]">
                        {campaign.messages.intro}
                    </p>
                    <p className="mt-4 max-w-sm text-base font-bold uppercase leading-6 text-[var(--roleta-text)]">
                        {campaign.messages.callToAction}
                    </p>
                    <div
                        className="mt-4 h-1 w-20 rounded-full"
                        style={{ background: "var(--roleta-highlight-bg)" }}
                    />

                    {campaign.banner.show && (
                        <div className="relative mt-5 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[var(--roleta-border)] bg-[var(--roleta-card)] shadow-sm">
                            <Image
                                src={campaign.banner.url}
                                alt={campaign.banner.alt}
                                fill
                                priority
                                className="object-cover object-center"
                            />
                        </div>
                    )}
                </header>

                {statusLoaded && !loadError && error && (
                    <div
                        role="alert"
                        className="mt-4 w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200"
                    >
                        {error}
                    </div>
                )}

                {!loadError && checking && !statusLoaded && (
                    <Card className="mt-6 w-full rounded-3xl border-[var(--roleta-border)] bg-[var(--roleta-card)]">
                        <CardContent className="flex flex-col items-center gap-3 p-8 pt-8 text-center">
                            <Loader2 className="h-7 w-7 animate-spin text-[var(--roleta-primary)]" />
                            <p className="text-sm font-medium text-[var(--roleta-muted)]">
                                {campaign.messages.loading}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {loadError && (
                    <Card className="mt-6 w-full rounded-3xl border-[var(--roleta-border)] bg-[var(--roleta-card)]">
                        <CardContent className="flex flex-col items-center gap-3 p-6 pt-6 text-center">
                            <RefreshCw className="h-6 w-6 text-[var(--roleta-muted)]" />
                            <p className="text-sm font-medium text-[var(--roleta-text)]">
                                {campaign.messages.statusError}
                            </p>
                            <Button
                                type="button"
                                onClick={() => void loadStatus()}
                                disabled={checking}
                                className="mt-1 h-11 rounded-xl px-5 text-sm font-semibold text-white hover:opacity-90"
                                style={{
                                    background: "var(--roleta-highlight-bg)",
                                }}
                            >
                                {checking ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {campaign.messages.retry}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {statusLoaded && !loadError && (
                    <>
                        <section className="mt-4 w-full rounded-3xl border border-[var(--roleta-border)] bg-[var(--roleta-card)] p-4 shadow-sm sm:p-5">
                            <div className="relative">
                                <Wheel
                                    prizes={prizes}
                                    rotation={rotation}
                                    spinning={spinning}
                                    preparing={preparing}
                                    canSpin={canSpin && !checking && !loadError}
                                    durationMs={
                                        reduceMotion
                                            ? 450
                                            : campaign.spin.durationMs
                                    }
                                    primaryColor={campaign.theme.primary}
                                    highlightBackground={
                                        campaign.theme.highlight.background
                                    }
                                    highlightTextColor={
                                        campaign.theme.highlight.text
                                    }
                                    labels={{
                                        spin: campaign.messages.spin,
                                        spinning: campaign.messages.spinning,
                                        preparing: campaign.messages.preparing,
                                        locked: campaign.messages.locked,
                                    }}
                                    onSpin={() => void handleSpin()}
                                    onSpinEnd={handleSpinEnd}
                                />

                                {celebrating && !reduceMotion && <Sparkles />}
                            </div>

                            <p className="mt-4 text-center text-xs leading-5 text-[var(--roleta-muted)]">
                                {preparing || spinning
                                    ? campaign.messages.spinning
                                    : canSpin
                                      ? campaign.messages.spinHint
                                      : campaign.messages.alreadySpunText}
                            </p>
                        </section>

                        {showResult && result && (
                            <Card
                                role="status"
                                aria-live="polite"
                                className="mt-4 w-full overflow-hidden rounded-3xl border-[var(--roleta-border)] bg-[var(--roleta-card)] shadow-sm"
                            >
                                <CardContent className="p-5 pt-5 text-center sm:p-6 sm:pt-6">
                                    <div
                                        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-inner"
                                        style={{
                                            backgroundColor:
                                                result.color ??
                                                campaign.theme.primary,
                                            color:
                                                result.textColor ?? "#ffffff",
                                        }}
                                    >
                                        {result.isWin === false ? (
                                            <RotateCcw className="h-7 w-7" />
                                        ) : (
                                            <Gift className="h-7 w-7" />
                                        )}
                                    </div>

                                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--roleta-muted)]">
                                        {result.isWin === false
                                            ? campaign.messages.loseTitle
                                            : campaign.messages.winTitle}
                                    </p>

                                    <h2
                                        className="roleta-highlight-title mt-1 text-3xl leading-tight sm:text-4xl"
                                        style={{
                                            color:
                                                result.isWin === false
                                                    ? campaign.theme.muted
                                                    : campaign.theme.text,
                                        }}
                                    >
                                        {result.label}
                                    </h2>

                                    {result.description && (
                                        <p className="mt-2 text-sm leading-6 text-[var(--roleta-muted)]">
                                            {result.description}
                                        </p>
                                    )}

                                    {result.isWin !== false && (
                                        <p className="mt-3 text-sm font-semibold text-[var(--roleta-text)]">
                                            {campaign.messages.showToStaff}
                                        </p>
                                    )}

                                    <div className="mt-4 flex flex-col items-center gap-1 text-xs text-[var(--roleta-muted)]">
                                        {result.spinId && (
                                            <p className="flex items-center gap-1.5">
                                                <Ticket className="h-3.5 w-3.5" />
                                                {campaign.messages.receiptLabel}
                                                :
                                                <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--roleta-text)]">
                                                    {result.spinId}
                                                </span>
                                            </p>
                                        )}
                                        <p>{formatDateTime(result.at)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                <footer className="mt-8 flex w-full flex-col items-center gap-2 text-center">
                    <p className="max-w-sm text-sm leading-6 text-[var(--roleta-muted)]">
                        {campaign.messages.callToActionHint}
                    </p>
                    <h2 className="mt-4 text-xs font-bold uppercase tracking-wider text-[var(--roleta-text)]">
                        {campaign.messages.rulesTitle}
                    </h2>
                    <ul className="max-w-sm list-disc space-y-1 pl-4 text-left text-xs leading-5 text-[var(--roleta-muted)]">
                        {campaign.messages.rules.map((rule) => (
                            <li key={rule}>{rule}</li>
                        ))}
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-[var(--roleta-text)]">
                        {campaign.messages.closing}
                    </p>
                    <p className="text-[11px] text-[var(--roleta-muted)]">
                        © {new Date().getFullYear()} {campaign.storeName}
                    </p>
                </footer>
            </div>
        </main>
    );
}
