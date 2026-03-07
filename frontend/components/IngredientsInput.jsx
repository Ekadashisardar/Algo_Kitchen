"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function IngredientsInput() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIngredients((prev) => {
          const trimmed = prev.trim();
          if (trimmed) {
            return `${trimmed}, ${transcript}`;
          }
          return transcript;
        });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone permissions.");
        } else if (event.error !== "aborted") {
          toast.error("Could not recognize speech. Please try again.");
        }
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        toast.error("Failed to start voice input. Please try again.");
      }
    }
  }, [listening]);

  const handleGenerate = (e) => {
    e.preventDefault();

    const trimmed = ingredients.trim();
    if (!trimmed) {
      toast.error("Please enter at least one ingredient");
      return;
    }

    setLoading(true);
    router.push(
      `/pantry/recipes?ingredients=${encodeURIComponent(trimmed)}`
    );
  };

  return (
    <section className="mb-24">
      <div className="mb-8">
        <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-2">
          Cook With What You Have
        </h2>
        <p className="text-stone-600 text-lg font-light">
          Enter the ingredients in your kitchen and let AI find the perfect
          recipe
        </p>
      </div>

      <div className="bg-white p-8 border-2 border-stone-200">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Your Ingredients
            </label>
            <div className="relative">
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="tomato, onion, egg"
                className={`w-full px-4 py-3 pr-14 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-stone-900 placeholder:text-stone-400 ${
                  listening
                    ? "border-red-400 ring-2 ring-red-200"
                    : "border-stone-200"
                }`}
              />
              {supported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    listening
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-stone-100 text-stone-500 hover:bg-orange-100 hover:text-orange-600"
                  }`}
                  title={listening ? "Stop listening" : "Speak ingredients"}
                >
                  {listening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-stone-500 font-light">
              {listening
                ? "Listening... speak your ingredients"
                : "Separate each ingredient with a comma, or use the mic to speak"}
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !ingredients.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold border-2 border-orange-700 px-6 py-5"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <UtensilsCrossed className="w-5 h-5 mr-2" />
                Generate Recipe From Ingredients
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
