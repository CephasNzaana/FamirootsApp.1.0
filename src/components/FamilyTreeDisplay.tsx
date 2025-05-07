
import { FamilyTree, FamilyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FamilyTreeDisplayProps {
  tree: FamilyTree;
}

const FamilyTreeDisplay = ({ tree }: FamilyTreeDisplayProps) => {
  // Group family members by generation
  const membersByGeneration: Record<number, FamilyMember[]> = {};
  
  tree.members.forEach(member => {
    if (!membersByGeneration[member.generation]) {
      membersByGeneration[member.generation] = [];
    }
    membersByGeneration[member.generation].push(member);
  });

  // Get the generations in ascending order
  const generations = Object.keys(membersByGeneration)
    .map(gen => parseInt(gen))
    .sort((a, b) => a - b);

  // Build parent-child relationships for visualization
  const familyConnections: {parent: string, child: string}[] = [];
  tree.members.forEach(member => {
    if (member.parentId) {
      familyConnections.push({
        parent: member.parentId,
        child: member.id
      });
    }
  });

  return (
    <Card className="w-full bg-white shadow-lg border-2 border-uganda-black animation-fade-in">
      <CardHeader className="border-b border-uganda-black border-opacity-20">
        <CardTitle className="text-xl font-bold">
          Family Tree: {tree.surname} ({tree.clan} clan, {tree.tribe})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-8">
          {generations.map(gen => (
            <div key={gen} className="w-full">
              <h3 className="text-sm font-medium text-gray-500 mb-3 text-center">
                Generation {gen}
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {membersByGeneration[gen].map(member => (
                  <div 
                    key={member.id} 
                    className="tree-node bg-white p-3 rounded-lg border border-uganda-yellow shadow-md relative animate-slide-up"
                    id={`member-${member.id}`}
                  >
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-gray-500">{member.relationship}</div>
                    {member.birthYear && (
                      <div className="text-xs text-gray-400">b. {member.birthYear}</div>
                    )}
                    {member.parentId && (
                      <div className="text-xs text-gray-400 italic">
                        Child of {tree.members.find(m => m.id === member.parentId)?.name.split(' ')[1] || 'Unknown'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTreeDisplay;
