const RadarSweep = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Radar sweep line */}
      <div className="absolute inset-0 animate-radar-sweep">
        <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-success to-transparent transform -translate-y-0.5 origin-left" />
      </div>
      
      {/* Radar rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/4 h-1/4 border border-success/20 rounded-full animate-pulse" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/2 h-1/2 border border-success/15 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3/4 h-3/4 border border-success/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};

export default RadarSweep;