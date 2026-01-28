import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, X, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import isotipo from "@/assets/trueke-isotipo-clean.png";

interface MatchData {
  matchId: string;
  myProduct: {
    title: string;
    image: string;
  };
  theirProduct: {
    title: string;
    image: string;
  };
  otherUser: {
    name: string;
    avatar: string | null;
  };
}

interface MatchCelebrationProps {
  match: MatchData | null;
  onClose: () => void;
}

// Enhanced confetti piece component
const ConfettiPiece = ({ index }: { index: number }) => {
  const colors = [
    "bg-trueke-orange",
    "bg-trueke-green",
    "bg-trueke-pink",
    "bg-trueke-yellow",
    "bg-trueke-cyan",
    "bg-trueke-teal",
    "bg-primary",
  ];
  
  const randomColor = colors[index % colors.length];
  const randomX = (Math.random() - 0.5) * 600;
  const randomDelay = Math.random() * 0.3;
  const randomDuration = 2.5 + Math.random() * 1.5;
  const randomRotation = Math.random() * 1080 - 540;
  const size = 6 + Math.random() * 10;
  const shapes = ["rounded-full", "rounded-sm", "rounded-none"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const startX = Math.random() * 100;

  return (
    <motion.div
      className={`absolute ${randomColor} ${shape}`}
      style={{
        width: size,
        height: size,
        left: `${startX}%`,
        top: "30%",
      }}
      initial={{
        x: 0,
        y: 0,
        opacity: 1,
        scale: 0,
        rotate: 0,
      }}
      animate={{
        x: randomX,
        y: [0, -150, 500],
        opacity: [1, 1, 0],
        scale: [0, 1.5, 0.8],
        rotate: randomRotation,
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  );
};

// Sparkle effect
const SparkleEffect = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 1,
      delay: delay,
      repeat: 3,
      repeatDelay: 0.5,
    }}
  >
    <Star className="h-4 w-4 text-trueke-yellow fill-trueke-yellow" />
  </motion.div>
);

const MatchCelebration = ({ match, onClose }: MatchCelebrationProps) => {
  const navigate = useNavigate();
  const [confettiPieces] = useState(() =>
    Array.from({ length: 80 }, (_, i) => i)
  );
  const [sparkles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => i * 0.2)
  );

  useEffect(() => {
    if (match) {
      const timer = setTimeout(onClose, 10000);
      return () => clearTimeout(timer);
    }
  }, [match, onClose]);

  const handleChat = () => {
    onClose();
    navigate(`/chat/${match?.matchId}`);
  };

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-trueke-orange/20 via-black/90 to-trueke-pink/20 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiPieces.map((i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          {/* Sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {sparkles.map((delay, i) => (
              <SparkleEffect key={i} delay={delay} />
            ))}
          </div>

          {/* Pulsing rings */}
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full border-4 border-trueke-orange/30"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 2, 2.5],
              opacity: [0.8, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full border-4 border-trueke-pink/40"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.8, 2.2],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{
              duration: 2,
              delay: 0.3,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 w-full max-w-sm mx-4 bg-card rounded-3xl p-6 shadow-2xl overflow-hidden border border-border/50"
            initial={{ scale: 0.3, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
          >
            {/* Gradient overlay on card */}
            <div className="absolute inset-0 bg-gradient-to-br from-trueke-orange/10 via-transparent to-trueke-pink/10 pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-20"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Header */}
            <motion.div
              className="text-center mb-6 relative z-10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="relative inline-flex items-center justify-center w-24 h-24 mb-4"
                animate={{
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.4,
                  repeat: 3,
                }}
              >
                {/* Glowing background */}
                <motion.div
                  className="absolute inset-0 rounded-full gradient-brand blur-lg"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                />
                <div className="relative rounded-full gradient-brand p-4 shadow-lg">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 0.5,
                      delay: 0.5,
                      repeat: 4,
                    }}
                  >
                    <Heart className="h-12 w-12 text-primary-foreground" fill="currentColor" />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <h2 className="text-3xl font-bold text-gradient mb-1">¡Es un Match!</h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-trueke-yellow" />
                  <p className="text-sm">
                    A <span className="font-semibold text-foreground">{match.otherUser.name}</span> también le interesa
                  </p>
                  <Sparkles className="h-4 w-4 text-trueke-yellow" />
                </div>
              </motion.div>
            </motion.div>

            {/* Products */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-6 relative z-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div 
                className="text-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-trueke-orange/50 shadow-lg mb-2 ring-2 ring-trueke-orange/20 ring-offset-2 ring-offset-card">
                  <img
                    src={match.myProduct.image}
                    alt={match.myProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {match.myProduct.title}
                </p>
              </motion.div>

              <motion.div
                className="flex items-center justify-center"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity },
                }}
              >
                <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center shadow-lg">
                  <img src={isotipo} alt="" className="w-9 h-9 rounded-md" />
                </div>
              </motion.div>

              <motion.div 
                className="text-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-trueke-green/50 shadow-lg mb-2 ring-2 ring-trueke-green/20 ring-offset-2 ring-offset-card">
                  <img
                    src={match.theirProduct.image}
                    alt={match.theirProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {match.theirProduct.title}
                </p>
              </motion.div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="space-y-3 relative z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={handleChat}
                className="w-full h-12 rounded-2xl gradient-brand gap-2 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                <MessageCircle className="h-5 w-5" />
                Enviar mensaje
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full h-12 rounded-2xl text-base border-border/50"
              >
                Seguir explorando
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchCelebration;
