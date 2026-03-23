import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudyControls({ flipped, onCorrect, onIncorrect }) {
  if (!flipped) return (
    <p className="text-center text-sm text-muted-foreground">
      Tap card or press <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-xs font-mono border">Space</kbd> to reveal
    </p>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-4">
      <Button
        size="lg"
        variant="outline"
        className="w-36 gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 font-medium"
        onClick={onIncorrect}
      >
        <X className="w-4 h-4" />
        Still learning
      </Button>
      <Button
        size="lg"
        className="w-36 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
        onClick={onCorrect}
      >
        <Check className="w-4 h-4" />
        Got it
      </Button>
    </motion.div>
  );
}