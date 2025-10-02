import React from "react";

const AnimatedBackground = ({ children }) => {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-blue-100 to-white">
      {/* Circles with animation */}
      <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-blue-300 opacity-70 animate-blob1 mix-blend-lighten filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-blue-400 opacity-60 animate-blob2 mix-blend-lighten filter blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-2/3 left-2/3 w-80 h-80 rounded-full bg-blue-200 opacity-50 animate-blob3 mix-blend-lighten filter blur-xl -translate-x-1/2 -translate-y-1/2"></div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style jsx>{`
        @keyframes blob1 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-40%, -60%) scale(1.2);
          }
        }
        @keyframes blob2 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-60%, -40%) scale(1.3);
          }
        }
        @keyframes blob3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-55%, -55%) scale(1.1);
          }
        }
        .animate-blob1 {
          animation: blob1 7s ease-in-out infinite;
        }
        .animate-blob2 {
          animation: blob2 9s ease-in-out infinite;
        }
        .animate-blob3 {
          animation: blob3 11s ease-in-out infinite;
        }
        .mix-blend-lighten {
          mix-blend-mode: lighten;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
