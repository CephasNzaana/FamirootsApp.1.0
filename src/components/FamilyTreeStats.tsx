
import React from "react";
import { FamilyTree } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Bookmark, Flag, Users2, MapPin } from "lucide-react";

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
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium text-gray-700">Family Tree Stats</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-uganda-yellow/10 p-2 rounded-full">
              <Users size={18} className="text-uganda-yellow" />
            </div>
            <div>
              <div className="text-sm font-medium">{tree.members.length}</div>
              <div className="text-xs text-gray-500">People</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-uganda-yellow/10 p-2 rounded-full">
              <Calendar size={18} className="text-uganda-yellow" />
            </div>
            <div>
              <div className="text-sm font-medium">{generations}</div>
              <div className="text-xs text-gray-500">Generations</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-uganda-yellow/10 p-2 rounded-full">
              <Bookmark size={18} className="text-uganda-yellow" />
            </div>
            <div>
              <div className="text-sm font-medium">{livingMembers}</div>
              <div className="text-xs text-gray-500">Living</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-uganda-yellow/10 p-2 rounded-full">
              <Flag size={18} className="text-uganda-yellow" />
            </div>
            <div>
              <div className="text-sm font-medium">{elders}</div>
              <div className="text-xs text-gray-500">Clan Elders</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-uganda-yellow/10 p-2 rounded-full">
              <Users2 size={18} className="text-uganda-yellow" />
            </div>
            <div>
              <div className="text-sm font-medium">{deceasedMembers}</div>
              <div className="text-xs text-gray-500">Deceased</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-uganda-yellow/10 p-2 rounded-full">
              <MapPin size={18} className="text-uganda-yellow" />
            </div>
            <div>
              <div className="text-sm font-medium">{tree.tribe}</div>
              <div className="text-xs text-gray-500">Tribe</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTreeStats;
