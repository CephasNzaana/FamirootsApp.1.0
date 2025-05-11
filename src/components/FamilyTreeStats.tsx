
import React from "react";
import { FamilyTree } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Bookmark, Flag } from "lucide-react";

interface FamilyTreeStatsProps {
  tree: FamilyTree;
}

const FamilyTreeStats = ({ tree }: FamilyTreeStatsProps) => {
  const livingMembers = tree.members.filter(member => !member.deathYear).length;
  const deceasedMembers = tree.members.filter(member => member.deathYear).length;
  const elders = tree.members.filter(member => member.isElder).length;
  const generations = new Set(tree.members.map(member => member.generation)).size;

  return (
    <Card className="w-full bg-white shadow-sm border border-gray-200">
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-3 text-gray-700">Family Tree Statistics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#1EAEDB]" />
            <span className="text-sm">
              <strong>{tree.members.length}</strong> family members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#1EAEDB]" />
            <span className="text-sm">
              <strong>{generations}</strong> generations
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-[#1EAEDB]" />
            <span className="text-sm">
              <strong>{livingMembers}</strong> living
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-[#1EAEDB]" />
            <span className="text-sm">
              <strong>{elders}</strong> clan elders
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTreeStats;
