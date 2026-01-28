import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Sparkles, MousePointer2 } from "lucide-react";
import isotipo from "@/assets/trueke-isotipo-clean.png";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  handAction?: "click" | "swipe-right" | "swipe-left" | "scroll" | "tap";
  handOffset?: { x: number; y: number };
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bienvenido",
    description: "Intercambia lo que tienes por lo que necesitas.",
    position: "center",
  },
  {
    id: "select-product",
    title: "Selecciona",
    description: "Elige qué ofreces para buscar matches.",
    targetSelector: "[data-tutorial='product-selector']",
    position: "bottom",
    handAction: "tap",
    handOffset: { x: 0, y: 10 },
  },
  {
    id: "swipe",
    title: "Desliza",
    description: "Derecha = me gusta. Izquierda = paso.",
    targetSelector: "[data-tutorial='swipe-card']",
    position: "center",
    handAction: "swipe-right",
    handOffset: { x: 0, y: 0 },
  },
  {
    id: "match",
    title: "¡Match!",
    description: "Cuando ambos se gustan, ¡pueden chatear!",
    position: "center",
  },
];

// Animated hand component
const AnimatedHand = ({ action, offset }: { action?: string; offset?: { x: number; y: number } }) => {
  const getAnimation = () => {
    switch (action) {
      case "swipe-right":
        return {
          x: [offset?.x || 0, (offset?.x || 0) + 80, (offset?.x || 0) + 80],
          opacity: [1, 1, 0],
          rotate: [0, -10, -10],
        };
      case "swipe-left":
        return {
          x: [offset?.x || 0, (offset?.x || 0) - 80, (offset?.x || 0) - 80],
          opacity: [1, 1, 0],
          rotate: [0, 10, 10],
        };
      case "tap":
      case "click":
        return {
          scale: [1, 0.85, 1],
          y: [offset?.y || 0, (offset?.y || 0) + 6, offset?.y || 0],
        };
      case "scroll":
        return {
          y: [offset?.y || 0, (offset?.y || 0) + 20, offset?.y || 0],
        };
      default:
        return {
          y: [0, -4, 0],
        };
    }
  };

  return (
    <motion.div
      className="absolute pointer-events-none z-[200]"
      style={{ 
        left: `calc(50% + ${offset?.x || 0}px)`,
        top: `calc(50% + ${offset?.y || 0}px)`,
      }}
      animate={getAnimation()}
      transition={{
        duration: action?.includes("swipe") ? 1 : 0.6,
        repeat: Infinity,
        repeatDelay: 0.2,
        ease: "easeInOut",
      }}
    >
      <MousePointer2 className="h-6 w-6 text-white drop-shadow-lg" fill="white" />
    </motion.div>
  );
};

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const InteractiveTutorial = ({ isOpen, onClose, onComplete }: InteractiveTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isCenterStep = step.position === "center" || !step.targetSelector;

  // Find target element and get its position
  useEffect(() => {
    if (!step.targetSelector || !isOpen) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(step.targetSelector!);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 500);
    return () => clearInterval(interval);
  }, [step.targetSelector, isOpen, currentStep]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      localStorage.setItem("trueke_interactive_tutorial_completed", "true");
      onComplete?.();
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete, onClose]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem("trueke_interactive_tutorial_completed", "true");
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay with spotlight */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && !isCenterStep && (
                <rect
                  x={targetRect.left - 6}
                  y={targetRect.top - 6}
                  width={targetRect.width + 12}
                  height={targetRect.height + 12}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight glow effect */}
        {targetRect && !isCenterStep && (
          <motion.div
            className="absolute border-2 border-primary rounded-xl pointer-events-none"
            style={{
              left: targetRect.left - 6,
              top: targetRect.top - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(255, 107, 53, 0.4)",
                "0 0 0 6px rgba(255, 107, 53, 0)",
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}

        {/* Animated hand */}
        {targetRect && step.handAction && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: targetRect.left + targetRect.width / 2,
              top: targetRect.top + targetRect.height / 2,
            }}
          >
            <AnimatedHand action={step.handAction} offset={step.handOffset} />
          </div>
        )}

        {/* Tooltip - Compact for mobile */}
        <motion.div
          className="fixed left-6 right-6 max-w-[280px] mx-auto bg-card rounded-2xl shadow-2xl border border-border overflow-hidden pointer-events-auto"
          style={{
            bottom: isCenterStep ? "auto" : "90px",
            top: isCenterStep ? "50%" : "auto",
            transform: isCenterStep ? "translateY(-50%)" : "none",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          key={currentStep}
        >
          {/* Compact Header */}
          <div className="gradient-brand px-4 py-3 relative">
            <button
              onClick={handleSkip}
              className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
            
            {isCenterStep && (
              <div className="flex justify-center mb-2">
                <img 
                  src={isotipo} 
                  alt="Trueke" 
                  className="h-10 w-10 rounded-xl object-cover"
                />
              </div>
            )}
            
            <h3 className="text-base font-bold text-white text-center">{step.title}</h3>
            
            {/* Progress dots - smaller */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {tutorialSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentStep
                      ? "w-4 bg-white"
                      : idx < currentStep
                      ? "w-1 bg-white/60"
                      : "w-1 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Compact Content */}
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground text-center mb-3">
              {step.description}
            </p>

            {/* Navigation - single row */}
            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-9 px-3 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="flex-1 h-9 text-xs gradient-brand text-white"
              >
                {isLastStep ? "¡Listo!" : "Siguiente"}
                {!isLastStep && <ArrowRight className="h-3.5 w-3.5 ml-1" />}
                {isLastStep && <Sparkles className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
            
            {/* Skip - minimal */}
            <button
              onClick={handleSkip}
              className="w-full mt-2 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Omitir
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
