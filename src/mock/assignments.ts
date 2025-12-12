import { Assignment } from '../types/Assignment';

export const assignments: Assignment[] = [
  {
    id: 1,
    lessonId: 1,
    title: 'Анализ рынка ивентов',
    description: 'Проведите анализ рынка ивентов в вашем регионе. Опишите основных игроков, тренды и возможности.',
    criteria: 'Оценка по глубине анализа, структурированности и практической применимости',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: false,
    allowedFileTypes: ['pdf', 'docx']
  },
  {
    id: 2,
    lessonId: 2,
    title: 'Состав команды',
    description: 'Опишите идеальную команду для организации мероприятия на 500 человек.',
    acceptsText: true,
    acceptsFile: false,
    acceptsLink: false
  },
  {
    id: 3,
    lessonId: 3,
    title: 'Постановка целей',
    description: 'Определите цели для гипотетического корпоративного мероприятия.',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: false,
    allowedFileTypes: ['pdf', 'docx', 'pptx']
  },
  {
    id: 4,
    lessonId: 4,
    title: 'Бюджет мероприятия',
    description: 'Составьте примерный бюджет для мероприятия на 200 человек.',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: false,
    allowedFileTypes: ['xlsx', 'pdf']
  },
  {
    id: 5,
    lessonId: 5,
    title: 'План логистики',
    description: 'Разработайте план логистики для мероприятия.',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: true,
    allowedFileTypes: ['pdf', 'docx']
  },
  {
    id: 6,
    lessonId: 6,
    title: 'Отчет о мероприятии',
    description: 'Создайте шаблон отчета об эффективности мероприятия.',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: false,
    allowedFileTypes: ['pdf', 'docx', 'xlsx']
  },
  {
    id: 7,
    lessonId: 7,
    title: 'Определение продукта',
    description: 'Опишите продукт, который вы используете ежедневно, с точки зрения решения проблемы пользователя.',
    acceptsText: true,
    acceptsFile: false,
    acceptsLink: false
  },
  {
    id: 8,
    lessonId: 8,
    title: 'Роль PM',
    description: 'Изучите вакансии продуктовых менеджеров и опишите ключевые требования.',
    acceptsText: true,
    acceptsFile: false,
    acceptsLink: true
  },
  {
    id: 9,
    lessonId: 9,
    title: 'Интервью с пользователем',
    description: 'Проведите интервью с пользователем продукта и задокументируйте результаты.',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: false,
    allowedFileTypes: ['pdf', 'docx']
  },
  {
    id: 10,
    lessonId: 10,
    title: 'Анализ конкурентов',
    description: 'Проведите анализ 3-5 конкурентов выбранного продукта.',
    acceptsText: true,
    acceptsFile: true,
    acceptsLink: true,
    allowedFileTypes: ['pdf', 'docx', 'pptx']
  }
];
