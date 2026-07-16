"use client";

import { useState } from "react";
import Link from "next/link";

export default function MarketplacePage() {
  return (
    <main className="pb-32">
      {/* Marketplace Hero Section */}
      <div 
        className="w-full relative cursor-pointer" 
        onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <img 
          src="/images/asset/Website.png" 
          alt="Miyu Club Marketplace" 
          className="w-full h-auto object-cover"
        />
      </div>

      <section id="catalog" className="relative px-margin-mobile md:px-margin-desktop py-8 md:py-12 scroll-mt-20">
        {/* Categories Chips */}
        <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 no-scrollbar">
          <button className="whitespace-nowrap px-6 py-2 bg-sunny-yellow text-electric-navy font-handwriting text-lg sticky-note hover:-translate-y-1 transition-transform">ALL GEAR</button>
          <button className="whitespace-nowrap px-6 py-2 bg-white text-electric-navy font-handwriting text-lg sticky-note hover:bg-sky-blue hover:text-white transition-colors sticker-rotate-1">APPAREL</button>
          <button className="whitespace-nowrap px-6 py-2 bg-white text-electric-navy font-handwriting text-lg sticky-note hover:bg-sky-blue hover:text-white transition-colors sticker-rotate-neg-1">ACCESSORIES</button>
          <button className="whitespace-nowrap px-6 py-2 bg-white text-electric-navy font-handwriting text-lg sticky-note hover:bg-sky-blue hover:text-white transition-colors">ART PRINTS</button>
          <button className="whitespace-nowrap px-6 py-2 bg-white text-electric-navy font-handwriting text-lg sticky-note hover:bg-sky-blue hover:text-white transition-colors sticker-rotate-1">VINYL TOYS</button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter mt-8">
        
        {/* Product Card 1 */}
        <div className="group bg-white sticky-note p-4 flex flex-col gap-4 transition-transform hover:-translate-y-1 tape-effect sticker-rotate-neg-1">
          <div className="relative overflow-hidden aspect-square border-2 border-electric-navy bg-surface-container group/image">
            <img 
              className="w-full h-full object-cover transition-all absolute top-0 left-0 opacity-100 group-hover/image:opacity-0" 
              alt="MIYU PIZZA T-Shirt #1 Front" 
              src="/images/products/miyu-pizza-1.png.png"
            />
            <img 
              className="w-full h-full object-cover transition-all absolute top-0 left-0 opacity-0 group-hover/image:opacity-100" 
              alt="MIYU PIZZA T-Shirt #1 Back" 
              src="/images/products/miyu-pizza-11.png.png"
            />
            <div className="absolute top-2 right-2 bg-racing-red text-white font-handwriting text-sm px-3 py-1 border-2 border-electric-navy sticker-rotate-2 z-10">NEW</div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-handwriting text-2xl text-electric-navy uppercase tracking-tight text-center border-t border-dashed border-electric-navy pt-2 mt-1">MIYU PIZZA #1</h3>
          </div>
          <div className="flex gap-2 w-full mt-auto">
            <a className="flex-1 flex items-center justify-center py-2 bg-white border-2 border-[#42B549] sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://tk.tokopedia.com/ZSCTJaXup/" target="_blank" rel="noreferrer" title="Beli di Tokopedia">
              <img src="/images/tokopedia.png" className="h-8 w-auto object-contain" alt="Tokopedia" />
            </a>
            <a className="flex-1 flex items-center justify-center py-2 bg-black border-2 border-electric-navy sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://vt.tiktok.com/ZSCTJvt5y/?page=Mall" target="_blank" rel="noreferrer" title="Beli di TikTok">
              <img src="https://cdn.simpleicons.org/tiktok/white" className="w-8 h-8" alt="TikTok" />
            </a>
          </div>
        </div>

        {/* Product Card 2 */}
        <div className="group bg-white sticky-note p-4 flex flex-col gap-4 transition-transform hover:-translate-y-1 sticker-rotate-1">
          <div className="relative overflow-hidden aspect-square border-2 border-electric-navy bg-surface-container group/image">
            <img 
              className="w-full h-full object-cover transition-all absolute top-0 left-0 opacity-100 group-hover/image:opacity-0" 
              alt="MIYU PIZZA T-Shirt #2 Front" 
              src="/images/products/miyu-pizza-2.png.png"
            />
            <img 
              className="w-full h-full object-cover transition-all absolute top-0 left-0 opacity-0 group-hover/image:opacity-100" 
              alt="MIYU PIZZA T-Shirt #2 Back" 
              src="/images/products/miyu-pizza-22.png.png"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-handwriting text-2xl text-electric-navy uppercase tracking-tight text-center border-t border-dashed border-electric-navy pt-2 mt-1">MIYU PIZZA #2</h3>
          </div>
          <div className="flex gap-2 w-full mt-auto">
            <a className="flex-1 flex items-center justify-center py-2 bg-white border-2 border-[#42B549] sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://tk.tokopedia.com/ZSCTJaXup/" target="_blank" rel="noreferrer" title="Beli di Tokopedia">
              <img src="/images/tokopedia.png" className="h-8 w-auto object-contain" alt="Tokopedia" />
            </a>
            <a className="flex-1 flex items-center justify-center py-2 bg-black border-2 border-electric-navy sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://vt.tiktok.com/ZSCTJvt5y/?page=Mall" target="_blank" rel="noreferrer" title="Beli di TikTok">
              <img src="https://cdn.simpleicons.org/tiktok/white" className="w-8 h-8" alt="TikTok" />
            </a>
          </div>
        </div>

        {/* Product Card 3 */}
        <div className="group bg-white sticky-note p-4 flex flex-col gap-4 transition-transform hover:-translate-y-1 sticker-rotate-neg-2">
          <div className="relative overflow-hidden aspect-square border-2 border-electric-navy bg-surface-container group/image">
            <img 
              className="w-full h-full object-cover transition-all absolute top-0 left-0 opacity-100 group-hover/image:opacity-0" 
              alt="MIYU PIZZA T-Shirt #3 Front" 
              src="/images/products/miyu-pizza-3.png.png"
            />
            <img 
              className="w-full h-full object-cover transition-all absolute top-0 left-0 opacity-0 group-hover/image:opacity-100" 
              alt="MIYU PIZZA T-Shirt #3 Back" 
              src="/images/products/miyu-pizza-33.png.png"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-handwriting text-2xl text-electric-navy uppercase tracking-tight text-center border-t border-dashed border-electric-navy pt-2 mt-1">MIYU PIZZA #3</h3>
          </div>
          <div className="flex gap-2 w-full mt-auto">
            <a className="flex-1 flex items-center justify-center py-2 bg-white border-2 border-[#42B549] sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://tk.tokopedia.com/ZSCTJaXup/" target="_blank" rel="noreferrer" title="Beli di Tokopedia">
              <img src="/images/tokopedia.png" className="h-8 w-auto object-contain" alt="Tokopedia" />
            </a>
            <a className="flex-1 flex items-center justify-center py-2 bg-black border-2 border-electric-navy sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://vt.tiktok.com/ZSCTJvt5y/?page=Mall" target="_blank" rel="noreferrer" title="Beli di TikTok">
              <img src="https://cdn.simpleicons.org/tiktok/white" className="w-8 h-8" alt="TikTok" />
            </a>
          </div>
        </div>

        {/* Product Card 4 */}
        <div className="group bg-white sticky-note p-4 flex flex-col gap-4 transition-transform hover:-translate-y-1 sticker-rotate-1">
          <div className="relative overflow-hidden aspect-square border-2 border-electric-navy bg-surface-container">
            <img 
              className="w-full h-full object-cover transition-all" 
              alt="MIYU PIZZA T-Shirt #4" 
              src="/images/products/miyu-pizza-4.png.png"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-handwriting text-2xl text-electric-navy uppercase tracking-tight text-center border-t border-dashed border-electric-navy pt-2 mt-1">MIYU PIZZA #4</h3>
          </div>
          <div className="flex gap-2 w-full mt-auto">
            <a className="flex-1 flex items-center justify-center py-2 bg-white border-2 border-[#42B549] sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://tk.tokopedia.com/ZSCTJaXup/" target="_blank" rel="noreferrer" title="Beli di Tokopedia">
              <img src="/images/tokopedia.png" className="h-8 w-auto object-contain" alt="Tokopedia" />
            </a>
            <a className="flex-1 flex items-center justify-center py-2 bg-black border-2 border-electric-navy sticky-note transition-all hover:-translate-y-1 active:translate-y-0" href="https://vt.tiktok.com/ZSCTJvt5y/?page=Mall" target="_blank" rel="noreferrer" title="Beli di TikTok">
              <img src="https://cdn.simpleicons.org/tiktok/white" className="w-8 h-8" alt="TikTok" />
            </a>
          </div>
        </div>

      </section>
      
      {/* Promotional Banner */}
      <section className="px-margin-mobile md:px-margin-desktop py-20 mt-12">
        <div className="relative bg-sunny-yellow border-2 border-electric-navy p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 sticky-note sticker-rotate-neg-1">
          <div className="relative z-10 flex flex-col gap-4 max-w-xl text-center md:text-left">
            <h2 className="font-handwriting text-5xl md:text-7xl text-electric-navy leading-none uppercase">JOIN THE CLUB<br/>GET 20% OFF</h2>
            <p className="text-electric-navy font-handwriting text-xl">Sign up for our newsletter to get early access to limited drops and exclusive community discounts.</p>
          </div>
          <div className="relative z-10 w-full md:w-auto flex flex-col gap-4">
            <input className="w-full md:w-80 px-4 py-4 bg-white border-2 border-electric-navy text-electric-navy font-handwriting text-lg focus:ring-2 focus:ring-sky-blue outline-none transition-all" placeholder="YOUR@EMAIL.COM" type="email" />
            <button className="w-full py-4 bg-electric-navy text-white font-handwriting text-xl border-2 border-electric-navy sticky-note hover:bg-sky-blue transition-all active:translate-y-1">SIGN UP NOW</button>
          </div>
        </div>
      </section>

    </main>
  );
}
