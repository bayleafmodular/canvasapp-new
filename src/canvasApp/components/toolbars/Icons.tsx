"use client";
function PolylineIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12h4l4-8 4 16 4-8h2" />
    </svg>;
}
function ArcIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 0 1 18 0" />
    </svg>;
}
function WallIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8h18M3 16h18M6 8l3 8M11 8l3 8M16 8l3 8" />
    </svg>;
}
function BeamIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 6h14" />
      <path d="M5 18h14" />
      <path d="M9 6v12" />
      <path d="M15 6v12" />
      <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2,2" />
    </svg>;
}
function LintelIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="6" width="18" height="6" rx="1" />
      <path d="M6 12v6" />
      <path d="M18 12v6" />
    </svg>;
}
export {
  ArcIcon,
  BeamIcon,
  LintelIcon,
  WallIcon,
  PolylineIcon
};
