const TreeLogo = () => {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="mr-1">
      {/* Tree Trunk (Black) */}
      <rect x="26" y="40" width="12" height="24" fill="#000000" />
      
      {/* Main Branches */}
      <path d="M32,8 L18,30 L46,30" fill="#FFD700" />
      
      {/* Left branch */}
      <path d="M26,24 L16,36 L30,36" fill="#DC143C" />
      
      {/* Right branch */}
      <path d="M38,24 L48,36 L34,36" fill="#FFD700" />
      
      {/* Small branches */}
      <path d="M22,20 L15,26 L25,26" fill="#000000" />
      <path d="M42,20 L49,26 L39,26" fill="#000000" />
      
      {/* Top branch */}
      <path d="M32,4 L24,14 L40,14" fill="#DC143C" />
      
      {/* Additional branches */}
      <path d="M28,16 L22,22 L30,22" fill="#FFD700" />
      <path d="M36,16 L42,22 L34,22" fill="#FFD700" />
    </svg>
  );
};

export default TreeLogo;