import { useState, useEffect } from "react";

const quotes = [
  {
    text: "To forget one's ancestors is to be a brook without a source, a tree without a root.",
    author: "Chinese Proverb"
  },
  {
    text: "If you don't know history, then you don't know anything. You are a leaf that doesn't know it is part of a tree.",
    author: "Michael Crichton"
  },
  {
    text: "Our ancestors are an ever-widening circle of hope.",
    author: "Toni Morrison"
  },
  {
    text: "A people without the knowledge of their past history, origin and culture is like a tree without roots.",
    author: "Marcus Garvey"
  },
  {
    text: "When you know where you come from, you know where you're going.",
    author: "African Proverb"
  },
  {
    text: "When we illuminate the road back to our ancestors, they have a way of reaching out, of manifesting themselves...sometimes even physically.",
    author: "Raquel Cepeda"
  },
  {
    text: "Every person is a link in a chain of generations.",
    author: "Ugandan Saying"
  },
  {
    text: "The strength of a family, like the strength of an army, lies in its loyalty to each other.",
    author: "Mario Puzo"
  },
  {
    text: "The wisdom of our ancestors is in the simile.",
    author: "Charles Simmons"
  },
  {
    text: "Nurture your roots to strengthen your tree.",
    author: "East African Proverb"
  }
];

const HeritageQuotes = () => {
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [fadeState, setFadeState] = useState("fade-in");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const intervalId = setInterval(() => {
      setFadeState("fade-out");
      
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setCurrentQuote(quotes[randomIndex]);
        setFadeState("fade-in");
      }, 1000);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [isPaused]);

  const handleNext = () => {
    setFadeState("fade-out");
    setTimeout(() => {
      const currentIndex = quotes.findIndex(q => q.text === currentQuote.text);
      const nextIndex = (currentIndex + 1) % quotes.length;
      setCurrentQuote(quotes[nextIndex]);
      setFadeState("fade-in");
    }, 500);
  };

  const handlePrevious = () => {
    setFadeState("fade-out");
    setTimeout(() => {
      const currentIndex = quotes.findIndex(q => q.text === currentQuote.text);
      const prevIndex = (currentIndex - 1 + quotes.length) % quotes.length;
      setCurrentQuote(quotes[prevIndex]);
      setFadeState("fade-in");
    }, 500);
  };

  return (
    <div className="bg-gradient-to-r from-[#FFDE00] to-[#FF0000] p-6 rounded-lg shadow-md my-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 z-0"></div>
      
      <div className="relative z-10">
        <div className={`transition-opacity duration-1000 min-h-[150px] flex flex-col justify-center ${fadeState === "fade-in" ? "opacity-100" : "opacity-0"}`}>
          <p className="text-lg md:text-xl font-medium text-black italic mb-2">
            "{currentQuote.text}"
          </p>
          <p className="text-right text-black font-semibold">
            — {currentQuote.author}
          </p>
        </div>
        
        <div className="flex justify-between mt-4">
          <button 
            onClick={handlePrevious}
            className="bg-black bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30 transition-all"
            aria-label="Previous quote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="bg-black bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30 transition-all"
            aria-label={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={handleNext}
            className="bg-black bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30 transition-all"
            aria-label="Next quote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .fade-in {
          opacity: 1;
        }
        .fade-out {
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default HeritageQuotes;