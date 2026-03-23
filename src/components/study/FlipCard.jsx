import { motion } from 'framer-motion';

export default function FlipCard({ front, back, frontImage, backImage, flipped, onFlip, reversed = false }) {
  // When reversed, swap what shows on front vs back
  const displayFront = reversed ? back : front;
  const displayBack = reversed ? front : back;
  const displayFrontImage = reversed ? backImage : frontImage;
  const displayBackImage = reversed ? frontImage : backImage;
  const frontLabel = reversed ? 'Definition' : 'Term';
  const backLabel = reversed ? 'Term' : 'Definition';

  return (
    <div
      className="w-full cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: 'preserve-3d', minHeight: '280px' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, type: 'spring', stiffness: 260, damping: 28 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center justify-center p-8 text-center"
          style={{ backfaceVisibility: 'hidden', minHeight: '280px' }}
        >
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">{frontLabel}</span>
          {displayFrontImage && (
            <img src={displayFrontImage} alt="" className="max-h-32 max-w-full object-contain rounded-lg mb-4 border border-border" />
          )}
          <p className="text-2xl md:text-3xl font-semibold text-foreground leading-snug">{displayFront}</p>
          <p className="text-xs text-muted-foreground mt-6 absolute bottom-5">Click to flip · Space</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm flex flex-col items-center justify-center p-8 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', minHeight: '280px' }}
        >
          <span className="text-[10px] font-semibold text-primary uppercase tracking-[0.15em] mb-4">{backLabel}</span>
          {displayBackImage && (
            <img src={displayBackImage} alt="" className="max-h-32 max-w-full object-contain rounded-lg mb-4 border border-border" />
          )}
          <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">{displayBack}</p>
        </div>
      </motion.div>
    </div>
  );
}