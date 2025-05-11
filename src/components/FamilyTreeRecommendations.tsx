
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Users, Heart } from "lucide-react";

const FamilyTreeRecommendations = () => {
  const recommendationItems = [
    {
      title: "Add more family members",
      description: "Enhance your family tree by adding more relatives",
      icon: <Users size={18} className="text-[#1EAEDB]" />,
      action: "Add Members"
    },
    {
      title: "Connect with other families",
      description: "Find possible connections with other clan members",
      icon: <Heart size={18} className="text-[#1EAEDB]" />,
      action: "Find Connections"
    },
    {
      title: "Research clan history",
      description: "Discover more about your clan's traditions and history",
      icon: <Search size={18} className="text-[#1EAEDB]" />,
      action: "Research"
    }
  ];

  return (
    <Card className="w-full bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg font-medium text-gray-700">Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {recommendationItems.map((item, index) => (
            <div key={index} className="flex items-start justify-between p-2 hover:bg-gray-50 rounded-md">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{item.icon}</div>
                <div>
                  <h4 className="text-sm font-medium">{item.title}</h4>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs border-[#1EAEDB] text-[#1EAEDB] hover:bg-[#1EAEDB]/10"
              >
                {item.action}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FamilyTreeRecommendations;
