"use client";

import { useState, useRef, useEffect } from "react";
import { createPost } from "@/app/actions/postActions";

export default function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'select' | 'upload' | 'photobooth' | 'edit' | 'preview'>('select');
  const [rawPhotos, setRawPhotos] = useState<string[]>([]); // Original unedited images
  const [numTakes, setNumTakes] = useState<number>(1);
  const [preview, setPreview] = useState<string | null>(null); // Final edited image
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null); // Index of photo being retaken
  
  // Transform state for edit mode
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  const [selectedBorder, setSelectedBorder] = useState<string>('none');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera when closing or unmounting
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [stream]);

  const startCamera = async () => {
    setMode('photobooth');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setMode('select');
    }
  };

  const performCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            if (retakeIndex !== null) {
              // Replace the specific photo
              setRawPhotos(prev => {
                const updated = [...prev];
                updated[retakeIndex] = url;
                return updated;
              });
              setRetakeIndex(null);
              // If all photos are taken, go back to edit
              stopCamera();
              setMode('edit');
            } else {
              // Normal capture flow
              setRawPhotos(prev => {
                const newPhotos = [...prev, url];
                if (newPhotos.length >= numTakes) {
                  setTransform({ scale: 1, x: 0, y: 0, rotate: 0 });
                  stopCamera();
                  setMode('edit');
                }
                return newPhotos;
              });
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  const retakePhoto = async (index: number) => {
    setRetakeIndex(index);
    // If already in photobooth mode with camera, just set the index
    if (mode === 'photobooth' && stream) return;
    // Otherwise start the camera
    setMode('photobooth');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setRetakeIndex(null);
      setMode('edit');
    }
  };

  const capturePhoto = () => {
    if (countdown !== null) return;
    let timer = 3;
    setCountdown(timer);
    
    countdownIntervalRef.current = setInterval(() => {
      timer -= 1;
      if (timer > 0) {
        setCountdown(timer);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        performCapture();
      }
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNumTakes(1);
      setRawPhotos([url]);
      setTransform({ scale: 1, x: 0, y: 0, rotate: 0 });
      setMode('edit');
    }
  };

  const applyEdits = async () => {
    if (rawPhotos.length === 0) return;
    
    const canvas = document.createElement('canvas');
    // A5 Landscape high resolution
    canvas.width = 2100;
    canvas.height = 1480 * numTakes;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    try {
      for (let i = 0; i < rawPhotos.length; i++) {
        const img = await loadImage(rawPhotos[i]);
        
        ctx.save();
        // Center for this specific photo block
        const centerY = (i * 1480) + (1480 / 2);
        ctx.translate(canvas.width / 2, centerY);
        
        // Apply UI translation (percentage of canvas)
        ctx.translate((transform.x / 100) * canvas.width, (transform.y / 100) * 1480);
        
        // Apply rotation
        ctx.rotate((transform.rotate * Math.PI) / 180);
        
        // Apply scale based on object-cover equivalent
        const scaleX = canvas.width / img.width;
        const scaleY = 1480 / img.height;
        const baseScale = Math.max(scaleX, scaleY);
        
        ctx.scale(baseScale * transform.scale, baseScale * transform.scale);
        
        // Draw centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      }

      const finishCanvas = () => {
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setCapturedFile(file);
            setPreview(URL.createObjectURL(file));
            setMode('preview');
          }
        }, 'image/jpeg', 0.9);
      };

      if (selectedBorder !== 'none') {
        const borderImg = await loadImage(`/images/border/${selectedBorder}.png`);
        for (let i = 0; i < numTakes; i++) {
          ctx.drawImage(borderImg, 0, i * 1480, canvas.width, 1480);
        }
        finishCanvas();
      } else {
        finishCanvas();
      }
    } catch (err) {
      console.error("Error applying edits", err);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!capturedFile) {
       alert("Please provide an image.");
       return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    // Explicitly set the captured file
    formData.set('image', capturedFile);
    
    const result = await createPost(formData);
    
    setIsSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      alert("Failed to upload post: " + result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-electric-navy/80 backdrop-blur-sm z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="min-h-full flex items-start justify-center p-2 sm:p-4">
      <div className="bg-white border-2 border-electric-navy p-4 sm:p-6 sticky-note max-w-3xl w-full my-4">
        <h2 className="font-handwriting text-headline-md text-electric-navy mb-4">New Post</h2>
        
        {mode === 'select' && (
           <div className="flex flex-col gap-4 py-8">
             <button onClick={() => setMode('upload')} className="bg-sky-blue text-white py-4 border-2 border-electric-navy font-label-bold hover:-translate-y-1 transition-transform flex flex-col items-center gap-2">
               <span className="material-symbols-outlined text-4xl">upload_file</span>
               UPLOAD IMAGE
             </button>
             <div className="flex flex-col gap-2 p-4 border-2 border-electric-navy bg-sunny-yellow/20">
               <p className="font-label-bold text-electric-navy text-center mb-2">PHOTOBOOTH</p>
               <div className="flex gap-2">
                 {[1, 2, 3].map(n => (
                   <button 
                     key={n}
                     onClick={() => { setNumTakes(n); setRawPhotos([]); startCamera(); }} 
                     className="flex-1 bg-sunny-yellow text-electric-navy py-3 border-2 border-electric-navy font-label-bold hover:-translate-y-1 transition-transform flex flex-col items-center"
                   >
                     <span className="material-symbols-outlined text-2xl">photo_camera</span>
                     {n} TAKE{n > 1 ? 'S' : ''}
                   </button>
                 ))}
               </div>
             </div>>
             <button onClick={handleCancel} className="mt-4 text-electric-navy font-label-bold hover:underline">
               CANCEL
             </button>
           </div>
        )}

        {mode === 'upload' && (
           <div className="flex flex-col gap-4">
             <div className="border-2 border-dashed border-electric-navy p-4 flex flex-col items-center justify-center min-h-[200px] relative">
               <div className="text-center opacity-50 mb-2">
                 <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                 <p className="font-label-bold">Select an image (JPG/PNG)</p>
               </div>
               <input 
                 type="file" 
                 name="image"
                 accept="image/jpeg, image/png"
                 onChange={handleFileChange}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
             </div>
             <button onClick={() => setMode('select')} className="text-electric-navy font-label-bold hover:underline self-center">
               BACK
             </button>
           </div>
        )}

        {mode === 'photobooth' && (
           <div className="flex gap-4">
             {/* Captured Photos Preview Sidebar */}
             {rawPhotos.length > 0 && (
               <div className="w-16 md:w-24 flex flex-col gap-2 shrink-0 overflow-y-auto max-h-[300px] pr-1">
                 <p className="font-label-bold text-electric-navy text-[10px] text-center">TAKES</p>
                 <div className="flex flex-col gap-2">
                   {rawPhotos.map((photo, i) => (
                     <div key={i} className="relative group">
                       <div className={`aspect-[210/148] border-2 bg-black overflow-hidden relative ${retakeIndex === i ? 'border-racing-red' : 'border-electric-navy'}`}>
                         <img src={photo} alt={`Take ${i+1}`} className="w-full h-full object-cover" />
                         <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 font-label-bold">{i+1}</span>
                       </div>
                       <button 
                         onClick={() => retakePhoto(i)}
                         className="w-full text-[8px] bg-racing-red/80 text-white font-label-bold py-0.5 hover:bg-racing-red transition-colors"
                       >
                         RETAKE
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
             <div className="flex-1 flex flex-col gap-4">
               <div className="border-2 border-electric-navy bg-black relative overflow-hidden flex items-center justify-center" style={{ aspectRatio: '210/148' }}>
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0 z-0"></video>
                 {selectedBorder !== 'none' && (
                   <img 
                     src={`/images/border/${selectedBorder}.png`} 
                     alt="Border" 
                     className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none"
                   />
                 )}
                 {countdown !== null && (
                   <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                     <span className="text-white text-8xl font-handwriting font-bold animate-pulse">{countdown}</span>
                   </div>
                 )}
                 {retakeIndex !== null && (
                   <div className="absolute top-2 left-2 z-20 bg-racing-red text-white text-xs px-2 py-1 font-label-bold">
                     RETAKING #{retakeIndex + 1}
                   </div>
                 )}
               </div>
               
               <canvas ref={canvasRef} className="hidden" />
               
               <div className="flex gap-4">
                 <button onClick={() => { stopCamera(); setRetakeIndex(null); if (rawPhotos.length > 0 && rawPhotos.length >= numTakes) { setMode('edit'); } else { setMode('select'); } }} className="flex-1 py-3 bg-white border-2 border-electric-navy font-label-bold">
                   {retakeIndex !== null ? 'CANCEL RETAKE' : 'BACK'}
                 </button>
                 <button onClick={capturePhoto} disabled={countdown !== null} className={`flex-1 py-3 bg-racing-red text-white border-2 border-electric-navy font-label-bold ${countdown !== null ? 'opacity-50' : ''}`}>
                   {countdown !== null ? 'CAPTURING...' : retakeIndex !== null ? `RETAKE #${retakeIndex + 1}` : `CAPTURE ${numTakes > 1 ? `(${rawPhotos.length + 1}/${numTakes})` : ''}`}
                 </button>
               </div>
             </div>
             
             {/* Frame Selection Sidebar */}
             <div className="w-20 md:w-28 flex flex-col gap-2 shrink-0 overflow-y-auto max-h-[300px] pr-1">
               <p className="font-label-bold text-electric-navy text-xs text-center">FRAME</p>
               <button 
                 onClick={() => setSelectedBorder('none')}
                 className={`border-2 p-1 transition-colors ${selectedBorder === 'none' ? 'border-racing-red bg-sunny-yellow/20' : 'border-electric-navy bg-white hover:bg-gray-100'}`}
               >
                 <div className="aspect-[210/148] border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 font-label-bold">
                   NO FRAME
                 </div>
               </button>
               <button 
                 onClick={() => setSelectedBorder('border1')}
                 className={`border-2 p-1 transition-colors ${selectedBorder === 'border1' ? 'border-racing-red bg-sunny-yellow/20' : 'border-electric-navy bg-white hover:bg-gray-100'}`}
               >
                 <img src="/images/border/border1.png" alt="Border 1" className="w-full h-auto bg-gray-200" />
               </button>
             </div>
           </div>
        )}

        {mode === 'edit' && (
          <div className="flex gap-4">
            {/* Thumbnails sidebar for retake in edit mode */}
            {numTakes > 1 && (
              <div className="w-16 md:w-24 flex flex-col gap-2 shrink-0">
                <p className="font-label-bold text-electric-navy text-[10px] text-center">TAKES</p>
                {rawPhotos.map((photo, i) => (
                  <div key={i} className="relative">
                    <div className="aspect-[210/148] border-2 border-electric-navy bg-black overflow-hidden">
                      <img src={photo} alt={`Take ${i+1}`} className="w-full h-full object-cover" />
                    </div>
                    <button 
                      onClick={() => retakePhoto(i)}
                      className="w-full text-[8px] bg-racing-red/80 text-white font-label-bold py-0.5 hover:bg-racing-red transition-colors"
                    >
                      RETAKE #{i+1}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex-1 flex flex-col gap-3">
              {/* Photo strip preview - compact */}
              <div className="border-2 border-electric-navy bg-black overflow-y-auto" style={{ maxHeight: '30vh' }}>
                <div className="flex flex-col w-full">
                  {rawPhotos.map((photo, i) => (
                    <div key={i} className="relative w-full overflow-hidden shrink-0 border-b-2 border-electric-navy/20 last:border-b-0" style={{ aspectRatio: '210/148' }}>
                      <img 
                        src={photo} 
                        alt={`Edit preview ${i + 1}`} 
                        className="w-full h-full object-cover origin-center absolute inset-0 z-0"
                        style={{
                          transform: `translate(${transform.x}%, ${transform.y}%) rotate(${transform.rotate}deg) scale(${transform.scale})`
                        }}
                      />
                      {selectedBorder !== 'none' && (
                        <img 
                          src={`/images/border/${selectedBorder}.png`} 
                          alt="Border" 
                          className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Controls - compact */}
              <div className="flex flex-col gap-2 bg-gray-50 p-3 border-2 border-electric-navy text-xs font-label-bold text-electric-navy">
                <div className="flex items-center gap-3">
                  <label className="w-16">ZOOM</label>
                  <input type="range" min="0.5" max="3" step="0.1" value={transform.scale} onChange={e => setTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} className="flex-1" />
                  <span className="w-8 text-right">{transform.scale.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16">ROTATE</label>
                  <input type="range" min="-180" max="180" step="1" value={transform.rotate} onChange={e => setTransform(prev => ({ ...prev, rotate: parseInt(e.target.value) }))} className="flex-1" />
                  <span className="w-8 text-right">{transform.rotate}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16">PAN X</label>
                  <input type="range" min="-50" max="50" step="1" value={transform.x} onChange={e => setTransform(prev => ({ ...prev, x: parseInt(e.target.value) }))} className="flex-1" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-16">PAN Y</label>
                  <input type="range" min="-50" max="50" step="1" value={transform.y} onChange={e => setTransform(prev => ({ ...prev, y: parseInt(e.target.value) }))} className="flex-1" />
                </div>
                <div className="flex items-center gap-3 border-t-2 border-electric-navy/20 pt-2">
                  <label className="w-16">FRAME</label>
                  <select 
                    value={selectedBorder} 
                    onChange={(e) => setSelectedBorder(e.target.value)}
                    className="flex-1 p-1 border-2 border-electric-navy font-label-bold bg-white text-xs"
                  >
                    <option value="none">No Frame</option>
                    <option value="border1">Border 1</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                   <button onClick={() => setTransform({ scale: 1, x: 0, y: 0, rotate: 0 })} className="text-xs bg-white px-2 py-1 border-2 border-electric-navy hover:bg-gray-200">RESET TWEAKS</button>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setRawPhotos([]); setMode('select'); }} className="flex-1 py-2 bg-white border-2 border-electric-navy font-label-bold text-sm">
                  RETAKE ALL
                </button>
                <button onClick={applyEdits} className="flex-1 py-2 bg-sunny-yellow text-electric-navy border-2 border-electric-navy font-label-bold text-sm">
                  CONFIRM EDIT
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'preview' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="border-2 border-electric-navy relative bg-black">
              {preview && <img src={preview} alt="Preview" className="w-full h-auto object-contain max-h-[35vh]" style={{ margin: '0 auto', display: 'block' }} />}
              
              <button 
                type="button" 
                onClick={() => setMode('edit')} 
                className="absolute top-2 right-2 bg-white rounded-full p-2 border-2 border-electric-navy hover:text-racing-red transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>

            <textarea 
              name="caption"
              placeholder="Write a caption..." 
              required
              rows={3}
              className="w-full p-3 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sunny-yellow font-handwriting text-lg resize-none"
            />
            
            <div className="flex justify-end gap-4">
              <button 
                type="button" 
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6 py-2 font-label-bold text-electric-navy hover:bg-gray-100 border-2 border-transparent"
              >
                CANCEL
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-2 bg-racing-red text-white font-label-bold border-2 border-electric-navy sticky-note hover:bg-electric-navy hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "POSTING..." : "POST"}
              </button>
            </div>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
