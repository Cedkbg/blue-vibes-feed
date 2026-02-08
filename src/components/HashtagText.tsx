import { useNavigate } from "react-router-dom";

interface HashtagTextProps {
  text: string;
  className?: string;
  onHashtagClick?: (hashtag: string) => void;
}

export const HashtagText = ({ text, className = "", onHashtagClick }: HashtagTextProps) => {
  const navigate = useNavigate();

  const parts = text.split(/(#\w+)/g);

  const handleClick = (tag: string) => {
    if (onHashtagClick) {
      onHashtagClick(tag.slice(1)); // remove #
    } else {
      navigate(`/search?q=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); handleClick(part); }}
            className="text-primary font-medium hover:underline"
          >
            {part}
          </button>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};
