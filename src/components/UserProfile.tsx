
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Users, FileText, Image, FileUp } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface UserProfileProps {
  user: {
    id: string;
    email?: string;
    fullName?: string;
  };
}

const UserProfile = ({ user }: UserProfileProps) => {
  const [biography, setBiography] = useState<string>("");
  const [editing, setEditing] = useState<boolean>(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [uploadedGedcom, setUploadedGedcom] = useState<File | null>(null);

  const handleBiographySave = () => {
    toast.success("Biography saved successfully!");
    setEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array and add to state
      const newPhotos = Array.from(e.target.files);
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
      toast.success(`${newPhotos.length} photo(s) uploaded successfully!`);
    }
  };

  const handleGedcomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedGedcom(e.target.files[0]);
      toast.success(`GEDCOM file uploaded successfully!`);
    }
  };

  return (
    <Card className="w-full bg-white shadow-md border border-gray-200">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <CardTitle className="text-xl font-medium text-gray-700 flex items-center gap-2">
          <User className="h-5 w-5 text-uganda-yellow" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="biography">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
            <TabsTrigger value="biography" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-uganda-yellow">
              <FileText className="h-4 w-4 mr-2" /> Biography
            </TabsTrigger>
            <TabsTrigger value="family" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-uganda-yellow">
              <Users className="h-4 w-4 mr-2" /> Family Members
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-uganda-yellow">
              <Image className="h-4 w-4 mr-2" /> Photos
            </TabsTrigger>
            <TabsTrigger value="gedcom" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-uganda-yellow">
              <FileUp className="h-4 w-4 mr-2" /> Import GEDCOM
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="biography" className="p-6">
            {editing ? (
              <>
                <Label htmlFor="biography">Your Biography</Label>
                <Textarea 
                  id="biography" 
                  value={biography} 
                  onChange={(e) => setBiography(e.target.value)}
                  className="min-h-[200px] mb-4 mt-2"
                  placeholder="Write about your life, achievements, and personal history..."
                />
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBiographySave}
                    className="bg-uganda-red hover:bg-uganda-red/90 text-white"
                  >
                    Save Biography
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {biography ? (
                  <>
                    <div className="prose max-w-none">
                      {biography.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setEditing(true)}
                        variant="outline"
                        className="border-uganda-yellow hover:bg-uganda-yellow/10"
                      >
                        Edit Biography
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Biography Yet</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Share your personal story and history with your family. Add details about your life, achievements, and memorable experiences.
                    </p>
                    <Button 
                      onClick={() => setEditing(true)}
                      className="bg-uganda-red hover:bg-uganda-red/90 text-white"
                    >
                      Add Your Biography
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="family" className="p-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Add Immediate Family</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Connect with your immediate family members to build your family tree. Add parents, siblings, spouse, and children.
              </p>
              <Button 
                onClick={() => toast.info("Add family member feature will be available soon!")}
                className="bg-uganda-red hover:bg-uganda-red/90 text-white"
              >
                Add Family Members
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="photos" className="p-6">
            {uploadedPhotos.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-100 relative group">
                      <img 
                        src={URL.createObjectURL(photo)} 
                        alt={`Photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
                            toast.success("Photo removed");
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <label htmlFor="add-more-photos" className="cursor-pointer">
                    <div className="flex items-center gap-2 bg-uganda-yellow/10 text-uganda-black hover:bg-uganda-yellow/20 px-4 py-2 rounded-md transition-colors">
                      <Image className="h-4 w-4" />
                      <span>Add More Photos</span>
                    </div>
                    <Input 
                      id="add-more-photos" 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Photos Yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Add photos to preserve and share your family memories. Upload images of family gatherings, ancestral homes, and historical documents.
                </p>
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 bg-uganda-red hover:bg-uganda-red/90 text-white px-4 py-2 rounded-md transition-colors">
                    <Image className="h-4 w-4" />
                    <span>Upload Photos</span>
                  </div>
                  <Input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="gedcom" className="p-6">
            {uploadedGedcom ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center p-4 bg-green-50 rounded-md">
                  <FileUp className="h-8 w-8 text-green-500 mr-4" />
                  <div>
                    <h4 className="font-medium">GEDCOM File Uploaded</h4>
                    <p className="text-sm text-gray-600">{uploadedGedcom.name} - {Math.round(uploadedGedcom.size / 1024)} KB</p>
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Processing Status</h4>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-uganda-yellow w-full animate-pulse"></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 italic">Your GEDCOM file is being processed. This may take a few minutes.</p>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    className="border-uganda-yellow hover:bg-uganda-yellow/10"
                    onClick={() => {
                      setUploadedGedcom(null);
                      toast.info("GEDCOM file removed");
                    }}
                  >
                    Cancel Import
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Import GEDCOM File</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  If you have a GEDCOM file from another genealogy service, you can import it here to add your existing family tree data.
                </p>
                <label htmlFor="gedcom-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 bg-uganda-red hover:bg-uganda-red/90 text-white px-4 py-2 rounded-md transition-colors">
                    <FileUp className="h-4 w-4" />
                    <span>Upload GEDCOM File</span>
                  </div>
                  <Input 
                    id="gedcom-upload" 
                    type="file" 
                    accept=".ged,.gedcom" 
                    className="hidden" 
                    onChange={handleGedcomUpload}
                  />
                </label>
                <div className="mt-6 text-xs text-gray-500">
                  Supported file format: .ged or .gedcom
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
