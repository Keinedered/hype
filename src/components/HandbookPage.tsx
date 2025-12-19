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

// Course-specific handbook content
const getCourseHandbookSections = (courseId?: string) => {
  if (!courseId) {
    // Default general handbook
    return [
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
        description: 'Что такое продукт и чем он отличается от проекта',
        content: [
          {
            id: '1',
            title: 'Определение продукта',
            text: 'Продукт — это средство решения проблемы пользователя, которое приносит ценность как пользователю, так и бизнесу. В отличие от проекта, продукт не имеет фиксированной даты завершения.'
          },
          {
            id: '2',
            title: 'Роль продакт-менеджера',
            text: 'Продакт-менеджер обеспечивает баланс между потребностями пользователей, целями бизнеса и техническими возможностями команды.'
          },
          {
            id: '3',
            title: 'Ключевые характеристики продукта',
            text: 'Продукт должен решать конкретную проблему пользователя, приносить измеримую ценность, иметь четкую целевую аудиторию и постоянно развиваться на основе обратной связи.'
          }
        ]
      },
      {
        id: 'product-strategy',
        title: 'Продуктовая стратегия',
        description: 'Формирование стратегии и видения продукта',
        content: [
          {
            id: '4',
            title: 'Видение продукта',
            text: 'Видение продукта описывает желаемое будущее состояние продукта и его влияние на пользователей. Хорошее видение должно быть вдохновляющим, конкретным и измеримым.'
          },
          {
            id: '5',
            title: 'Целевая аудитория',
            text: 'Определение целевой аудитории — ключевой этап в формировании стратегии. Необходимо четко понимать, кто ваши пользователи, какие проблемы они решают и какую ценность они получают от продукта.'
          }
        ]
      },
      {
        id: 'product-development',
        title: 'Разработка продукта',
        description: 'Процессы разработки и итерации',
        content: [
          {
            id: '6',
            title: 'MVP и итерации',
            text: 'Minimum Viable Product — это минимальная версия продукта, которая позволяет проверить гипотезы с минимальными затратами. После запуска MVP продукт развивается итеративно на основе обратной связи.'
          },
          {
            id: '7',
            title: 'Agile и Scrum',
            text: 'Agile-методологии позволяют быстро адаптироваться к изменениям и получать обратную связь от пользователей. Scrum — один из самых популярных фреймворков для управления разработкой.'
          }
        ]
      }
    ],
    'cjm-course': [
      {
        id: 'cjm-basics',
        title: 'Основы CJM',
        description: 'Что такое Customer Journey Map и зачем она нужна',
        content: [
          {
            id: '1',
            title: 'Определение CJM',
            text: 'Customer Journey Map визуализирует путь пользователя от первого контакта с продуктом до достижения цели. Это инструмент для понимания опыта пользователя на всех этапах взаимодействия.'
          },
          {
            id: '2',
            title: 'Точки касания',
            text: 'Важно определить все точки взаимодействия пользователя с продуктом и оценить качество опыта в каждой точке. Это помогает выявить проблемы и возможности для улучшения.'
          },
          {
            id: '3',
            title: 'Эмоциональная карта',
            text: 'CJM включает не только действия пользователя, но и его эмоции, мысли и боли на каждом этапе. Это позволяет создать более полную картину опыта.'
          }
        ]
      },
      {
        id: 'cjm-creation',
        title: 'Создание CJM',
        description: 'Пошаговый процесс построения карты пользовательского пути',
        content: [
          {
            id: '4',
            title: 'Исследование пользователей',
            text: 'Перед созданием CJM необходимо провести исследование: интервью, опросы, анализ данных. Это поможет понять реальное поведение пользователей.'
          },
          {
            id: '5',
            title: 'Определение этапов',
            text: 'Разбейте путь пользователя на логические этапы: осведомленность, рассмотрение, покупка, использование, поддержка. Каждый этап имеет свои особенности.'
          }
        ]
      }
    ],
    'event-basics': [
      {
        id: 'event-planning',
        title: 'Планирование мероприятий',
        description: 'Основы планирования и организации событий',
        content: [
          {
            id: '1',
            title: 'Цели мероприятия',
            text: 'Четкое определение целей — первый шаг к успешному мероприятию. Цели должны быть измеримыми и достижимыми. Используйте SMART-критерии для формулировки целей.'
          },
          {
            id: '2',
            title: 'Целевая аудитория',
            text: 'Понимание целевой аудитории помогает правильно выбрать формат, контент и каналы продвижения. Создайте портрет идеального участника мероприятия.'
          },
          {
            id: '3',
            title: 'Бюджет и ресурсы',
            text: 'Составьте детальный бюджет мероприятия, учитывая все статьи расходов: аренда, кейтеринг, техническое оборудование, маркетинг, персонал.'
          }
        ]
      },
      {
        id: 'event-execution',
        title: 'Проведение мероприятия',
        description: 'Организация и управление событием',
        content: [
          {
            id: '4',
            title: 'Таймлайн мероприятия',
            text: 'Создайте детальный таймлайн с указанием всех активностей, времени начала и окончания, ответственных лиц. Это поможет избежать накладок и задержек.'
          },
          {
            id: '5',
            title: 'Управление рисками',
            text: 'Заранее определите возможные риски и подготовьте план действий на случай непредвиденных ситуаций. Имейте запасной план для критических элементов.'
          }
        ]
      }
    ],
    'business-comm': [
      {
        id: 'business-writing',
        title: 'Деловая переписка',
        description: 'Правила и принципы деловой коммуникации',
        content: [
          {
            id: '1',
            title: 'Структура письма',
            text: 'Деловое письмо должно иметь четкую структуру: приветствие, основная часть, заключение и подпись. Используйте короткие абзацы и списки для лучшей читаемости.'
          },
          {
            id: '2',
            title: 'Тон и стиль',
            text: 'Тон деловой переписки должен быть профессиональным, вежливым и конкретным. Избегайте излишней формальности, но сохраняйте уважение к адресату.'
          },
          {
            id: '3',
            title: 'Эффективность коммуникации',
            text: 'Будьте конкретны и лаконичны. Указывайте четкие сроки, действия и ожидания. Используйте активный залог для большей ясности.'
          }
        ]
      },
      {
        id: 'email-etiquette',
        title: 'Этикет электронной переписки',
        description: 'Правила работы с email в деловой среде',
        content: [
          {
            id: '4',
            title: 'Тема письма',
            text: 'Тема письма должна быть информативной и отражать суть сообщения. Это помогает получателю быстро понять приоритет и содержание письма.'
          },
          {
            id: '5',
            title: 'Ответы и пересылки',
            text: 'Отвечайте на письма в течение 24 часов. При пересылке добавляйте краткий комментарий, объясняющий контекст для нового получателя.'
          }
        ]
      }
    ],
    'graphic-design': [
      {
        id: 'design-principles',
        title: 'Принципы дизайна',
        description: 'Фундаментальные принципы визуального дизайна',
        content: [
          {
            id: '1',
            title: 'Композиция',
            text: 'Правильная композиция помогает направить внимание зрителя на ключевые элементы. Используйте правило третей, баланс и иерархию для создания гармоничной композиции.'
          },
          {
            id: '2',
            title: 'Цвет и контраст',
            text: 'Цветовая палитра и контрастность влияют на восприятие и читаемость дизайна. Выбирайте цвета осознанно, учитывая психологию восприятия и доступность.'
          },
          {
            id: '3',
            title: 'Типографика',
            text: 'Типографика — это искусство оформления текста. Правильный выбор шрифтов, размеров и интервалов делает текст читаемым и визуально привлекательным.'
          }
        ]
      },
      {
        id: 'design-tools',
        title: 'Инструменты дизайна',
        description: 'Программное обеспечение и техники',
        content: [
          {
            id: '4',
            title: 'Векторная и растровая графика',
            text: 'Понимание разницы между векторной и растровой графикой важно для выбора правильного формата и инструментов. Векторы для логотипов и иконок, растры для фотографий.'
          },
          {
            id: '5',
            title: 'Работа с цветом',
            text: 'Изучите цветовые модели (RGB, CMYK, Pantone) и их применение. Используйте цветовые палитры для создания согласованного визуального стиля.'
          }
        ]
      }
    ],
    'product-design': [
      {
        id: 'ux-basics',
        title: 'Основы UX дизайна',
        description: 'Принципы проектирования пользовательского опыта',
        content: [
          {
            id: '1',
            title: 'Исследования пользователей',
            text: 'Понимание потребностей пользователей — основа хорошего UX дизайна. Проводите интервью, опросы и наблюдения, чтобы понять реальные потребности и боли пользователей.'
          },
          {
            id: '2',
            title: 'Прототипирование',
            text: 'Прототипы помогают проверить идеи до начала разработки. Начните с низкоуровневых прототипов (wireframes) и постепенно переходите к высокоуровневым интерактивным прототипам.'
          },
          {
            id: '3',
            title: 'Юзабилити-тестирование',
            text: 'Тестируйте прототипы с реальными пользователями. Наблюдайте за их поведением, задавайте вопросы и собирайте обратную связь для улучшения дизайна.'
          }
        ]
      },
      {
        id: 'ui-design',
        title: 'UI дизайн интерфейсов',
        description: 'Визуальное оформление интерфейсов',
        content: [
          {
            id: '4',
            title: 'Визуальная иерархия',
            text: 'Создавайте четкую визуальную иерархию, используя размер, цвет, контраст и расположение элементов. Это помогает пользователям быстро находить нужную информацию.'
          },
          {
            id: '5',
            title: 'Дизайн-системы',
            text: 'Используйте дизайн-системы для создания согласованных интерфейсов. Компоненты, стили и паттерны должны быть переиспользуемыми и документированными.'
          }
        ]
      }
    ],
    'prototyping': [
      {
        id: 'prototyping-tools',
        title: 'Инструменты прототипирования',
        description: 'Современные инструменты для создания прототипов',
        content: [
          {
            id: '1',
            title: 'Figma для прототипирования',
            text: 'Figma позволяет создавать интерактивные прототипы с переходами между экранами. Используйте компоненты и варианты для быстрого создания прототипов.'
          },
          {
            id: '2',
            title: 'Тестирование прототипов',
            text: 'Тестируйте прототипы с пользователями на ранних этапах. Это помогает выявить проблемы до начала разработки и сэкономить ресурсы.'
          }
        ]
      }
    ],
    'event-offline': [
      {
        id: 'offline-organization',
        title: 'Организация офлайн-мероприятий',
        description: 'Особенности проведения офлайн-событий',
        content: [
          {
            id: '1',
            title: 'Выбор площадки',
            text: 'Выбор правильной площадки критически важен для успеха мероприятия. Учитывайте расположение, вместимость, техническое оснащение и доступность.'
          },
          {
            id: '2',
            title: 'Логистика',
            text: 'Планируйте логистику заранее: транспорт для участников, размещение, питание, техническое оборудование. Создайте детальный план и назначьте ответственных.'
          }
        ]
      }
    ],
    'event-online': [
      {
        id: 'online-platforms',
        title: 'Платформы для онлайн-мероприятий',
        description: 'Выбор и использование платформ для виртуальных событий',
        content: [
          {
            id: '1',
            title: 'Выбор платформы',
            text: 'Выбирайте платформу в зависимости от формата мероприятия: Zoom для вебинаров, Gather для интерактивных пространств, StreamYard для стримов.'
          },
          {
            id: '2',
            title: 'Техническая подготовка',
            text: 'Обеспечьте стабильное интернет-соединение, качественное освещение и звук. Проведите тестовые подключения заранее.'
          }
        ]
      }
    ],
    'product-metrics': [
      {
        id: 'metrics-basics',
        title: 'Основы метрик продукта',
        description: 'Ключевые метрики и их измерение',
        content: [
          {
            id: '1',
            title: 'North Star Metric',
            text: 'North Star Metric — это метрика, которая лучше всего отражает ценность, которую продукт приносит пользователям. Она должна быть связана с долгосрочным успехом продукта.'
          },
          {
            id: '2',
            title: 'Воронка конверсии',
            text: 'Анализ воронки помогает понять, на каком этапе пользователи теряются. Это позволяет сфокусировать усилия на самых проблемных точках.'
          }
        ]
      }
    ],
    'user-research': [
      {
        id: 'research-methods',
        title: 'Методы исследований',
        description: 'Качественные и количественные методы изучения пользователей',
        content: [
          {
            id: '1',
            title: 'Интервью с пользователями',
            text: 'Интервью — один из самых эффективных методов качественного исследования. Позволяет глубоко понять мотивацию пользователей, их боли и потребности.'
          },
          {
            id: '2',
            title: 'Анализ данных',
            text: 'Количественные данные помогают понять масштаб проблем и проверить гипотезы. Используйте аналитику, A/B тесты и опросы.'
          }
        ]
      }
    ],
    'presentation-skills': [
      {
        id: 'presentation-structure',
        title: 'Структура презентации',
        description: 'Как создать эффективную презентацию',
        content: [
          {
            id: '1',
            title: 'Структура выступления',
            text: 'Используйте классическую структуру: введение, основная часть, заключение. Начинайте с проблемы, затем предлагайте решение, заканчивайте призывом к действию.'
          },
          {
            id: '2',
            title: 'Визуализация данных',
            text: 'Используйте графики, диаграммы и инфографику для визуализации данных. Избегайте перегруженных слайдов, один слайд — одна идея.'
          }
        ]
      }
    ],
    'ui-fundamentals': [
      {
        id: 'ui-principles',
        title: 'Принципы UI дизайна',
        description: 'Фундаментальные принципы проектирования интерфейсов',
        content: [
          {
            id: '1',
            title: 'Композиция интерфейса',
            text: 'Правильная композиция помогает пользователям быстро находить нужную информацию. Используйте сетки, выравнивание и группировку элементов.'
          },
          {
            id: '2',
            title: 'Интерактивность',
            text: 'Элементы интерфейса должны четко показывать свое состояние: обычное, наведение, активное, отключенное. Это улучшает пользовательский опыт.'
          }
        ]
      }
    ],
    'external-comm': [
      {
        id: 'external-communications',
        title: 'Внешние коммуникации',
        description: 'Построение системы внешних коммуникаций компании',
        content: [
          {
            id: '1',
            title: 'PR стратегия',
            text: 'Разработайте комплексную PR стратегию, которая включает работу со СМИ, социальными сетями и общественностью. Определите ключевые сообщения и каналы коммуникации.'
          },
          {
            id: '2',
            title: 'Кризисные коммуникации',
            text: 'Подготовьте план действий на случай кризисных ситуаций. Определите спикеров, подготовьте шаблоны сообщений и протоколы реагирования.'
          }
        ]
      }
    ],
    'product-launch': [
      {
        id: 'launch-strategy',
        title: 'Стратегия запуска',
        description: 'Go-to-Market стратегия и запуск продукта',
        content: [
          {
            id: '1',
            title: 'Go-to-Market план',
            text: 'Разработайте детальный план выхода на рынок: позиционирование, целевая аудитория, каналы продвижения, план запуска и метрики успеха.'
          },
          {
            id: '2',
            title: 'Масштабирование',
            text: 'После успешного запуска MVP планируйте масштабирование: расширение функциональности, выход на новые рынки, оптимизация процессов.'
          }
        ]
      }
    ],
    'event-budget': [
      {
        id: 'budget-planning',
        title: 'Бюджетирование мероприятий',
        description: 'Финансовое планирование и контроль бюджета',
        content: [
          {
            id: '1',
            title: 'Составление бюджета',
            text: 'Создайте детальный бюджет, включающий все статьи расходов: аренда, кейтеринг, техническое оборудование, маркетинг, персонал, непредвиденные расходы.'
          },
          {
            id: '2',
            title: 'Контроль бюджета',
            text: 'Регулярно отслеживайте расходы и сравнивайте с планом. Ведите учет всех платежей и договоров. Имейте резерв на непредвиденные расходы.'
          }
        ]
      }
    ],
    'crisis-comm': [
      {
        id: 'crisis-management',
        title: 'Управление кризисными коммуникациями',
        description: 'Стратегии и инструменты кризисного PR',
        content: [
          {
            id: '1',
            title: 'План кризисных коммуникаций',
            text: 'Разработайте детальный план действий на случай кризиса: определение кризисной команды, протоколы реагирования, шаблоны сообщений, каналы коммуникации.'
          },
          {
            id: '2',
            title: 'Мониторинг репутации',
            text: 'Отслеживайте упоминания компании в медиа и социальных сетях. Используйте инструменты мониторинга для раннего обнаружения потенциальных проблем.'
          }
        ]
      }
    ],
    'media-relations': [
      {
        id: 'media-work',
        title: 'Работа со СМИ',
        description: 'Построение отношений с медиа и работа с журналистами',
        content: [
          {
            id: '1',
            title: 'Построение отношений',
            text: 'Регулярно взаимодействуйте с журналистами, предоставляйте актуальную информацию, будьте доступны для комментариев. Стройте долгосрочные отношения.'
          },
          {
            id: '2',
            title: 'Пресс-релизы и медиа-киты',
            text: 'Создавайте качественные пресс-релизы с новой информацией. Подготовьте медиа-кит с базовой информацией о компании, фотографиями и контактами.'
          }
        ]
      }
    ],
    'design-systems': [
      {
        id: 'design-system-creation',
        title: 'Создание дизайн-систем',
        description: 'Разработка и поддержка дизайн-систем для продуктов',
        content: [
          {
            id: '1',
            title: 'Компоненты и стили',
            text: 'Создайте библиотеку переиспользуемых компонентов с четкими правилами использования. Определите цветовую палитру, типографику и spacing.'
          },
          {
            id: '2',
            title: 'Документация',
            text: 'Документируйте все компоненты, их варианты и правила использования. Это помогает команде работать эффективно и поддерживать консистентность.'
          }
        ]
      }
    ]
  };

  return courseHandbooks[courseId] || [
    {
      id: 'general',
      title: 'Общие материалы',
      description: 'Материалы по теме курса',
      content: [
        {
          id: '1',
          title: 'Введение',
          text: 'Материалы для этого курса находятся в разработке.'
        }
      ]
    }
  ];
};

// Course-specific templates and checklists
const getCourseTemplates = (courseId?: string) => {
  const templates: Record<string, any[]> = {
    'product-intro': [
      { id: '1', title: 'Шаблон User Story', description: 'Готовая структура для описания пользовательских историй' },
      { id: '2', title: 'Чек-лист запуска MVP', description: 'Пошаговый список задач для подготовки к запуску' },
      { id: '3', title: 'Шаблон продуктовой стратегии', description: 'Структура для формулирования видения и стратегии продукта' },
      { id: '4', title: 'Метрики продукта', description: 'Список ключевых метрик для отслеживания' }
    ],
    'product-metrics': [
      { id: '1', title: 'Шаблон дашборда метрик', description: 'Структура для создания дашборда с ключевыми метриками' },
      { id: '2', title: 'Чек-лист анализа метрик', description: 'Список вопросов для анализа данных продукта' }
    ],
    'product-launch': [
      { id: '1', title: 'Шаблон Go-to-Market плана', description: 'Структура для разработки стратегии выхода на рынок' },
      { id: '2', title: 'Чек-лист запуска продукта', description: 'Пошаговый список задач перед запуском' }
    ],
    'user-research': [
      { id: '1', title: 'Шаблон интервью', description: 'Структура вопросов для интервью с пользователями' },
      { id: '2', title: 'Чек-лист исследования', description: 'Список задач для проведения исследования' }
    ],
    'event-basics': [
      { id: '1', title: 'Чек-лист планирования мероприятия', description: 'Пошаговый список задач для организации события' },
      { id: '2', title: 'Шаблон бюджета мероприятия', description: 'Структура для расчета и контроля бюджета' }
    ],
    'event-offline': [
      { id: '1', title: 'Чек-лист выбора площадки', description: 'Критерии для выбора места проведения мероприятия' },
      { id: '2', title: 'Шаблон таймлайна', description: 'Структура для планирования времени мероприятия' }
    ],
    'event-online': [
      { id: '1', title: 'Чек-лист технической подготовки', description: 'Список технических требований для онлайн-мероприятия' },
      { id: '2', title: 'Шаблон сценария онлайн-мероприятия', description: 'Структура для планирования виртуального события' }
    ],
    'event-budget': [
      { id: '1', title: 'Шаблон бюджета', description: 'Детальная структура для расчета бюджета мероприятия' },
      { id: '2', title: 'Чек-лист контроля расходов', description: 'Список для отслеживания фактических расходов' }
    ],
    'business-comm': [
      { id: '1', title: 'Шаблон делового письма', description: 'Структура для написания эффективных деловых писем' },
      { id: '2', title: 'Чек-лист проверки письма', description: 'Список для проверки качества перед отправкой' }
    ],
    'external-comm': [
      { id: '1', title: 'Шаблон PR стратегии', description: 'Структура для разработки стратегии внешних коммуникаций' },
      { id: '2', title: 'Чек-лист работы со СМИ', description: 'Список задач для эффективной работы с медиа' }
    ],
    'presentation-skills': [
      { id: '1', title: 'Шаблон структуры презентации', description: 'Структура для создания эффективной презентации' },
      { id: '2', title: 'Чек-лист подготовки к выступлению', description: 'Список задач перед публичным выступлением' }
    ],
    'crisis-comm': [
      { id: '1', title: 'Шаблон плана кризисных коммуникаций', description: 'Структура для разработки плана действий в кризисе' },
      { id: '2', title: 'Чек-лист реагирования на кризис', description: 'Пошаговый список действий при кризисной ситуации' }
    ],
    'media-relations': [
      { id: '1', title: 'Шаблон пресс-релиза', description: 'Структура для написания пресс-релизов' },
      { id: '2', title: 'Шаблон медиа-кита', description: 'Структура для создания медиа-кита компании' }
    ],
    'graphic-design': [
      { id: '1', title: 'Шаблон брендбука', description: 'Структура для создания руководства по стилю' },
      { id: '2', title: 'Чек-лист дизайн-проекта', description: 'Список задач для завершения дизайн-проекта' }
    ],
    'ui-fundamentals': [
      { id: '1', title: 'Шаблон UI компонента', description: 'Структура для описания UI компонента' },
      { id: '2', title: 'Чек-лист проверки интерфейса', description: 'Список критериев для оценки качества интерфейса' }
    ],
    'product-design': [
      { id: '1', title: 'Шаблон User Flow', description: 'Структура для описания пользовательских сценариев' },
      { id: '2', title: 'Чек-лист юзабилити-тестирования', description: 'Список задач для проведения тестирования' }
    ],
    'prototyping': [
      { id: '1', title: 'Шаблон прототипа', description: 'Структура для создания интерактивного прототипа' },
      { id: '2', title: 'Чек-лист тестирования прототипа', description: 'Список задач для тестирования прототипа' }
    ],
    'design-systems': [
      { id: '1', title: 'Шаблон дизайн-системы', description: 'Структура компонентов и стилей' },
      { id: '2', title: 'Чек-лист создания компонента', description: 'Список задач для добавления нового компонента в систему' }
    ],
    'cjm-course': [
      { id: '1', title: 'Шаблон CJM', description: 'Структура для построения карты пользовательского пути' },
      { id: '2', title: 'Чек-лист исследования пользователей', description: 'Список вопросов для интервью и опросов' },
      { id: '3', title: 'Шаблон Persona', description: 'Структура для создания портрета пользователя' }
    ]
  };

  return templates[courseId || ''] || [
    { id: '1', title: 'Шаблон User Story', description: 'Готовая структура для описания пользовательских историй' },
    { id: '2', title: 'Чек-лист запуска MVP', description: 'Пошаговый список задач для подготовки к запуску' },
    { id: '3', title: 'Шаблон CJM', description: 'Структура для построения карты пользовательского пути' },
    { id: '4', title: 'Метрики продукта', description: 'Список ключевых метрик для отслеживания' }
  ];
};

export function HandbookPage({ onBack, courseId }: HandbookPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCourse = courseId ? courses.find(c => c.id === courseId) : null;
  const selectedTrack = selectedCourse ? tracks.find(t => t.id === selectedCourse.trackId) : null;

  // Get course-specific handbook sections
  const handbookSections = getCourseHandbookSections(courseId);
  const templates = getCourseTemplates(courseId);

  const handleDownloadPDF = () => {
    // Create a simple PDF download (in a real app, this would generate a PDF from the content)
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
                  {selectedCourse 
                    ? `Хендбук содержит дополнительные материалы, шаблоны и чек-листы по курсу "${selectedCourse.title}". Используйте его как справочник во время обучения и в практической работе.`
                    : 'Хендбук содержит дополнительные материалы, шаблоны и чек-листы по темам курса. Используйте его как справочник во время обучения и в практической работе. Материалы регулярно обновляются на основе обратной связи студентов и изменений в индустрии.'
                  }
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
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className="p-6 border-2 border-black bg-white hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer"
                  onClick={() => {
                    // In a real app, this would open/download the template
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

