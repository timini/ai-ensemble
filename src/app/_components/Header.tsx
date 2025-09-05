"use client";

export function Header() {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <a href="/about" className="text-gray-400 hover:text-white transition-colors">
          About
        </a>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center">AI <span className="text-[hsl(280,100%,70%)]">Ensemble</span></h1>
        <div className="w-12"></div> {/* Spacer for centering */}
      </div>
      <p className="text-center text-gray-400 mb-8">The smartest AI is an ensemble</p>
    </>
  );
}
