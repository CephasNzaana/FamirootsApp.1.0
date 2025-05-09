import { useState, useEffect } from "react";

const familyMembers = [
  { id: 1, name: "Grandfather", level: 1, position: 1 },
  { id: 2, name: "Grandmother", level: 1, position: 2 },
  { id: 3, name: "Father", level: 2, position: 1, parents: [1, 2] },
  { id: 4, name: "Mother", level: 2, position: 2 },
  { id: 5, name: "Uncle", level: 2, position: 3, parents: [1, 2] },
  { id: 6, name: "Aunt", level: 2, position: 4, parents: [1, 2] },
  { id: 7, name: "You", level: 3, position: 1, parents: [3, 4] },
  { id: 8, name: "Sister", level: 3, position: 2, parents: [3, 4] },
  { id: 9, name: "Brother", level: 3, position: 3, parents: [3, 4] },
  { id: 10, name: "Cousin", level: 3, position: 4, parents: [5, 6] },
  { id: 11, name: "Cousin", level: 3, position: 5, parents: [5, 6] },
];

const InteractiveFamilyTreeDemo = () => {
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [treeRotation, setTreeRotation] = useState(0);
  const [treeScale, setTreeScale] = useState(1);
  const [connections, setConnections] = useState<{start: number, end: number}[]>([]);

  useEffect(() => {
    // Initialize connections
    const lines: {start: number, end: number}[] = [];
    familyMembers.forEach(member => {
      if (member.parents) {
        member.parents.forEach(parentId => {
          lines.push({
            start: parentId,
            end: member.id
          });
        });
      }
    });
    setConnections(lines);

    // Add animation
    const interval = setInterval(() => {
      setTreeScale(prev => {
        const newScale = prev + 0.01;
        return newScale > 1.05 ? 0.95 : newScale;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleMemberClick = (id: number) => {
    setSelectedMember(id === selectedMember ? null : id);
  };

  const getRelatives = (id: number) => {
    const member = familyMembers.find(m => m.id === id);
    if (!member) return { parents: [], siblings: [], children: [] };

    const parents = member.parents 
      ? familyMembers.filter(m => member.parents?.includes(m.id))
      : [];
    
    const siblings = member.parents
      ? familyMembers.filter(m => 
          m.id !== id && 
          m.parents?.some(p => member.parents?.includes(p))
        )
      : [];
    
    const children = familyMembers.filter(m => 
      m.parents?.includes(id)
    );

    return { parents, siblings, children };
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-uganda-black">
      <h3 className="text-lg font-bold mb-4 text-uganda-black text-center">Interactive Family Tree Demo</h3>
      
      <div className="flex justify-center mb-4 space-x-4">
        <button 
          onClick={() => setTreeRotation(prev => prev - 90)}
          className="bg-uganda-yellow text-uganda-black px-3 py-1 rounded hover:bg-uganda-yellow/90"
        >
          Rotate Left
        </button>
        <button 
          onClick={() => setTreeRotation(prev => prev + 90)}
          className="bg-uganda-yellow text-uganda-black px-3 py-1 rounded hover:bg-uganda-yellow/90"
        >
          Rotate Right
        </button>
      </div>
      
      <div 
        className="relative h-64 mb-4 mx-auto transition-all duration-700 ease-in-out" 
        style={{
          transform: `rotate(${treeRotation}deg) scale(${treeScale})`,
          width: "300px"
        }}
      >
        {familyMembers.map((member) => {
          const levelOffset = member.level * 60;
          const positionOffset = (member.position * 60) - 30;
          
          return (
            <div 
              key={member.id}
              className={`absolute cursor-pointer transition-all duration-300 w-12 h-12 rounded-full flex items-center justify-center
                ${selectedMember === member.id ? 'ring-4 ring-uganda-red' : 'hover:ring-2 ring-uganda-yellow'}
                ${member.level === 1 ? 'bg-uganda-yellow' : member.level === 2 ? 'bg-uganda-red' : 'bg-green-600'}
                text-white font-medium`}
              style={{
                top: `${levelOffset}px`,
                left: `${positionOffset}px`,
                transform: `rotate(${-treeRotation}deg)`, // Counter rotate the text
              }}
              onClick={() => handleMemberClick(member.id)}
            >
              {member.name.substring(0, 2)}
            </div>
          );
        })}
      </div>
      
      {selectedMember && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-bold text-uganda-black">
            {familyMembers.find(m => m.id === selectedMember)?.name}'s Relatives:
          </h4>
          
          <div className="mt-2">
            {(() => {
              const { parents, siblings, children } = getRelatives(selectedMember);
              
              return (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Parents:</span>{" "}
                    {parents.length > 0 
                      ? parents.map(p => p.name).join(", ") 
                      : "None recorded"}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Siblings:</span>{" "}
                    {siblings.length > 0 
                      ? siblings.map(s => s.name).join(", ") 
                      : "None recorded"}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Children:</span>{" "}
                    {children.length > 0 
                      ? children.map(c => c.name).join(", ") 
                      : "None recorded"}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center mt-4">
        Click on a family member to see their relationships
      </p>
    </div>
  );
};

export default InteractiveFamilyTreeDemo;