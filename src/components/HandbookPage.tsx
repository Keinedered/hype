import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Download, FileText, Search } from 'lucide-react';
import { coursesAPI, tracksAPI } from '../api/client';
import { normalizeCourse, normalizeTrack, RawCourse, RawTrack } from '../api/normalizers';
import { Course, Track } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface HandbookPageProps {
  onBack?: () => void;
  courseId?: string;
}

const getCourseHandbookSections = (courseId?: string) => {
  if (!courseId) {
    return [
      {
        id: 'product-strategy',
        title: 'Продуктовая стратегия',
        description: 'Базовые принципы стратегии продукта: цель, метрики, ценность.',
        content: [
          {
            id: '1',
            title: 'Что такое продуктовая стратегия',
            text: 'Стратегия описывает, какую ценность продукт создаёт, для кого и как команда измеряет успех.'
          },
          {
            id: '2',
            title: 'Видение продукта',
            text: 'Видение задаёт направление и помогает принимать решения, которые согласованы с долгосрочной целью.'
          }
        ]
      },
      {
        id: 'research-basics',
        title: 'Исследования пользователей',
        description: 'Как понимать потребности и принимать решения на основе данных.',
        content: [
          {
            id: '1',
            title: 'Интервью и наблюдения',
            text: 'Качественные исследования помогают увидеть реальные задачи и контекст пользователей.'
          },
          {
            id: '2',
            title: 'Сегментация аудитории',
            text: 'Разделяйте аудиторию на группы с похожими целями — так проще проектировать решения.'
          }
        ]
      }
    ];
  }

  const courseHandbooks: Record<string, any[]> = {
    'product-intro': [
      {
        id: 'product-basics',
        title: 'Основы продукта',
        description: 'Термины и базовые принципы работы с продуктом.',
        content: [
          {
            id: '1',
            title: 'Определение продукта',
            text: 'Продукт решает задачу пользователя и приносит ценность бизнесу.'
          },
          {
            id: '2',
            title: 'Роль продакт-менеджера',
            text: 'Продакт балансирует пользовательскую ценность, бизнес-цели и технические ограничения.'
          }
        ]
      }
    ],
    'event-basics': [
      {
        id: 'event-planning',
        title: 'Планирование мероприятий',
        description: 'Как ставить цели, собирать команду и управлять рисками.',
        content: [
          {
            id: '1',
            title: 'Цели мероприятия',
            text: 'Чётко сформулируйте измеримые цели, чтобы выстроить программу и коммуникации.'
          },
          {
            id: '2',
            title: 'Управление рисками',
            text: 'Заранее продумайте риски и план действий на случай непредвиденных ситуаций.'
          }
        ]
      }
    ],
    'graphic-design': [
      {
        id: 'design-principles',
        title: 'Принципы дизайна',
        description: 'Композиция, типографика и работа с цветом.',
        content: [
          {
            id: '1',
            title: 'Композиция',
            text: 'Баланс, иерархия и ритм помогают направлять внимание пользователя.'
          },
          {
            id: '2',
            title: 'Типографика',
            text: 'Подбирайте шрифты и размеры так, чтобы текст было легко читать.'
          }
        ]
      }
    ]
  };

  return courseHandbooks[courseId] || [
    {
      id: 'general-guides',
      title: 'Общие материалы',
      description: 'База знаний по выбранному курсу пока пополняется.',
      content: [
        {
          id: '1',
          title: 'Скоро здесь будут материалы',
          text: 'Мы добавляем хендбук и шаблоны по мере обновления программы.'
        }
      ]
    }
  ];
};

const getCourseTemplates = (courseId?: string) => {
  const templates: Record<string, any[]> = {
    'product-intro': [
      { id: '1', title: 'Шаблон User Story', description: 'Структура для описания пользовательских историй.' },
      { id: '2', title: 'Чек-лист MVP', description: 'Список задач перед запуском MVP.' }
    ],
    'event-basics': [
      { id: '1', title: 'Чек-лист планирования', description: 'Пошаговый список подготовки мероприятия.' },
      { id: '2', title: 'Шаблон бюджета', description: 'Структура для расчёта бюджета.' }
    ],
    'graphic-design': [
      { id: '1', title: 'Шаблон брендбука', description: 'Структура для описания визуального стиля.' },
      { id: '2', title: 'Чек-лист дизайна', description: 'Критерии для проверки качества макета.' }
    ]
  };

  return templates[courseId || ''] || [
    { id: '1', title: 'Шаблон User Story', description: 'Готовая структура для описания пользовательских историй.' },
    { id: '2', title: 'Чек-лист запуска MVP', description: 'Пошаговый список задач перед запуском.' },
    { id: '3', title: 'Шаблон CJM', description: 'Структура для построения карты пути пользователя.' }
  ];
};

export function HandbookPage({ onBack, courseId }: HandbookPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!courseId) {
        if (isMounted) {
          setSelectedCourse(null);
          setSelectedTrack(null);
        }
        return;
      }

      try {
        const rawCourse = (await coursesAPI.getById(courseId)) as RawCourse;
        const course = normalizeCourse(rawCourse);
        const rawTrack = (await tracksAPI.getById(course.trackId)) as RawTrack;
        const track = normalizeTrack(rawTrack);

        if (!isMounted) return;
        setSelectedCourse(course);
        setSelectedTrack(track);
      } catch {
        if (!isMounted) return;
        setSelectedCourse(null);
        setSelectedTrack(null);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handbookSections = getCourseHandbookSections(courseId);
  const templates = getCourseTemplates(courseId);

  const handleDownloadPDF = () => {
    const content = handbookSections.map(section => 
      `${section.title}\n${section.description}\n\n${section.content.map(item => `${item.title}\n${item.text}`).join('\n\n')}`
    ).join('\n\n---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedCourse ? `handbook-${selectedCourse.id}.txt` : 'handbook.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
              onClick={handleDownloadPDF}
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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-5 sm:h-5 text-gray-400 shrink-0" aria-hidden />
            <Input
              type="text"
              placeholder="Поиск по хендбуку..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 sm:pl-12 rounded-none border-2 border-black focus:border-black focus:ring-0 h-12 sm:h-14 font-mono"
            />
          </div>

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
                  {selectedCourse 
                    ? `Хендбук содержит дополнительные материалы, шаблоны и чек-листы по курсу "${selectedCourse.title}". Используйте его как справочник во время обучения и в практической работе.`
                    : 'Хендбук содержит дополнительные материалы, шаблоны и чек-листы по темам курса. Используйте его как справочник во время обучения и в практической работе. Материалы регулярно обновляются на основе обратной связи студентов и изменений в индустрии.'
                  }
                </p>
              </div>
            </div>
          </Card>

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

          <div className="space-y-6 mt-12">
            <div className="bg-black text-white px-4 py-2 inline-block font-mono tracking-wide">
              <h2 className="mb-0">ШАБЛОНЫ И ЧЕК-ЛИСТЫ</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer"
                  onClick={() => {
                    const content = `# ${template.title}\n\n${template.description}\n\n[Содержимое шаблона будет здесь]`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${template.title.toLowerCase().replace(/\s+/g, '-')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-black text-white shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-mono font-bold tracking-wide">{template.title}</h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
