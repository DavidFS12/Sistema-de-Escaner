import React, { useRef } from "react";

interface GooeyButtonProps {
  label: string;
  onClick?: () => void;
  delayBeforeAction?: number;
}

const GooeyButton: React.FC<GooeyButtonProps> = ({
  label,
  onClick,
  delayBeforeAction = 1000,
}) => {
  const filterRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Función para generar una burbuja
  const makeParticles = (element: HTMLElement) => {
    const particleCount = 12;
    const particleDistances: [number, number] = [90, 10];
    const particleR = 100;
    const timeVariance = 300;
    const animationTime = 600;

    const noise = (n = 1) => n / 2 - Math.random() * n;
    const getXY = (
      distance: number,
      pointIndex: number,
      totalPoints: number
    ): [number, number] => {
      const angle =
        ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
      return [distance * Math.cos(angle), distance * Math.sin(angle)];
    };

    const createParticle = (i: number) => {
      let rotate = noise(particleR / 10);
      const colors = ["#ffef18"];
      const t = animationTime * 2 + noise(timeVariance * 2);
      return {
        start: getXY(particleDistances[0], particleCount - i, particleCount),
        end: getXY(
          particleDistances[1] + noise(7),
          particleCount - i,
          particleCount
        ),
        time: t,
        scale: 1 + noise(0.2),
        color: colors[Math.floor(Math.random() * colors.length)],
        rotate:
          rotate > 0
            ? (rotate + particleR / 20) * 10
            : (rotate - particleR / 20) * 10,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      const p = createParticle(i);
      const particle = document.createElement("span");
      const point = document.createElement("span");
      particle.classList.add("particle");
      particle.style.setProperty("--start-x", `${p.start[0]}px`);
      particle.style.setProperty("--start-y", `${p.start[1]}px`);
      particle.style.setProperty("--end-x", `${p.end[0]}px`);
      particle.style.setProperty("--end-y", `${p.end[1]}px`);
      particle.style.setProperty("--time", `${p.time}ms`);
      particle.style.setProperty("--scale", `${p.scale}`);
      particle.style.setProperty("--color", p.color);
      particle.style.setProperty("--rotate", `${p.rotate}deg`);
      point.classList.add("point");
      particle.appendChild(point);
      element.appendChild(particle);
      requestAnimationFrame(() => {
        element.classList.add("active");
      });
      setTimeout(() => {
        try {
          element.removeChild(particle);
        } catch {}
      }, p.time);
    }
  };

  const handleClick = () => {
    const el = filterRef.current;
    if (!el) return;
    makeParticles(el);
    el.classList.add("active");

    setTimeout(() => {
      el.classList.remove("active");
      onClick && onClick();
    }, delayBeforeAction);
  };

  return (
    <>
      <style>
        {`
          .gooey-button {
            position: relative;
            background: transparents;
            border: none;
            color: white;
            font-size: 1.2rem;
            font-weight: bold;
            font-family: var(--font-sans);
            padding: 20px;
            cursor: pointer;
            overflow: hidden;
            z-index: 2;
            width: 100%;
            border-radius: 40px;
            border: 2px solid white;
          }

          .gooey-button .effect {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            z-index: 1;
            pointer-events: none;
          }

          .gooey-button .filter {
            filter: blur(10px) contrast(100) blur(0);
            mix-blend-mode: lighten;
          }

          .gooey-button .filter::after {
            content: "";
            position: absolute;
            inset: 0;
            background: white;
            transform: scale(0);
            opacity: 0;
            z-index: -1;
            border-radius: 9999px;
          }

          .effect.filter::after {
            content: "";
            position: absolute;
            background: transparent;
            inset: 0;
            transform: scale(0);
            opacity: 0;
            z-index: -1;
            border-radius: 9999px;
          }

          .gooey-button .filter.active::after {
            animation: pill 0.3s ease both;
          }

          @keyframes pill {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          .particle,
          .point {
            display: block;
            opacity: 0;
            width: 5px;
            height: 5px;
            border-radius: 9999px;
            transform-origin: center;
          }

          .particle {
            --time: 2s;
            position: absolute;
            top: calc(50% - 20px);
            left: calc(50% - 20px);
            animation: particle calc(var(--time)) ease 1 -350ms;
          }

          .point {
            background: var(--color);
            opacity: 1;
            animation: point calc(var(--time)) ease 1 -350ms;
          }

          @keyframes particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }

          @keyframes point {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            25% {
              transform: scale(calc(var(--scale) * 0.25));
            }
            38% {
              opacity: 1;
            }
            65% {
              transform: scale(var(--scale));
              opacity: 1;
            }
            100% {
              transform: scale(0);
              opacity: 0;
            }
          }
        `}
      </style>

      <button ref={buttonRef} className="gooey-button" onClick={handleClick}>
        {label}
        <span ref={filterRef} className="effect filter"></span>
      </button>
    </>
  );
};

export default GooeyButton;
