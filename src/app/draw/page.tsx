"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createVanGoghPost } from '@/app/actions/vanGoghActions';

type Tool = 'brush' | 'eraser' | 'spray' | 'bucket';
type BrushShape = 'round' | 'square';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function DrawPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // States
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'layer-1', name: 'Background', visible: true, opacity: 1, canvasRef: { current: null } }
  ]);
  const [activeLayerId, setActiveLayerId] = useState('layer-1');
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Track last cursor position for continuous brush strokes (prevents opacity stacking)
  const lastPos = useRef<{x: number, y: number} | null>(null);
  // Track current cursor position for the spray interval
  const currentPos = useRef<{x: number, y: number} | null>(null);
  
  // Tool properties
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushShape, setBrushShape] = useState<BrushShape>('round');
  const [color, setColor] = useState("#224870"); 
  const [brushSize, setBrushSize] = useState(5);
  const [opacity, setOpacity] = useState(1);

  // History for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Helper to get active canvas
  const getActiveCanvas = () => {
    return layers.find(l => l.id === activeLayerId)?.canvasRef.current;
  };

  // Helper to capture state
  const saveHistory = useCallback(() => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep, activeLayerId, layers]);

  // Handle Resize & Init
  useEffect(() => {
    const initCanvas = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;

      layers.forEach(layer => {
        const canvas = layer.canvasRef.current;
        if (!canvas) return;
        
        // Save old content if exists
        const oldData = canvas.width > 0 ? canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height) : null;
        
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.scale(scale, scale);
           // Special init for background layer
           if (layer.name === 'Background' && !oldData) {
             ctx.fillStyle = "#F8F9FA";
             ctx.fillRect(0, 0, rect.width, rect.height);
             // Save initial state for history
             setTimeout(saveHistory, 100);
           }
        }
      });
    };

    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [layers.length]); // Re-run if layers change

  // Spray logic variables
  const sprayInterval = useRef<NodeJS.Timeout | null>(null);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = getActiveCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // Hex to RGBA for Bucket Tool
  const hexToRgba = (hex: string, op: number) => {
    // Input might be #RRGGBB
    if (hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b, Math.round(op * 255)];
    }
    return [0, 0, 0, 255];
  };

  // Flood Fill Algorithm
  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: number[]) => {
    const scale = window.devicePixelRatio || 1;
    const scaledX = Math.floor(startX * scale);
    const scaledY = Math.floor(startY * scale);
    
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;

    const startPos = (scaledY * canvasWidth + scaledX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // If clicking same color, abort
    if (startR === fillColor[0] && startG === fillColor[1] && startB === fillColor[2] && startA === fillColor[3]) {
      return;
    }

    const matchStartColor = (pos: number) => {
      return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
    };

    const pixelStack = [[scaledX, scaledY]];

    while (pixelStack.length) {
      const newPos = pixelStack.pop();
      if (!newPos) continue;
      let x = newPos[0];
      let y = newPos[1];
      
      let pixelPos = (y * canvasWidth + x) * 4;
      while (y-- >= 0 && matchStartColor(pixelPos)) {
        pixelPos -= canvasWidth * 4;
      }
      pixelPos += canvasWidth * 4;
      ++y;
      
      let reachLeft = false;
      let reachRight = false;
      
      while (y++ < canvasHeight - 1 && matchStartColor(pixelPos)) {
        data[pixelPos] = fillColor[0];
        data[pixelPos + 1] = fillColor[1];
        data[pixelPos + 2] = fillColor[2];
        data[pixelPos + 3] = fillColor[3];
        
        if (x > 0) {
          if (matchStartColor(pixelPos - 4)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, y]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }
        
        if (x < canvasWidth - 1) {
          if (matchStartColor(pixelPos + 4)) {
            if (!reachRight) {
              pixelStack.push([x + 1, y]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }
        pixelPos += canvasWidth * 4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && (e as React.TouchEvent).touches.length === 1) {
       (e as React.TouchEvent).preventDefault();
    }
    
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    lastPos.current = { x, y };
    currentPos.current = { x, y };

    // Apply Opacity & Shape
    ctx.globalAlpha = opacity;
    ctx.lineCap = brushShape;
    ctx.lineJoin = brushShape === 'round' ? 'round' : 'miter';
    
    if (activeTool === 'bucket') {
       floodFill(ctx, x, y, hexToRgba(color, opacity));
       saveHistory();
       return;
    }

    if (activeTool === 'eraser') {
       ctx.globalCompositeOperation = 'destination-out';
    } else {
       ctx.globalCompositeOperation = 'source-over';
    }

    if (activeTool === 'spray') {
       setIsDrawing(true);
       if (sprayInterval.current) clearInterval(sprayInterval.current);
       const spray = () => {
         if (!currentPos.current) return;
         const { x: cx, y: cy } = currentPos.current;
         for (let i = 0; i < 20; i++) {
           const angle = Math.random() * Math.PI * 2;
           const radius = Math.random() * brushSize;
           const offsetX = Math.cos(angle) * radius;
           const offsetY = Math.sin(angle) * radius;
           ctx.fillStyle = color;
           // Apply shape to spray particles as well
           if (brushShape === 'round') {
               ctx.beginPath();
               ctx.arc(cx + offsetX, cy + offsetY, 1, 0, Math.PI*2);
               ctx.fill();
           } else {
               ctx.fillRect(cx + offsetX, cy + offsetY, 1, 1);
           }
         }
       };
       sprayInterval.current = setInterval(spray, 15);
       return;
    }

    setIsDrawing(true);
    
    // Draw initial dot
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e && (e as React.TouchEvent).touches.length === 1) {
       (e as React.TouchEvent).preventDefault();
    }
    
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    currentPos.current = { x, y };

    if (activeTool === 'spray') {
       // Just update currentPos for the interval to pick up
       return;
    }

    if (!lastPos.current) return;

    // Ensure opacity and shape are maintained during draw
    ctx.globalAlpha = opacity;
    ctx.lineCap = brushShape;
    ctx.lineJoin = brushShape === 'round' ? 'round' : 'miter';

    // Draw only the segment from the last position to the current position
    // This prevents the path from compounding opacity on itself during a single stroke
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.stroke();

    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    if (sprayInterval.current) clearInterval(sprayInterval.current);
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.closePath();
    ctx.globalAlpha = 1; // reset alpha
    
    if (isDrawing) {
       saveHistory();
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (layers.find(l => l.id === activeLayerId)?.name === 'Background') {
      ctx.fillStyle = "#F8F9FA";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    saveHistory();
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      restoreCanvas(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      restoreCanvas(history[historyStep + 1]);
    }
  };

  const restoreCanvas = (dataUrl: string) => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
  };

  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    setLayers([{ id: newId, name: `Layer ${layers.length + 1}`, visible: true, opacity: 1, canvasRef: { current: null } }, ...layers]);
    setActiveLayerId(newId);
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const downloadArtwork = () => {
    // Flatten layers onto a temporary canvas
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = rect.width * scale;
    tempCanvas.height = rect.height * scale;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw bottom to top (reverse order in our UI)
    [...layers].reverse().forEach(layer => {
      if (layer.visible && layer.canvasRef.current) {
        tempCtx.drawImage(layer.canvasRef.current, 0, 0);
      }
    });
    
    const link = document.createElement('a');
    link.download = 'miyu-club-artwork.png';
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  };

  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [caption, setCaption] = useState("");
  const [tempDataUrl, setTempDataUrl] = useState("");

  const postToExhibition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = rect.width * scale;
    tempCanvas.height = rect.height * scale;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    [...layers].reverse().forEach(layer => {
      if (layer.visible && layer.canvasRef.current) {
        tempCtx.drawImage(layer.canvasRef.current, 0, 0);
      }
    });
    
    const dataUrl = tempCanvas.toDataURL("image/png");
    setTempDataUrl(dataUrl);
    setShowCaptionModal(true);
  };

  const confirmPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await createVanGoghPost(tempDataUrl, caption);
    
    if (result.success) {
      setShowCaptionModal(false);
      setCaption("");
      alert("Artwork has been posted to OUR VAN GOGH Exhibition!");
    } else {
      alert(result.error || "Failed to post artwork");
    }
  };

  return (
    <main className="pb-32 px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-6 min-h-screen relative">
      
      {/* Header Section */}
      <section className="flex flex-col items-start gap-4 mt-4">
        <div className="bg-sunny-yellow text-electric-navy px-8 py-3 sticky-note sticker-rotate-neg-1 border-4 border-electric-navy shadow-[8px_8px_0px_#224870] flex justify-between w-full md:w-auto items-center">
          <h1 className="font-handwriting text-5xl md:text-6xl uppercase tracking-widest">Graffiti Wall</h1>
          <button onClick={() => window.location.reload()} className="md:hidden bg-electric-navy text-white p-2 tape-effect">
            <span className="material-symbols-outlined">restart_alt</span>
          </button>
        </div>
      </section>

      {/* Main Draw Section */}
      <section className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl mx-auto">
        
        {/* Canvas & Quick Actions */}
        <div className="flex-[3] flex flex-col gap-4">
          {/* Quick Toolbar (Undo/Redo/Clear) */}
          <div className="bg-electric-navy p-3 border-4 border-electric-navy flex justify-between items-center text-white sticky-note sticker-rotate-1 shadow-[4px_4px_0px_#111]">
            <div className="flex gap-4">
               <button onClick={handleUndo} disabled={historyStep <= 0} className={`hover:text-racing-red transition-colors ${historyStep <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <span className="material-symbols-outlined text-3xl">undo</span>
               </button>
               <button onClick={handleRedo} disabled={historyStep >= history.length - 1} className={`hover:text-racing-red transition-colors ${historyStep >= history.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <span className="material-symbols-outlined text-3xl">redo</span>
               </button>
            </div>
            <div className="flex gap-4 font-handwriting text-xl">
               <button onClick={clearCanvas} className="hover:text-racing-red transition-colors flex items-center gap-1">
                 <span className="material-symbols-outlined">delete</span> Clear Layer
               </button>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="bg-surface-container border-4 border-electric-navy sticky-note shadow-[8px_8px_0px_#224870] overflow-hidden relative h-[75vh] lg:h-[85vh]"
            style={{ cursor: activeTool === 'bucket' ? 'cell' : 'crosshair' }}
          >
            {/* Multiple Canvas Layers */}
            {[...layers].reverse().map(layer => (
              <canvas
                key={layer.id}
                ref={(el) => {
                  if (el) layer.canvasRef = { current: el };
                }}
                className={`absolute top-0 left-0 w-full h-full touch-none ${layer.id === activeLayerId ? 'z-10' : 'z-0'} ${layer.visible ? '' : 'hidden'}`}
                style={{ opacity: layer.opacity }}
                onMouseDown={layer.id === activeLayerId ? startDrawing : undefined}
                onMouseMove={layer.id === activeLayerId ? draw : undefined}
                onMouseUp={layer.id === activeLayerId ? stopDrawing : undefined}
                onMouseOut={layer.id === activeLayerId ? stopDrawing : undefined}
                onTouchStart={layer.id === activeLayerId ? startDrawing : undefined}
                onTouchMove={layer.id === activeLayerId ? draw : undefined}
                onTouchEnd={layer.id === activeLayerId ? stopDrawing : undefined}
              />
            ))}
          </div>
        </div>

        {/* Tools Sidebar */}
        <div className="flex-[1] flex flex-col gap-6 w-full">
          
          <div className="bg-white border-4 border-electric-navy p-6 sticky-note sticker-rotate-neg-1 shadow-[8px_8px_0px_#224870] flex flex-col gap-6">
            
            {/* Tool Selection */}
            <div className="flex flex-col gap-3">
              <label className="font-handwriting text-2xl text-electric-navy">Tools</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'brush', icon: 'brush', name: 'Brush' },
                  { id: 'spray', icon: 'blur_on', name: 'Spray' },
                  { id: 'bucket', icon: 'format_color_fill', name: 'Fill' },
                  { id: 'eraser', icon: 'ink_eraser', name: 'Eraser' }
                ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setActiveTool(t.id as Tool)}
                    className={`p-3 border-2 transition-colors flex items-center justify-center ${activeTool === t.id ? 'bg-electric-navy text-white border-electric-navy shadow-inner' : 'bg-surface-container text-electric-navy border-electric-navy hover:bg-sky-blue/20'}`}
                    title={t.name}
                  >
                    <span className="material-symbols-outlined">{t.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="flex flex-col gap-3">
              <label className="font-handwriting text-2xl text-electric-navy">Color</label>
              <div className="flex items-center gap-4">
                 <div className="relative">
                   <input 
                     type="color" 
                     value={color}
                     onChange={(e) => setColor(e.target.value)}
                     className="w-16 h-16 opacity-0 absolute inset-0 cursor-pointer"
                   />
                   <div 
                     className="w-16 h-16 border-4 border-electric-navy shadow-[4px_4px_0px_#224870] pointer-events-none" 
                     style={{ backgroundColor: color }}
                   ></div>
                 </div>
                 <span className="font-handwriting text-2xl">{color.toUpperCase()}</span>
              </div>
            </div>


            {/* Brush Shape */}
            <div className="flex flex-col gap-3">
              <label className="font-handwriting text-2xl text-electric-navy">Brush Type</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setBrushShape('round')}
                  className={`flex-1 p-2 border-2 transition-colors flex items-center justify-center font-handwriting text-lg ${brushShape === 'round' ? 'bg-electric-navy text-white border-electric-navy shadow-inner' : 'bg-surface-container text-electric-navy border-electric-navy hover:bg-sky-blue/20'}`}
                >
                  Round
                </button>
                <button 
                  onClick={() => setBrushShape('square')}
                  className={`flex-1 p-2 border-2 transition-colors flex items-center justify-center font-handwriting text-lg ${brushShape === 'square' ? 'bg-electric-navy text-white border-electric-navy shadow-inner' : 'bg-surface-container text-electric-navy border-electric-navy hover:bg-sky-blue/20'}`}
                >
                  Square / Marker
                </button>
              </div>
            </div>

            {/* Sliders (Size & Opacity) */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="font-handwriting text-lg text-electric-navy flex justify-between">
                  <span>Brush Size</span><span>{brushSize}px</span>
                </label>
                <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full accent-racing-red"/>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-handwriting text-lg text-electric-navy flex justify-between">
                  <span>Brush Opacity</span><span>{Math.round(opacity * 100)}%</span>
                </label>
                <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full accent-sky-blue"/>
              </div>
            </div>
          </div>

          {/* Layer Management */}
          <div className="bg-sky-blue border-4 border-electric-navy p-4 sticky-note sticker-rotate-1 shadow-[8px_8px_0px_#224870] flex flex-col gap-4">
             <div className="flex justify-between items-center border-b-2 border-electric-navy pb-2">
               <h3 className="font-handwriting text-2xl text-white">Layers</h3>
               <button onClick={addLayer} className="bg-white text-electric-navy p-1 border-2 border-electric-navy hover:bg-sunny-yellow tape-effect">
                 <span className="material-symbols-outlined">add</span>
               </button>
             </div>
             <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2">
               {layers.map(layer => (
                 <div 
                   key={layer.id} 
                   className={`flex flex-col gap-2 p-3 border-2 cursor-pointer ${activeLayerId === layer.id ? 'bg-electric-navy text-white border-electric-navy' : 'bg-white text-electric-navy border-electric-navy'}`}
                   onClick={() => setActiveLayerId(layer.id)}
                 >
                   <div className="flex justify-between items-center">
                     <span className="font-handwriting text-xl">{layer.name}</span>
                     <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="hover:text-racing-red">
                       <span className="material-symbols-outlined">{layer.visible ? 'visibility' : 'visibility_off'}</span>
                     </button>
                   </div>
                   {/* Layer Opacity Slider */}
                   <div className="flex flex-col gap-1 mt-2 border-t border-dashed border-current pt-2">
                     <div className="flex justify-between text-xs font-handwriting opacity-80">
                        <span>Opacity</span>
                        <span>{Math.round(layer.opacity * 100)}%</span>
                     </div>
                     <input 
                       type="range" min="0" max="1" step="0.05" value={layer.opacity} 
                       onChange={(e) => {
                         setLayers(layers.map(l => l.id === layer.id ? { ...l, opacity: parseFloat(e.target.value) } : l));
                       }}
                       onClick={(e) => e.stopPropagation()}
                       className="w-full h-2 accent-racing-red"
                     />
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-auto">
            <button 
              onClick={postToExhibition}
              className="w-full py-3 bg-racing-red text-white font-handwriting text-2xl border-4 border-electric-navy transition-transform hover:-translate-y-1 active:translate-y-1 shadow-[4px_4px_0px_#111] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">send</span>
              POST TO EXHIBITION
            </button>
            <div className="flex gap-4">
                <button 
                  onClick={downloadArtwork}
                  className="flex-1 py-3 bg-white text-electric-navy font-handwriting text-xl border-4 border-electric-navy transition-transform hover:-translate-y-1 active:translate-y-1 shadow-[4px_4px_0px_#111] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined">download</span> SAVE
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 bg-white text-electric-navy font-handwriting text-xl border-4 border-electric-navy transition-transform hover:-translate-y-1 active:translate-y-1 shadow-[4px_4px_0px_#111] flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined">add_box</span> NEW
                </button>
            </div>
          </div>

        </div>

      </section>

      {/* Caption Modal */}
      {showCaptionModal && (
        <div className="fixed inset-0 bg-electric-navy/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-electric-navy p-8 sticky-note sticker-rotate-1 max-w-lg w-full">
            <h2 className="font-handwriting text-headline-md text-electric-navy mb-4 uppercase">Name your masterpiece</h2>
            
            <div className="w-full h-48 bg-gray-100 border-2 border-electric-navy mb-6 flex items-center justify-center overflow-hidden">
               <img src={tempDataUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>

            <form onSubmit={confirmPost}>
              <label className="font-label-bold text-electric-navy text-sm mb-2 block">CAPTION</label>
              <textarea 
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Give your art a title or say something about it..." 
                className="w-full p-4 border-2 border-electric-navy font-handwriting text-lg focus:outline-none focus:ring-2 focus:ring-sunny-yellow mb-4 resize-none"
              />
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowCaptionModal(false)} className="px-6 py-2 border-2 border-electric-navy font-label-md text-electric-navy hover:bg-gray-100 sticky-note">CANCEL</button>
                <button type="submit" className="bg-racing-red text-white font-label-md px-6 py-2 border-2 border-electric-navy sticky-note hover:bg-electric-navy transition-colors">POST ARTWORK</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
