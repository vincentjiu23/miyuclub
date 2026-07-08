"use client";

import { useState, useRef, useEffect } from "react";
import { createPost } from "@/app/actions/postActions";

export default function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'select' | 'upload' | 'photobooth' | 'edit' | 'preview'>('select');
  const [rawPreview, setRawPreview] = useState<string | null>(null); // Original unedited image
  const [preview, setPreview] = useState<string | null>(null); // Final edited image
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Transform state for edit mode
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0, rotate: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Stop camera when closing or unmounting
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
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

  const capturePhoto = () => {
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
            setRawPreview(url);
            setTransform({ scale: 1, x: 0, y: 0, rotate: 0 });
            stopCamera();
            setMode('edit');
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRawPreview(url);
      setTransform({ scale: 1, x: 0, y: 0, rotate: 0 });
      setMode('edit');
    }
  };

  const applyEdits = () => {
    if (!rawPreview) return;
    
    const canvas = document.createElement('canvas');
    // A5 Landscape high resolution
    canvas.width = 2100;
    canvas.height = 1480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Apply UI translation (percentage of canvas)
      ctx.translate((transform.x / 100) * canvas.width, (transform.y / 100) * canvas.height);
      
      // Apply rotation
      ctx.rotate((transform.rotate * Math.PI) / 180);
      
      // Apply scale based on object-cover equivalent
      const scaleX = canvas.width / img.width;
      const scaleY = canvas.height / img.height;
      const baseScale = Math.max(scaleX, scaleY);
      
      ctx.scale(baseScale * transform.scale, baseScale * transform.scale);
      
      // Draw centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `edited-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedFile(file);
          setPreview(URL.createObjectURL(file));
          setMode('preview');
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = rawPreview;
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
    <div className="fixed inset-0 bg-electric-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-electric-navy p-6 sticky-note transform sticker-rotate-neg-1 max-w-lg w-full">
        <h2 className="font-handwriting text-headline-md text-electric-navy mb-4">New Post</h2>
        
        {mode === 'select' && (
           <div className="flex flex-col gap-4 py-8">
             <button onClick={() => setMode('upload')} className="bg-sky-blue text-white py-4 border-2 border-electric-navy font-label-bold hover:-translate-y-1 transition-transform flex flex-col items-center gap-2">
               <span className="material-symbols-outlined text-4xl">upload_file</span>
               UPLOAD IMAGE
             </button>
             <button onClick={startCamera} className="bg-sunny-yellow text-electric-navy py-4 border-2 border-electric-navy font-label-bold hover:-translate-y-1 transition-transform flex flex-col items-center gap-2">
               <span className="material-symbols-outlined text-4xl">photo_camera</span>
               PHOTOBOOTH
             </button>
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
           <div className="flex flex-col gap-4">
             <div className="border-2 border-electric-navy bg-black relative overflow-hidden flex items-center justify-center" style={{ aspectRatio: '210/148' }}>
               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
               
               {/* Frame selection placeholder */}
               <div className="absolute top-4 right-4 z-10">
                 <select className="bg-white/80 backdrop-blur-sm border-2 border-electric-navy p-1 font-label-bold text-xs" disabled>
                   <option>No Frame (Coming Soon)</option>
                 </select>
               </div>
             </div>
             
             <canvas ref={canvasRef} className="hidden" />
             
             <div className="flex gap-4">
               <button onClick={() => { stopCamera(); setMode('select'); }} className="flex-1 py-3 bg-white border-2 border-electric-navy font-label-bold">
                 BACK
               </button>
               <button onClick={capturePhoto} className="flex-1 py-3 bg-racing-red text-white border-2 border-electric-navy font-label-bold">
                 CAPTURE
               </button>
             </div>
           </div>
        )}

        {mode === 'edit' && (
          <div className="flex flex-col gap-4">
            <div className="border-2 border-electric-navy relative overflow-hidden bg-black" style={{ aspectRatio: '210/148' }}>
              {rawPreview && (
                <img 
                  src={rawPreview} 
                  alt="Edit preview" 
                  className="w-full h-full object-cover origin-center"
                  style={{
                    transform: `translate(${transform.x}%, ${transform.y}%) rotate(${transform.rotate}deg) scale(${transform.scale})`
                  }}
                />
              )}
            </div>
            
            <div className="flex flex-col gap-3 bg-gray-50 p-4 border-2 border-electric-navy text-sm font-label-bold text-electric-navy">
              <div className="flex items-center gap-4">
                <label className="w-20">ZOOM</label>
                <input type="range" min="0.5" max="3" step="0.1" value={transform.scale} onChange={e => setTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))} className="flex-1" />
                <span className="w-8 text-right">{transform.scale.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-20">ROTATE</label>
                <input type="range" min="-180" max="180" step="1" value={transform.rotate} onChange={e => setTransform(prev => ({ ...prev, rotate: parseInt(e.target.value) }))} className="flex-1" />
                <span className="w-8 text-right">{transform.rotate}°</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-20">PAN X</label>
                <input type="range" min="-50" max="50" step="1" value={transform.x} onChange={e => setTransform(prev => ({ ...prev, x: parseInt(e.target.value) }))} className="flex-1" />
              </div>
              <div className="flex items-center gap-4">
                <label className="w-20">PAN Y</label>
                <input type="range" min="-50" max="50" step="1" value={transform.y} onChange={e => setTransform(prev => ({ ...prev, y: parseInt(e.target.value) }))} className="flex-1" />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                 <button onClick={() => setTransform({ scale: 1, x: 0, y: 0, rotate: 0 })} className="text-xs bg-white px-2 py-1 border-2 border-electric-navy hover:bg-gray-200">RESET</button>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setMode('select')} className="flex-1 py-3 bg-white border-2 border-electric-navy font-label-bold">
                RETAKE
              </button>
              <button onClick={applyEdits} className="flex-1 py-3 bg-sunny-yellow text-electric-navy border-2 border-electric-navy font-label-bold">
                CONFIRM EDIT
              </button>
            </div>
          </div>
        )}

        {mode === 'preview' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="border-2 border-electric-navy relative overflow-hidden" style={{ aspectRatio: '210/148' }}>
              {preview && <img src={preview} alt="Preview" className="w-full h-full object-cover" />}
              
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
              rows={4}
              className="w-full p-3 border-2 border-electric-navy focus:outline-none focus:ring-2 focus:ring-sunny-yellow font-handwriting text-lg resize-none"
            />
            
            <div className="flex justify-end gap-4 mt-4">
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
  );
}
