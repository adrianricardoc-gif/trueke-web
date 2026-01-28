import { Star } from "lucide-react";

interface UserRatingProps {
  rating: number;
  count: number;
  size?: "sm" | "md";
}

const UserRating = ({ rating, count, size = "md" }: UserRatingProps) => {
  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className={`${textSize} text-muted-foreground`}>
        {rating > 0 ? rating.toFixed(1) : "—"} ({count})
      </span>
    </div>
  );
};

export default UserRating;
