export interface Handbook {
  id: number;
  trackId?: number; // Привязка к треку
  courseId?: number; // Привязка к курсу
  title: string;
  sections: HandbookSection[];
}

export interface HandbookSection {
  id: number;
  handbookId: number;
  title: string;
  content: string; // HTML/Markdown контент
  order: number; // Порядок раздела
  anchor?: string; // Якорь для глубоких ссылок
  parentSectionId?: number; // ID родительского раздела (для вложенности)
}