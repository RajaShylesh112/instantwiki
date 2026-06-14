"use client";
import React from 'react';

const GlobalStylesAndKeyframes = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes gradientShift {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(30deg); }
    }
    @keyframes lineMove {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes cornerLineAnimation {
      0% { stroke-dashoffset: 0; }
      25% { stroke-dashoffset: 100; }
      50% { stroke-dashoffset: 200; }
      75% { stroke-dashoffset: 300; }
      100% { stroke-dashoffset: 400; }
    }
    @keyframes gridMove {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
  `}} />
);

export function AnimatedBackgroundLines({ children }: { children: React.ReactNode }) {
  const lineWrapperTops = ['top-[10%]', 'top-[30%]', 'top-[50%]', 'top-[70%]', 'top-[90%]'];

  return (
    <>
      <GlobalStylesAndKeyframes />
      <div className="relative w-full flex items-center justify-center overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0 w-full h-full bg-[linear-gradient(rgba(107,56,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(107,56,212,0.03)_1px,transparent_1px)] bg-[length:50px_50px] animate-[gridMove_20s_linear_infinite] z-0 pointer-events-none"
        />

        {/* Animated Background Lines */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-[1] pointer-events-none opacity-40">
          {lineWrapperTops.map((topClass, index) => (
            <div key={index} className={`absolute w-full h-[100px] ${topClass}`}>
              <div className="w-full h-0.5 relative overflow-hidden">
                <div
                  className={`absolute top-0 w-full h-full animate-[lineMove_4s_linear_infinite] ${
                    index % 2 !== 0 ? '[animation-direction:reverse] [animation-delay:2s]' : ''
                  }`}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, #6b38d4 20%, #006b5e 50%, #6b38d4 80%, transparent 100%)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Corner Lines - hidden on small screens, visible on md and up */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[100px] z-[5] pointer-events-none opacity-30">
          <svg
            className="absolute top-1/2 -translate-y-1/2 left-[-150px] w-[120px] h-[60px] animate-[cornerLineAnimation_6s_linear_infinite]"
            viewBox="0 0 120 60"
            stroke="#6b38d4"
            strokeWidth="2"
            fill="none"
            strokeDasharray="50"
          >
            <path d="M120 0 L20 0 Q0 0 0 20 L0 60" />
          </svg>
          <svg
            className="absolute top-1/2 -translate-y-1/2 right-[-150px] w-[120px] h-[60px] transform scale-x-[-1] animate-[cornerLineAnimation_6s_linear_infinite] [animation-delay:3s]"
            viewBox="0 0 120 60"
            stroke="#006b5e"
            strokeWidth="2"
            fill="none"
            strokeDasharray="50"
          >
            <path d="M120 0 L20 0 Q0 0 0 20 L0 60" />
          </svg>
        </div>

        {/* Main Content */}
        <div className="relative z-[10] w-full">
          {children}
        </div>
      </div>
    </>
  );
}
