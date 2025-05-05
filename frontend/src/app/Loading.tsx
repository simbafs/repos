export function Loading() {
  return (
    <p className="loading text-3xl">
      Loading<span>.</span>
      <span>.</span>
      <span>.</span>
      <style jsx>{`
        .loading span {
          opacity: 0;
          animation: fadeInOut 3s infinite;
        }
        .loading span:nth-child(1) {
          animation-delay: 0s;
        }
        .loading span:nth-child(2) {
          animation-delay: 1s;
        }
        .loading span:nth-child(3) {
          animation-delay: 2s;
        }
        @keyframes fadeInOut {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </p>
  );
}
