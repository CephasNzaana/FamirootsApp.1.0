const TreeLogo = () => {
    return (
      <svg width="48" height="40" viewBox="0 0 48 40" className="mr-1">
        {/* Tree Trunk (Black) */}
        <rect x="19" y="16" width="10" height="18" fill="#000000" />
        
        {/* Tree Branches */}
        <polygon 
          points="24,6 10,20 38,20" 
          fill="#FFD700" /* Yellow */
        />
        
        {/* Tree Top */}
        <polygon 
          points="24,2 14,13 34,13" 
          fill="#DC143C" /* Red */
        />
      </svg>
    );
  };
  
  export default TreeLogo;