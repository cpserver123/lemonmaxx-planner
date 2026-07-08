"use client";

import { useEffect, useState, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────── */
interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number; // index of correct option
}

/* ─── Dummy questions ───────────────────────────────── */
const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the primary role of a Project Manager in a Breakthrough Project?",
    options: [
      "Managing social media accounts",
      "Overseeing project execution, team coordination, and milestone delivery",
      "Designing marketing creatives",
      "Handling customer support tickets",
    ],
    correct: 1,
  },
  {
    id: 2,
    question: "Which of the following is part of the weekly Breakthrough Review checklist?",
    options: [
      "Reviewing personal leave applications",
      "Tracking promise deliverables and escalations",
      "Updating office inventory",
      "Scheduling team birthday celebrations",
    ],
    correct: 1,
  },
  {
    id: 3,
    question: "What is the key criterion for enrolling a stakeholder into a Breakthrough Project?",
    options: [
      "They must have more than 5 years of experience",
      "They must be from the finance department",
      "They must be aligned with the project goal and have relevant influence or expertise",
      "They must have attended at least 3 MOMs",
    ],
    correct: 2,
  },
  {
    id: 4,
    question: "Milestone Outcomes in Breakthrough Projects are primarily used to:",
    options: [
      "Track employee attendance",
      "Define delivery expectations and assign accountability per role",
      "Set salary benchmarks for team members",
      "Schedule team outings",
    ],
    correct: 1,
  },
  {
    id: 5,
    question: "Which of the following best describes the role of a Strategic Team Captain?",
    options: [
      "Handling daily administrative tasks",
      "Leading a specific strategic focus area and ensuring accountability within it",
      "Managing the company's financial accounts",
      "Coordinating logistics for company events",
    ],
    correct: 1,
  },
];

/* ─── Props ─────────────────────────────────────────── */
interface KbTestProps {
  onClose: () => void;
  /** Called only when the user reaches the result screen and clicks "Close Test" */
  onComplete?: () => void;
}

/* ─── Component ─────────────────────────────────────── */
export default function KbTest({ onClose, onComplete }: KbTestProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const total = QUESTIONS.length;
  const q = QUESTIONS[currentIdx];
  const progress = ((currentIdx + (submitted ? 1 : 0)) / total) * 100;

  /* Unified close — exits native fullscreen then calls parent onClose */
  const handleClose = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  /* ── Screenshot / cheat detection ── */
  const [screenshotWarning, setScreenshotWarning] = useState(false);

  const handleCheatDetected = useCallback(() => {
    if (showResult) return;
    // Flash warning overlay for 1.5 s then close
    setScreenshotWarning(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  }, [handleClose, showResult]);

  /* Enter native fullscreen on mount, exit on unmount */
  useEffect(() => {
    document.documentElement.requestFullscreen().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  /* Tab switch / window hide → auto-close test */
  useEffect(() => {
    if (showResult) return; // test already completed, don't interfere
    const handleVisibility = () => {
      if (document.hidden) {
        handleClose();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [handleClose, showResult]);

  /* Screenshot detection:
     1. PrintScreen key (Windows / Linux)
     2. Window blur — screenshot tools (Snipping Tool, Win+Shift+S, Cmd+Shift+4)
        briefly steal focus from the browser window.
        We use a 300 ms debounce to ignore fast legitimate focus loss. */
  useEffect(() => {
    if (showResult) return;

    // 1. PrintScreen key
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        handleCheatDetected();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    // 2. Window blur (screenshot tool steals focus)
    let blurTimer: ReturnType<typeof setTimeout> | null = null;
    const onBlur = () => {
      blurTimer = setTimeout(() => {
        // Only trigger if document still exists and focus truly left
        handleCheatDetected();
      }, 300);
    };
    const onFocus = () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      if (blurTimer) clearTimeout(blurTimer);
    };
  }, [handleCheatDetected, showResult]);

  /* Lock body scroll while test is open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* Restore selected answer when navigating back */
  useEffect(() => {
    setSelected(answers[currentIdx]);
    setSubmitted(answers[currentIdx] !== null);
  }, [currentIdx, answers]);

  const handleSelect = (idx: number) => {
    if (submitted) return; // don't allow change after submit
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    const updated = [...answers];
    updated[currentIdx] = selected;
    setAnswers(updated);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setShowResult(true);
    }
  };

  const score = answers.filter((a, i) => a === QUESTIONS[i].correct).length;

  /* Fire onComplete the moment results are reached — before user closes */
  useEffect(() => {
    if (showResult) {
      onComplete?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  /* ── Result screen ── */
  if (showResult) {
    const pct = Math.round((score / total) * 100);
    const passed = pct >= 60;
    return (
      <FullScreenWrapper onClose={handleClose}>
        {/* Screenshot warning overlay */}
        {screenshotWarning && (
          <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-rose-950/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 text-center px-8">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center">
                <svg className="w-9 h-9 text-rose-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.75 9.75A3 3 0 0114.25 14.25M6.5 6.5A9.77 9.77 0 004 12c2 4.5 6 7 8 7s4.5-1.17 6.17-3.17M9 3.5A10.08 10.08 0 0112 3c2 0 6 2.5 8 9a9.9 9.9 0 01-1.83 3.17" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-rose-300 mb-2">Screenshot Detected!</h2>
                <p className="text-rose-200/80 text-sm">Your test is being exited due to a screenshot attempt.</p>
              </div>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Full-height column: header + scrollable cards + sticky footer */}
        <div className="w-full max-w-xl mx-auto flex flex-col" style={{ minHeight: "100vh" }}>

          {/* Header — score + title */}
          <div className="flex flex-col items-center gap-4 pt-16 pb-6 px-6 text-center">
            <div
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-[5px] ${
                passed ? "border-emerald-400" : "border-rose-400"
              }`}
            >
              <span className={`text-4xl font-extrabold ${passed ? "text-emerald-400" : "text-rose-400"}`}>
                {pct}%
              </span>
              <span className="text-xs text-[#9CA3AF] mt-0.5">{score}/{total} correct</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                {passed ? "🎉 Great Job!" : "😓 Better Luck Next Time"}
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                {passed
                  ? "You passed the test. Your responses have been recorded."
                  : "You scored below 60%. Review the documents and try again."}
              </p>
            </div>
          </div>

          {/* Scrollable answer review */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-2">Answer Review</p>
            {QUESTIONS.map((q, i) => {
              const ans = answers[i];
              const correct = ans === q.correct;
              return (
                <div
                  key={q.id}
                  className={`rounded-xl px-4 py-3.5 text-sm border ${
                    correct
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-rose-500/40 bg-rose-500/10"
                  }`}
                >
                  <p className="font-medium text-white/70 mb-1.5 text-xs">
                    Q{i + 1}. {q.question}
                  </p>
                  <p className={correct ? "text-emerald-300" : "text-rose-300"}>
                    {correct ? "✓ " : "✗ "}
                    Your answer:{" "}
                    <span className="font-semibold">{ans !== null ? q.options[ans] : "—"}</span>
                  </p>
                  {!correct && (
                    <p className="text-emerald-400 mt-1">
                      Correct: <span className="font-semibold">{q.options[q.correct]}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky footer — Close Test */}
          <div className="sticky bottom-0 bg-gradient-to-t from-[#060d18] via-[#060d18]/95 to-transparent pt-4 pb-8 px-6">
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#5750F1] to-[#7C6FF7] text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#5750F1]/30"
            >
              Close Test
            </button>
          </div>
        </div>
      </FullScreenWrapper>
    );
  }

  /* ── Question screen ── */
  return (
    <FullScreenWrapper onClose={handleClose}>
      {/* Screenshot warning overlay */}
      {screenshotWarning && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-rose-950/95 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-4 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center">
              <svg className="w-9 h-9 text-rose-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.75 9.75A3 3 0 0114.25 14.25M6.5 6.5A9.77 9.77 0 004 12c2 4.5 6 7 8 7s4.5-1.17 6.17-3.17M9 3.5A10.08 10.08 0 0112 3c2 0 6 2.5 8 9a9.9 9.9 0 01-1.83 3.17" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-rose-300 mb-2">Screenshot Detected!</h2>
              <p className="text-rose-200/80 text-sm">Your test is being exited due to a screenshot attempt.</p>
            </div>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#5750F1] uppercase tracking-widest">
            Knowledge Test
          </span>
          <span className="text-xs text-[#6B7280]">
            Question {currentIdx + 1} of {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-[#1F2A37]">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-[#5750F1] to-[#7C6FF7] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question card */}
        <div className="rounded-2xl bg-[#111928]/80 border border-[#1F2A37] p-6 md:p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <h2 className="text-lg md:text-xl font-semibold text-white leading-snug mb-6">
            {q.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let state: "idle" | "selected" | "correct" | "wrong" | "reveal" = "idle";

              if (submitted) {
                if (i === q.correct) state = "correct";
                else if (i === selected) state = "wrong";
                else state = "reveal";
              } else if (i === selected) {
                state = "selected";
              }

              const styles: Record<typeof state, string> = {
                idle:     "border-[#1F2A37] text-[#D1D5DB] hover:border-[#5750F1]/60 hover:bg-[#5750F1]/5 cursor-pointer",
                selected: "border-[#5750F1] bg-[#5750F1]/10 text-white cursor-pointer",
                correct:  "border-emerald-500 bg-emerald-500/15 text-emerald-300 cursor-default",
                wrong:    "border-rose-500 bg-rose-500/15 text-rose-300 cursor-default",
                reveal:   "border-[#1F2A37] text-[#6B7280] cursor-default opacity-60",
              };

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all duration-200 ${styles[state]}`}
                >
                  {/* Option letter */}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                      state === "correct"
                        ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                        : state === "wrong"
                        ? "border-rose-400 bg-rose-400/20 text-rose-300"
                        : state === "selected"
                        ? "border-[#5750F1] bg-[#5750F1]/30 text-[#7C6FF7]"
                        : "border-[#374151] text-[#6B7280]"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>

                  {/* Tick / cross after submit */}
                  {submitted && i === q.correct && (
                    <svg className="ml-auto w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {submitted && i === selected && i !== q.correct && (
                    <svg className="ml-auto w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between">

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={selected === null}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5750F1] to-[#7C6FF7] text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#5750F1]/30"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5750F1] to-[#7C6FF7] text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#5750F1]/30"
            >
              {currentIdx < total - 1 ? "Next Question →" : "View Results"}
            </button>
          )}
        </div>
      </div>
    </FullScreenWrapper>
  );
}

/* ─── Full-screen wrapper ───────────────────────────── */
function FullScreenWrapper({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  /* If the user exits native fullscreen externally (e.g. F11), close the overlay */
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#060d18] overflow-y-auto">
      {/* Close button — always visible top-right */}
      <button
        onClick={onClose}
        title="Exit test"
        className="fixed top-5 right-5 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-[#111928] border border-[#1F2A37] text-[#6B7280] hover:text-white hover:border-[#5750F1] transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Question screen gets centred; result screen fills naturally */}
      <div className="min-h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}