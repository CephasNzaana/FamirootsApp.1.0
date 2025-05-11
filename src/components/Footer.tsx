
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Youtube, 
  Smartphone, 
  Send
} from "lucide-react";

const Footer = () => {
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = new FormData(form).get("email") as string;
    
    if (email) {
      alert(`Thank you for subscribing with: ${email}`);
      form.reset();
    }
  };

  return (
    <footer className="bg-uganda-black text-white">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: About */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-uganda-yellow">FamiRoots</h3>
              <p className="mb-4 text-gray-300">
                Preserving Ugandan family heritage through innovative clan-based family tree technology.
              </p>
              <div className="flex space-x-3">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="bg-uganda-yellow/90 hover:bg-uganda-yellow p-2 rounded-full transition-colors">
                  <Linkedin size={16} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-uganda-yellow/90 hover:bg-uganda-yellow p-2 rounded-full transition-colors">
                  <Twitter size={16} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-uganda-yellow/90 hover:bg-uganda-yellow p-2 rounded-full transition-colors">
                  <Facebook size={16} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-uganda-yellow/90 hover:bg-uganda-yellow p-2 rounded-full transition-colors">
                  <Instagram size={16} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="bg-uganda-yellow/90 hover:bg-uganda-yellow p-2 rounded-full transition-colors">
                  <Youtube size={16} />
                </a>
              </div>
            </div>
            
            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-uganda-yellow">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-gray-300 hover:text-uganda-yellow transition-colors">Home</a>
                </li>
                <li>
                  <a href="/family-trees" className="text-gray-300 hover:text-uganda-yellow transition-colors">Family Trees</a>
                </li>
                <li>
                  <a href="/relationship-analyzer" className="text-gray-300 hover:text-uganda-yellow transition-colors">Relationship Analyzer</a>
                </li>
                <li>
                  <a href="/dna-test" className="text-gray-300 hover:text-uganda-yellow transition-colors">DNA Testing</a>
                </li>
                <li>
                  <a href="/tribes" className="text-gray-300 hover:text-uganda-yellow transition-colors">Tribes & Clans</a>
                </li>
                <li>
                  <a href="/elders" className="text-gray-300 hover:text-uganda-yellow transition-colors">Clan Elders</a>
                </li>
              </ul>
            </div>
            
            {/* Column 3: Contact Us */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-uganda-yellow">Contact Us</h3>
              <ul className="space-y-2">
                <li className="text-gray-300">
                  <strong>Email:</strong> info@famiroots.com
                </li>
                <li className="text-gray-300">
                  <strong>Phone:</strong> +256 700 123 456
                </li>
                <li className="text-gray-300">
                  <strong>Address:</strong> Plot 123, Kampala Road, Kampala, Uganda
                </li>
              </ul>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2 flex items-center">
                  <Smartphone className="mr-2 h-5 w-5 text-uganda-yellow" /> Mobile App
                </h4>
                <div className="flex flex-wrap gap-2">
                  <a href="#" className="inline-block">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                      alt="Get it on Google Play" 
                      className="h-10"
                    />
                  </a>
                  <a href="#" className="inline-block">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                      alt="Download on App Store" 
                      className="h-10"
                    />
                  </a>
                </div>
              </div>
            </div>
            
            {/* Column 4: Newsletter */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-uganda-yellow">Newsletter</h3>
              <p className="mb-4 text-gray-300">
                Subscribe to our newsletter to receive the latest updates on new features and family heritage resources.
              </p>
              <form onSubmit={handleSubscribe} className="mt-4">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="bg-white/10 text-white border-white/20 placeholder:text-gray-400"
                    required
                  />
                  <Button type="submit" className="bg-uganda-red hover:bg-uganda-red/90">
                    <Send size={16} />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-white/10 py-8">
          {/* Ugandan flag colors */}
          <div className="flex justify-center space-x-2 mb-6">
            <div className="w-4 h-4 bg-uganda-black"></div>
            <div className="w-4 h-4 bg-uganda-yellow"></div>
            <div className="w-4 h-4 bg-uganda-red"></div>
          </div>
          <p className="text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} FamiRoots - Preserving Ugandan Family Heritage
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
