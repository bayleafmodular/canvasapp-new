"use client";

function PolylineIcon(props: any) {
  return (
    <div className="w-5 h-5 flex items-center justify-center font-mono font-extrabold text-[10px] text-current border border-current/30 rounded select-none shrink-0" {...props}>
      RR
    </div>
  );
}

function ArcIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 0 1 18 0" />
    </svg>
  );
}

function WallIcon(props: any) {
  return (
    <div className="w-5 h-5 flex items-center justify-center font-mono font-extrabold text-xs text-current border border-current/30 rounded select-none shrink-0" {...props}>
      S
    </div>
  );
}

function BeamIcon(props: any) {
  return (
    <div className="w-5 h-5 flex items-center justify-center font-mono font-extrabold text-xs text-current border border-current/30 rounded select-none shrink-0" {...props}>
      B
    </div>
  );
}

function LintelIcon(props: any) {
  return (
    <div className="w-5 h-5 flex items-center justify-center font-mono font-extrabold text-xs text-current border border-current/30 rounded select-none shrink-0" {...props}>
      A
    </div>
  );
}

export {
  ArcIcon,
  BeamIcon,
  LintelIcon,
  WallIcon,
  PolylineIcon
};
