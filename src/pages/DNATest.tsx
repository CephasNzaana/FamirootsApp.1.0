import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Dna } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const DNATest = () => {
  const navigate = useNavigate();

  const handleOrderKit = () => {
    // Placeholder for actual order logic
    alert("Ordering DNA Kit - Feature in progress!");
    // In a real application, you would integrate with a service to handle the order
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1] flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-3xl mx-auto bg-white shadow-md border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center">
              <Dna className="mr-2 h-6 w-6 text-uganda-yellow" />
              DNA Ancestry Test
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <CardDescription className="text-gray-600 mb-4">
                Discover your origins and connect with your heritage.
              </CardDescription>
              <Button 
                onClick={handleOrderKit} 
                className="bg-uganda-yellow hover:bg-uganda-yellow/90 font-bold text-black"
              >
                Get DNA Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <footer className="container mx-auto px-4 py-4 text-center text-gray-500">
        <p>&copy; 2024 FamiRoots. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default DNATest;
