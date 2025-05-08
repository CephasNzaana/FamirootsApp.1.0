
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

// Define default user types
const DEFAULT_USERS = {
  seeker: {
    username: "DefaultSeeker",
    email: "defaultseeker@famiroots.com",
    password: "Test@2025",
    role: "user",
    permissions: ["view", "create", "connect"]
  },
  expert: {
    username: "DefaultExpert",
    email: "defaultexpert@famiroots.com",
    password: "Test@2025",
    role: "expert",
    permissions: ["view", "create", "connect", "verify"]
  },
  admin: {
    username: "DefaultAdmin",
    email: "defaultadmin@famiroots.com",
    password: "Test@2025",
    role: "admin",
    permissions: ["all"]
  }
};

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  onClose: () => void;
  defaultUsers?: boolean;
}

const AuthForm = ({ onClose, defaultUsers = true }: AuthFormProps) => {
  const { signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("login");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (activeTab === "login") {
        await signIn(values.email, values.password);
        toast.success("Logged in successfully!");
        onClose();
      } else {
        await signUp(values.email, values.password);
        toast.success("Signed up successfully! Check your email for confirmation.");
        setActiveTab("login");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDefaultUserLogin = async (userType: 'seeker' | 'expert' | 'admin') => {
    setIsLoading(true);
    try {
      const user = DEFAULT_USERS[userType];
      await signIn(user.email, user.password);
      toast.success(`Logged in as ${user.username} (${user.role})`);
      onClose();
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(`Authentication failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication</DialogTitle>
          <DialogDescription>
            {activeTab === "login" 
              ? "Sign in to your FamiRoots account" 
              : "Create a new FamiRoots account"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@email.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
            
            {defaultUsers && (
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Quick Login with Default Users:</h4>
                <div className="grid gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleDefaultUserLogin('seeker')}
                    disabled={isLoading}
                    className="justify-start bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                  >
                    Login as User (DefaultSeeker)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleDefaultUserLogin('expert')}
                    disabled={isLoading}
                    className="justify-start bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                  >
                    Login as Expert (DefaultExpert)
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleDefaultUserLogin('admin')}
                    disabled={isLoading}
                    className="justify-start bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                  >
                    Login as Admin (DefaultAdmin)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Default password: Test@2025
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="signup" className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@email.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing up..." : "Sign Up"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            disabled={isLoading} 
            className="text-uganda-black"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthForm;
