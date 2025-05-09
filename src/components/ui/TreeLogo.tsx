const TreeLogo = () => {
  return (
    <svg 
      width="64" 
      height="64" 
      viewBox="0 0 300 300" 
      className="mr-1"
    >
      {/* Yellow outer circle */}
      <circle cx="150" cy="150" r="145" fill="#FFDE00" />
      
      {/* Gray outer ring */}
      <circle cx="150" cy="150" r="150" stroke="#444444" strokeWidth="10" fill="none" />
      
      {/* Tree design - stylized yellow tree with branches and roots */}
      <g fill="#FFDE00">
        {/* Tree top part */}
        <path d="M150,40 C180,70 220,100 220,140 C220,170 180,200 150,200 C120,200 80,170 80,140 C80,100 120,70 150,40 Z" />
        
        {/* Tree branches - stylized leaf patterns */}
        <path d="M150,60 C160,70 180,80 190,90 C170,95 160,100 150,105 C140,100 130,95 110,90 C120,80 140,70 150,60 Z" />
        <path d="M150,80 C165,90 180,100 195,110 C180,115 165,120 150,125 C135,120 120,115 105,110 C120,100 135,90 150,80 Z" />
        <path d="M150,100 C170,110 190,120 210,130 C190,135 170,140 150,145 C130,140 110,135 90,130 C110,120 130,110 150,100 Z" />
        <path d="M150,120 C175,130 200,140 225,150 C200,155 175,160 150,165 C125,160 100,155 75,150 C100,140 125,130 150,120 Z" />
        
        {/* Tree roots */}
        <path d="M150,200 C180,220 200,240 220,260 C190,250 170,240 150,230 C130,240 110,250 80,260 C100,240 120,220 150,200 Z" />
      </g>
      
      {/* FAMIROOTS text */}
      <text 
        x="150" 
        y="200" 
        textAnchor="middle" 
        fill="#FF0000" 
        fontFamily="Arial" 
        fontWeight="bold" 
        fontSize="36"
      >
        FAMIROOTS
      </text>
    </svg>
  );
};

export default TreeLogo;