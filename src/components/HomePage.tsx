import { HeroSection } from './HeroSection';
import { PurposeGraph } from './PurposeGraph';

export function HomePage() {
  return (
    <div>
      <HeroSection />

      <section className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Section: Purpose */}
          <div className="space-y-6">
            <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
              <h2 className="mb-0 uppercase">Для чего вам GRAPH</h2>
            </div>

            <PurposeGraph />
          </div>

          {/* Section: Team + Contact */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
                <h2 className="mb-0 uppercase">Команда</h2>
              </div>

              <div className="border-2 border-black bg-white p-6 font-mono space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Проект разработан командой образовательного продукта: дизайн, разработка, методология и кураторская
                  поддержка.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="border border-black/20 p-3">
                    <div className="font-bold uppercase tracking-wide">Product</div>
                    <div className="text-gray-700">Концепция, программа, метрики</div>
                  </div>
                  <div className="border border-black/20 p-3">
                    <div className="font-bold uppercase tracking-wide">Design</div>
                    <div className="text-gray-700">UX/UI, визуальная система</div>
                  </div>
                  <div className="border border-black/20 p-3">
                    <div className="font-bold uppercase tracking-wide">Engineering</div>
                    <div className="text-gray-700">Фронтенд, интерактивная карта</div>
                  </div>
                  <div className="border border-black/20 p-3">
                    <div className="font-bold uppercase tracking-wide">Mentors</div>
                    <div className="text-gray-700">Проверка заданий, обратная связь</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
                <h2 className="mb-0 uppercase">Связаться</h2>
              </div>

              <div className="border-2 border-black bg-white p-6 font-mono space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Напишите нам — подскажем по трекам, курсам и доступу к материалам.
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4 border border-black/20 p-3">
                    <div>
                      <div className="font-bold uppercase tracking-wide">Email</div>
                      <div className="text-gray-700">hello@graph.education</div>
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Поддержка</div>
                  </div>
                  <div className="flex items-start justify-between gap-4 border border-black/20 p-3">
                    <div>
                      <div className="font-bold uppercase tracking-wide">Telegram</div>
                      <div className="text-gray-700">@graph_support</div>
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Быстро</div>
                  </div>
                  <div className="flex items-start justify-between gap-4 border border-black/20 p-3">
                    <div>
                      <div className="font-bold uppercase tracking-wide">Форма</div>
                      <div className="text-gray-700">Профиль → Обращение</div>
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">В кабинете</div>
                  </div>
                </div>

                <div className="border-t border-black/10 pt-4 text-xs text-gray-700 leading-relaxed">
                  Контакты сейчас демонстрационные — скажи, какие реальные email/соцсети поставить, и я заменю.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


