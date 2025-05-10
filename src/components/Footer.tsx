import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-uganda-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Contact */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/Logo.png" alt="FamiRoots Logo" className="h-12 w-12" />
              <h2 className="text-2xl font-bold">
                Fami<span className="text-uganda-red">Roots</span>
              </h2>
            </div>
            <p className="text-gray-300">Email: info@famiroots.com</p>
            <Button 
              className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
              onClick={() => window.location.href = "mailto:info@famiroots.com"}
            >
              Get in Touch
            </Button>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-uganda-yellow">Home</Link></li>
              <li><Link to="/family-trees" className="hover:text-uganda-yellow">Family Trees</Link></li>
              <li><Link to="/tribes" className="hover:text-uganda-yellow">Tribes & Clans</Link></li>
              <li><Link to="/elders" className="hover:text-uganda-yellow">Elder Database</Link></li>
              <li><Link to="/relationship-analyzer" className="hover:text-uganda-yellow">Relationship Analyzer</Link></li>
            </ul>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Button 
                className="w-full bg-uganda-red text-white hover:bg-uganda-red/90"
                onClick={() => window.location.href = "mailto:corrections@famiroots.com"}
              >
                Submit Corrections
              </Button>
              <Button 
                className="w-full bg-uganda-red text-white hover:bg-uganda-red/90"
                onClick={() => window.location.href = "/expert-registration"}
              >
                Register as Expert
              </Button>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex flex-wrap gap-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn1.iconfinder.com/data/icons/social-media-circle-7/512/Circled_Linkedin_svg-512.png" alt="LinkedIn" className="h-8 w-8" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn1.iconfinder.com/data/icons/social-media-circle-7/512/Circled_Facebook_svg-512.png" alt="Facebook" className="h-8 w-8" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn1.iconfinder.com/data/icons/social-media-circle-7/512/Circled_Twitter_svg-512.png" alt="X" className="h-8 w-8" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn1.iconfinder.com/data/icons/social-media-circle-7/512/Circled_Instagram_svg-512.png" alt="Instagram" className="h-8 w-8" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn4.iconfinder.com/data/icons/social-media-circle-7/512/Social-Media-Circle-Icons-Tiktok-512.png" alt="TikTok" className="h-8 w-8" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn1.iconfinder.com/data/icons/social-media-circle-7/512/Circled_Youtube_svg-512.png" alt="YouTube" className="h-8 w-8" />
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer">
                <img src="https://cdn1.iconfinder.com/data/icons/social-media-circle-7/512/Circled_Pinterest_svg-512.png" alt="Pinterest" className="h-8 w-8" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} FamiRoots - Preserving Ugandan Family Heritage
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90 rounded-full shadow-lg"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;