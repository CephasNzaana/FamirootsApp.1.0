import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const SocialIcons = () => {
  return (
    <div className="flex space-x-4 justify-center md:justify-start">
      <a href="#" aria-label="Facebook" className="transition-transform hover:scale-110">
        <div className="rounded-full bg-[#1877F2] p-1">
          <Facebook className="h-6 w-6 text-white" />
        </div>
      </a>
      <a href="#" aria-label="Twitter/X" className="transition-transform hover:scale-110">
        <div className="rounded-full bg-black p-1">
          <Twitter className="h-6 w-6 text-white" />
        </div>
      </a>
      <a href="#" aria-label="Instagram" className="transition-transform hover:scale-110">
        <div className="rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] p-1">
          <Instagram className="h-6 w-6 text-white" />
        </div>
      </a>
      <a href="#" aria-label="Youtube" className="transition-transform hover:scale-110">
        <div className="rounded-full bg-[#FF0000] p-1">
          <Youtube className="h-6 w-6 text-white" />
        </div>
      </a>
    </div>
  );
};

export default SocialIcons;