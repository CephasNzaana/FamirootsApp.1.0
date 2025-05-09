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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFadeState("fade-out");
      
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setCurrentQuote(quotes[randomIndex]);
        setFadeState("fade-in");
      }, 1000);
    }, 8000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-gradient-to-r from-uganda-yellow to-uganda-red bg-opacity-80 p-6 rounded-lg shadow-md my-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 z-0"></div>
      <div className="relative z-10">
        <div className={`transition-opacity duration-1000 ${fadeState === "fade-in" ? "opacity-100" : "opacity-0"}`}>
          <p className="text-lg md:text-xl font-medium text-uganda-black italic mb-2">
            "{currentQuote.text}"
          </p>
          <p className="text-right text-uganda-black font-semibold">
            — {currentQuote.author}
          </p>
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