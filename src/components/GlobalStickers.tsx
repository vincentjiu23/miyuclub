"use client";

import { useState, useEffect } from 'react';

interface StickerProps {
  id: string;
  type: number;
  x: number;
  y: number;
  rotation: number;
}

export default function GlobalStickers() {
  const [stickers, setStickers] = useState<StickerProps[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage so they persist across reloads
    const saved = localStorage.getItem('miyu-global-stickers');
    if (saved) {
       try { setStickers(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (mounted) {
       localStorage.setItem('miyu-global-stickers', JSON.stringify(stickers));
    }
  }, [stickers, mounted]);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping globally
    };

    const handleDrop = (e: DragEvent) => {
      const data = e.dataTransfer?.getData('text/plain');
      
      if (data && (data.startsWith('new:') || data.startsWith('move:'))) {
         e.preventDefault();
         const x = e.pageX;
         const y = e.pageY;
         
         if (data.startsWith('new:')) {
             const type = parseInt(data.replace('new:', ''));
             const rotation = Math.random() * 60 - 30; // -30 to 30 degrees for more variety
             
             setStickers(prev => [...prev, {
                id: `sticker-${Date.now()}-${Math.random()}`,
                type,
                x,
                y,
                rotation
             }]);
         } else if (data.startsWith('move:')) {
             const moveStickerId = data.replace('move:', '');
             setStickers(prev => prev.map(s => s.id === moveStickerId ? { ...s, x, y } : s));
         }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <>
      {/* Placed Stickers */}
      <div className="absolute top-0 left-0 w-full h-0 pointer-events-none z-[9998]">
        {stickers.map(s => (
           <img 
             key={s.id}
             src={`/images/sticker/sticker-${s.type}.png`}
             alt="Sticker"
             draggable
             onDragStart={(e) => {
                 e.dataTransfer.setData('text/plain', `move:${s.id}`);
             }}
             className="absolute pointer-events-auto cursor-grab active:cursor-grabbing filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform"
             style={{
                left: s.x,
                top: s.y,
                transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                width: '180px',
                height: '180px',
                objectFit: 'contain'
             }}
             onDoubleClick={() => {
                // Remove sticker on double click
                setStickers(prev => prev.filter(st => st.id !== s.id));
             }}
             title="Drag to move, Double click to peel off"
           />
        ))}
      </div>

      {/* Floating Sticker Drawer */}
      <div className={`fixed bottom-24 left-4 z-[9999] transition-transform ${isOpen ? 'translate-y-0' : 'translate-y-[150%]'}`}>
         <div className="bg-white border-4 border-electric-navy p-4 shadow-[8px_8px_0px_#224870] flex flex-col gap-4 sticky-note sticker-rotate-neg-1 w-72 max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b-2 border-electric-navy pb-2">
               <h3 className="font-handwriting text-2xl text-electric-navy flex items-center gap-1">
                 <span className="material-symbols-outlined">auto_awesome</span> Stickers
               </h3>
               <button onClick={() => setIsOpen(false)} className="text-racing-red font-bold text-xl hover:scale-110">
                 <span className="material-symbols-outlined">close</span>
               </button>
            </div>
            
            <p className="text-sm font-handwriting opacity-80">Drag a sticker anywhere on the screen! Double click a placed sticker to peel it off.</p>
            
            {stickers.length > 0 && (
              <button 
                onClick={() => setStickers([])}
                className="w-full bg-racing-red text-white font-handwriting text-lg border-2 border-electric-navy p-2 hover:bg-opacity-90 active:translate-y-1 transition-transform"
              >
                Clear All Placed Stickers
              </button>
            )}

            <div className="grid grid-cols-2 gap-4 place-items-center mt-2">
               {[1,2,3,4,5].map(num => (
                  <img
                    key={num}
                    src={`/images/sticker/sticker-${num}.png`}
                    className="w-24 h-24 object-contain cursor-grab active:cursor-grabbing hover:scale-110 transition-transform filter drop-shadow-[2px_2px_0px_#224870]"
                    draggable
                    onDragStart={(e) => {
                       e.dataTransfer.setData('text/plain', `new:${num}`);
                    }}
                  />
               ))}
            </div>
         </div>
      </div>

      {/* Toggle Button */}
      <button 
         onClick={() => setIsOpen(true)}
         className={`fixed bottom-24 left-4 z-[9999] bg-sunny-yellow text-electric-navy p-3 border-4 border-electric-navy shadow-[4px_4px_0px_#224870] font-handwriting text-xl hover:-translate-y-1 transition-transform items-center gap-2 ${isOpen ? 'hidden' : 'flex'}`}
      >
         <span className="material-symbols-outlined">mood</span>
         Sticker Book
      </button>
    </>
  );
}
