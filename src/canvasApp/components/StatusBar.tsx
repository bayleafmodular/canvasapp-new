"use client";
import { useCadStore }  from '@/store/useCadStore';
function StatusBar() {
  const { stagePosition, stageScale, snapEnabled, gridEnabled, orthoEnabled, showMeasurements } = useCadStore();
  return <div className="flex justify-between items-center w-full overflow-x-auto scrollbar-hide whitespace-nowrap gap-4 min-w-0">
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        <div className="flex items-center space-x-1 md:space-x-2">
          <span className="text-[#777] hidden sm:inline">COORDS:</span>
          <span className="text-white">
            {(-stagePosition.x / stageScale).toFixed(1)}, {(-stagePosition.y / stageScale).toFixed(1)}
          </span>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 border-l border-[#333] pl-2 md:pl-4">
          <span className={snapEnabled ? "text-[#4a90e2]" : "text-[#777]"}>SNAP</span>
          <span className={gridEnabled ? "text-[#4a90e2]" : "text-[#777]"}>GRID</span>
          <span className={orthoEnabled ? "text-[#4a90e2]" : "text-[#777]"}>ORTHO</span>
          <span className={showMeasurements ? "text-[#4a90e2]" : "text-[#777]"}>DYN</span>
        </div>
      </div>
      <div className="flex items-center space-x-3 md:space-x-4 shrink-0">
        <div className="flex items-center space-x-1 hidden sm:flex">
          <span className="text-[#777]">UNITS:</span>
          <span className="text-white uppercase">MM</span>
        </div>
        <div className="bg-[#1a1b1e] px-1 md:px-2 py-0.5 border border-[#333] rounded hidden sm:block">
          1:1 SCALE
        </div>
        <span className="text-white">{(stageScale * 100).toFixed(0)}%</span>
      </div>
    </div>;
}
export {
  StatusBar
};
