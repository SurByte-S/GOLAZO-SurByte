import React from 'react';
import { Star, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

interface ArgentinaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const ArgentinaLogo = ({ size = 'md', showText = true, className }: ArgentinaLogoProps) => {
  const iconSize = size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5';
  const textSize = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-2xl' : 'text-base';
  const containerSize = size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-14 h-14' : 'w-10 h-10';

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className={cn(
        containerSize,
        "bg-gradient-to-b from-sky-400 via-white to-sky-400 rounded-3xl flex flex-col items-center justify-center shadow-xl shadow-sky-500/20 relative overflow-hidden pt-1 border border-zinc-200"
      )}>
        {/* Three Stars like Argentina Jersey */}
        <div className="flex gap-1 mb-[-2px] z-20">
          <Star className={cn(size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2', "text-yellow-500 fill-yellow-500")} />
          <Star className={cn(size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2', "text-yellow-500 fill-yellow-500 -mt-1")} />
          <Star className={cn(size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2', "text-yellow-500 fill-yellow-500")} />
        </div>
        
        <Trophy className={cn(iconSize, "text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)] z-10")} />
        <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />
      </div>
      {showText && (
        <span className={cn(
          textSize,
          "font-black tracking-tighter text-zinc-900 drop-shadow-md"
        )}>
          GOLAZO
        </span>
      )}
    </div>
  );
};
