"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FeedbackRatingProps {
  maxRating?: number;
  onSelect: (rating: number) => void;
  disabled?: boolean;
}

export function FeedbackRating({
  maxRating = 5,
  onSelect,
  disabled = false,
}: FeedbackRatingProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleClick = (value: number) => {
    if (disabled) return;
    setRating(value);
    onSelect(value);
  };

  return (
    <div
      className={cn(
        "flex flex-col p-3 items-center w-55 h-23 bg-li shadow-ms rounded-t-2xl rounded-br-2xl shadow-md",
        "border border-li/50",
      )}
      role="group"
      aria-label="Avaliação da pesquisa"
    >
      <h3
        className={cn("text-md font-primary mb-2 text-center", "font-medium")}
      >
        Avalie sua pesquisa:
      </h3>
      <div className="flex items-center gap-0.5 p-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const ratingValue = index + 1;
          const isFilled = ratingValue <= (hover || rating);

          return (
            <button
              key={ratingValue}
              type="button"
              className={cn(
                "transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-1/50 rounded p-1",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              onClick={() => handleClick(ratingValue)}
              onMouseEnter={() => !disabled && setHover(ratingValue)}
              onMouseLeave={() => setHover(0)}
              disabled={disabled}
              aria-label={`${ratingValue} estrela${ratingValue > 1 ? "s" : ""}`}
              aria-pressed={rating === ratingValue}
            >
              <Star
                size={20}
                className={cn(
                  "transition-colors duration-400",
                  isFilled
                    ? "fill-green-1 text-green-1/"
                    : "fill-green-1/30 text-green-1/30",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
