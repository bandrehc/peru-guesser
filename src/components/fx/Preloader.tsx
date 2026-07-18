"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Preloader «Telar»: un hilo carmesí se teje bajo el logotipo y la cortina
 * se levanta revelando el sitio. Se renderiza en el HTML inicial (sin flash
 * ni CLS) y se desmonta al terminar. Con prefers-reduced-motion solo hace
 * un fundido breve. `.preloader-fallback` (CSS) lo retira aunque falle JS.
 */
export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const mm = gsap.matchMedia(rootRef);

    mm.add(
      {
        motionReduce: "(prefers-reduced-motion: reduce)",
        motionOk: "(prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { motionReduce } = ctx.conditions as { motionReduce: boolean };
        const finish = () => setDone(true);

        if (motionReduce) {
          gsap.to(rootRef.current, {
            autoAlpha: 0,
            duration: 0.2,
            onComplete: finish,
          });
          return;
        }

        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: finish,
        });
        tl.fromTo(".pre-hilo", { scaleX: 0 }, { scaleX: 1, duration: 0.5 })
          .fromTo(
            ".pre-word",
            { y: 26, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, stagger: 0.08 },
            "-=0.3"
          )
          .to(rootRef.current, {
            yPercent: -100,
            duration: 0.55,
            ease: "power3.inOut",
            delay: 0.15,
          });
      }
    );

    return () => mm.revert();
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="preloader-fallback fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-telar"
    >
      <p className="flex overflow-hidden text-4xl font-bold tracking-tight [font-family:var(--font-space-grotesk)]">
        <span className="pre-word text-tinta">Peru</span>
        <span className="pre-word text-carmesi">Guesser</span>
      </p>
      <div className="pre-hilo hilo-sep w-44" />
    </div>
  );
}
