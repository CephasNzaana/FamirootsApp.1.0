const TreeLogo = () => {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="mr-1">
      {/* Tree Trunk */}
      <rect x="26" y="40" width="12" height="24" fill="#000000" />
      
      {/* Tree Roots */}
      <path d="M30,64 C18,64 14,58 8,58" stroke="#000000" strokeWidth="2" fill="none" />
      <path d="M34,64 C46,64 50,58 56,58" stroke="#000000" strokeWidth="2" fill="none" />
      
      {/* Main Tree Shape */}
      <path d="M32,6 L12,40 L52,40" fill="#2E7D32" />
      
      {/* Yellow Overlay Patterns */}
      <path d="M32,16 L22,32 L42,32" fill="#FFD700" />
      
      {/* Red Overlay Patterns */}
      <path d="M32,26 L24,36 L40,36" fill="#DC143C" />
      
      {/* Small details */}
      <circle cx="32" cy="12" r="2" fill="#000000" />
      <circle cx="26" cy="20" r="1.5" fill="#000000" />
      <circle cx="38" cy="20" r="1.5" fill="#000000" />
      <circle cx="22" cy="30" r="1.5" fill="#000000" />
      <circle cx="42" cy="30" r="1.5" fill="#000000" />
    </svg>
  );
};

export default TreeLogo;