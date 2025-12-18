import { TypewriterText } from './ui/TypewriterText';

export function HeroSection() {
  const subtitleText =
    'Образовательная платформа, где обучение — это путешествие по карте знаний. Выбирайте свой маршрут, проходите уроки и отслеживайте прогресс на логическом графе.';

  return (
    <section className="relative overflow-hidden border-b-2 border-black/5">
      <div className="container mx-auto px-6 py-20 md:py-28 relative z-10">
        <div className="max-w-3xl relative">
          {/* Text container with black background */}
          <div className="flex items-end gap-3 mb-6">
            <div className="relative inline-block">
              <div className="bg-black px-6 py-3 inline-block">
                <h1 className="text-white font-mono tracking-widest uppercase mb-0 text-3xl md:text-4xl">
                  Выстрой свой путь
                </h1>
              </div>
              {/* Corner decorations */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-black" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-black" />
            </div>

            <span className="text-black/70 font-mono italic text-xs md:text-sm tracking-wide whitespace-nowrap pb-1">
              prod. by emit
            </span>
          </div>
          
          <div className="border-l-4 border-black border-t border-r border-b pl-6 mt-8 bg-white/80 backdrop-blur-sm p-4">
            <p className="text-foreground max-w-2xl font-mono leading-relaxed text-lg min-h-[6rem]">
              <TypewriterText
                text={subtitleText}
                speedMs={22}
                speedJitterMs={18}
                punctuationPauseMs={180}
              />
            </p>
          </div>
        </div>
        
        {/* Decorative geometric elements - keeping these as they fit the style */}
        <div className="absolute top-10 right-20 w-24 h-24 border-4 border-black opacity-10 rotate-12" />
        <div className="absolute bottom-20 right-40 w-16 h-16 bg-black opacity-5 rounded-full" />
      </div>
    </section>
  );
}