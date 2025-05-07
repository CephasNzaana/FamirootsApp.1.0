
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

interface AuthFormProps {
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthForm = ({ onClose, onAuthSuccess }: AuthFormProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (action: "login" | "signup") => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    
    // This is a placeholder for Supabase Auth
    // In real implementation, we would use Supabase Auth API here
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`${action === "login" ? "Logged in" : "Signed up"} successfully!`);
      onAuthSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white animate-fade-in">
        <Tabs defaultValue="login">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">
                Welcome to <span className="text-uganda-red">FamiRoots</span>
              </CardTitle>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <CardDescription>
              Connect with your ancestral roots
            </CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="space-y-4 mt-4">
            <TabsContent value="login">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="signup">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </TabsContent>
          </CardContent>
          <CardFooter>
            <Tabs.Root value="login">
              <TabsContent value="login" className="w-full">
                <Button 
                  className="btn-primary w-full" 
                  disabled={isLoading}
                  onClick={() => handleSubmit("login")}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </TabsContent>
              <TabsContent value="signup" className="w-full">
                <Button 
                  className="btn-primary w-full" 
                  disabled={isLoading}
                  onClick={() => handleSubmit("signup")}
                >
                  {isLoading ? "Signing up..." : "Create Account"}
                </Button>
              </TabsContent>
            </Tabs.Root>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthForm;
