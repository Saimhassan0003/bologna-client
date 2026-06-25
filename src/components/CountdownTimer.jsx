import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ deadline, onExpire }) => {
  const calculateTimeLeft = () => {
    if (!deadline) return 0;
    const difference = new Date(deadline) - new Date();
    return difference > 0 ? Math.floor(difference / 1000) : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Initial sync
    setSecondsLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (secondsLeft <= 0) {
    return (
      <span className="text-red-600 font-bold font-mono">
        EXPIRED (00:00)
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm animate-pulse">
      <span className="text-xs font-extrabold text-amber-800 uppercase tracking-widest mb-1">Documents Upload Deadline</span>
      <span className="text-3xl font-extrabold font-mono text-amber-700 tracking-wider">
        {formatTime(secondsLeft)}
      </span>
      <span className="text-[10px] text-amber-600 font-medium mt-1">Remaining seconds / minutes</span>
    </div>
  );
};

export default CountdownTimer;
