const HeartbeatLine = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width="60"
        height="20"
        viewBox="0 0 60 20"
        className="text-success"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 10 L10 10 L12 5 L14 15 L16 8 L18 12 L20 10 L60 10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="animate-heartbeat-line"
          style={{
            strokeDasharray: '100',
            strokeDashoffset: '0',
          }}
        />
        <path
          d="M0 10 L10 10 L12 5 L14 15 L16 8 L18 12 L20 10 L60 10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

export default HeartbeatLine;