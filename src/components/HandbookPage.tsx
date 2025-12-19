import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ArrowLeft, BookOpen, Search, FileText, Download } from 'lucide-react';
import { Input } from './ui/input';
import { courses, tracks } from '../data/mockData';

interface HandbookPageProps {
  onBack?: () => void;
  courseId?: string;
}

export function HandbookPage({ onBack, courseId }: HandbookPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCourse = courseId ? courses.find(c => c.id === courseId) : null;
  const selectedTrack = selectedCourse ? tracks.find(t => t.id === selectedCourse.trackId) : null;

  // Mock handbook sections
  const handbookSections = [
    {
      id: 'product-strategy',
      title: 'Продуктовая стратегия',
      description: 'Основы формирования стратегии продукта, видение и миссия',
      content: [
        {
          id: '1',
          title: 'Что такое продуктовая стратегия',
          text: 'Продуктовая стратегия — это долгосрочный план развития продукта, который определяет, как продукт будет создавать ценность для пользователей и бизнеса. Она включает в себя видение продукта, целевые метрики и план достижения целей.'
        },
        {
          id: '2',
          title: 'Видение продукта',
          text: 'Видение продукта описывает желаемое будущее состояние продукта и его влияние на пользователей. Хорошее видение должно быть вдохновляющим, конкретным и измеримым.'
        },
        {
          id: '3',
          title: 'Целевая аудитория',
          text: 'Определение целевой аудитории — ключевой этап в формировании стратегии. Необходимо четко понимать, кто ваши пользователи, какие проблемы они решают и какую ценность они получают от продукта.'
        }
      ]
    },
    {
      id: 'user-research',
      title: 'Пользовательские исследования',
      description: 'Методы изучения потребностей пользователей и их поведения',
      content: [
        {
          id: '4',
          title: 'Интервью с пользователями',
          text: 'Интервью — один из самых эффективных методов качественного исследования. Позволяет глубоко понять мотивацию пользователей, их боли и потребности. Важно задавать открытые вопросы и избегать наводящих формулировок.'
        },
        {
          id: '5',
          title: 'Анализ данных',
          text: 'Количественные данные помогают понять масштаб проблем и проверить гипотезы. Используйте аналитику, A/B тесты и опросы для получения объективной картины.'
        },
        {
          id: '6',
          title: 'Customer Journey Map',
          text: 'CJM визуализирует путь пользователя от первого контакта с продуктом до достижения цели. Помогает выявить точки трения и возможности для улучшения опыта.'
        }
      ]
    },
    {
      id: 'metrics',
      title: 'Метрики и аналитика',
      description: 'Ключевые метрики продукта и способы их измерения',
      content: [
        {
          id: '7',
          title: 'North Star Metric',
          text: 'North Star Metric — это метрика, которая лучше всего отражает ценность, которую продукт приносит пользователям. Она должна быть связана с долгосрочным успехом продукта и бизнеса.'
        },
        {
          id: '8',
          title: 'Воронка конверсии',
          text: 'Анализ воронки помогает понять, на каком этапе пользователи теряются. Это позволяет сфокусировать усилия на самых проблемных точках и улучшить общую конверсию.'
        },
        {
          id: '9',
          title: 'Когортный анализ',
          text: 'Когортный анализ позволяет отслеживать поведение групп пользователей, присоединившихся в одно время. Помогает понять долгосрочные тренды и влияние изменений продукта.'
        }
      ]
    },
    {
      id: 'development',
      title: 'Разработка и запуск',
      description: 'Процессы разработки продукта и его запуска на рынок',
      content: [
        {
          id: '10',
          title: 'Agile и Scrum',
          text: 'Agile-методологии позволяют быстро адаптироваться к изменениям и получать обратную связь от пользователей. Scrum — один из самых популярных фреймворков для управления разработкой.'
        },
        {
          id: '11',
          title: 'MVP и итерации',
          text: 'Minimum Viable Product — это минимальная версия продукта, которая позволяет проверить гипотезы с минимальными затратами. После запуска MVP продукт развивается итеративно на основе обратной связи.'
        },
        {
          id: '12',
          title: 'Go-to-Market стратегия',
          text: 'Стратегия выхода на рынок определяет, как продукт будет представлен пользователям. Включает в себя позиционирование, каналы продвижения и план запуска.'
        }
      ]
    }
  ];

  const filteredSections = handbookSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.some(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b-2 border-black bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                НАЗАД
              </Button>
              
              <div className="h-6 w-px bg-black/20"></div>

              <div className="relative inline-block">
                <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
                  <h1 className="mb-0">ХЕНДБУК</h1>
                </div>
                <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
                <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
              </div>

              {selectedCourse && (
                <>
                  <div className="h-6 w-px bg-black/20"></div>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 text-xs font-mono tracking-widest uppercase border border-black rounded-full"
                      style={{ backgroundColor: selectedTrack?.color }}
                    >
                      {selectedTrack?.name.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm">{selectedCourse.title}</span>
                  </div>
                </>
              )}
            </div>

            <Button 
              variant="outline"
              className="border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
            >
              <Download className="w-4 h-4 mr-2" />
              СКАЧАТЬ PDF
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по хендбуку..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-none border-2 border-black focus:border-black focus:ring-0 h-14 font-mono"
            />
          </div>

          {/* Introduction */}
          <Card className="p-8 border-2 border-black bg-white">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-black text-white shrink-0">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <div className="bg-black text-white px-3 py-1 inline-block font-mono text-sm tracking-wide">
                  О ХЕНДБУКЕ
                </div>
                <p className="font-mono leading-relaxed text-gray-700">
                  Хендбук содержит дополнительные материалы, шаблоны и чек-листы по темам курса. 
                  Используйте его как справочник во время обучения и в практической работе. 
                  Материалы регулярно обновляются на основе обратной связи студентов и изменений в индустрии.
                </p>
              </div>
            </div>
          </Card>

          {/* Sections */}
          <div className="space-y-6">
            <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
              <h2 className="mb-0">СОДЕРЖАНИЕ</h2>
            </div>

            <Accordion type="multiple" className="space-y-4">
              {filteredSections.map((section, index) => (
                <AccordionItem 
                  key={section.id} 
                  value={section.id}
                  className="border-2 border-black bg-white"
                >
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex items-start gap-4 text-left flex-1">
                      <div className="w-10 h-10 border-2 border-black flex items-center justify-center font-mono font-bold shrink-0 bg-white">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-mono tracking-wide mb-2 text-lg">{section.title.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground font-mono leading-relaxed">
                          {section.description}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-6 space-y-6 border-t-2 border-black pt-6">
                      {section.content.map((item) => (
                        <div key={item.id} className="space-y-3">
                          <h4 className="font-mono font-bold text-base tracking-wide uppercase">
                            {item.title}
                          </h4>
                          <p className="font-mono text-sm leading-relaxed text-gray-700">
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredSections.length === 0 && (
              <div className="border-2 border-black bg-white p-8 text-center">
                <p className="font-mono text-gray-500">
                  По запросу "{searchQuery}" ничего не найдено
                </p>
              </div>
            )}
          </div>

          {/* Templates Section */}
          <div className="space-y-6 mt-12">
            <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
              <h2 className="mb-0">ШАБЛОНЫ И ЧЕК-ЛИСТЫ</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-black text-white shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold tracking-wide">Шаблон User Story</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      Готовая структура для описания пользовательских историй
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-black text-white shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold tracking-wide">Чек-лист запуска MVP</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      Пошаговый список задач для подготовки к запуску
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-black text-white shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold tracking-wide">Шаблон CJM</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      Структура для построения карты пользовательского пути
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-black text-white shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-mono font-bold tracking-wide">Метрики продукта</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      Список ключевых метрик для отслеживания
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

