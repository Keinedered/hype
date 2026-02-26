import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { KnowledgeGraph } from './KnowledgeGraph';
import { graphNodes, graphEdges, modules } from '../data/mockData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { BookOpen, Bell } from 'lucide-react';

interface KnowledgeGraphPageProps {
  onNodeClick?: (nodeId: string) => void;
  onOpenHandbook?: () => void;
}

export function KnowledgeGraphPage({ onNodeClick, onOpenHandbook }: KnowledgeGraphPageProps) {
  const [viewFilter, setViewFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8 relative inline-block">
          <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wider">
            <h1 className="mb-0">МОЙ ПУТЬ / КАРТА ЗНАНИЙ</h1>
          </div>
          <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-black" />
          <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-black" />
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 min-h-[calc(100vh-12rem)] pb-20">
          {/* Left panel */}
          <div className="space-y-6 overflow-y-auto">
            {/* Course card */}
            <Card 
              className="p-6 space-y-5 border-2 border-black bg-white relative"
            >
              {/* Removed decorative corner per request */}
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="bg-black text-white px-3 py-1 inline-block mb-2 font-mono text-xs tracking-wide">
                    КУРС
                  </div>
                  <h3 className="font-mono tracking-wide mb-1">
                    ВВЕДЕНИЕ В ПРОДУКТОВЫЙ МЕНЕДЖМЕНТ
                  </h3>
                  <span className="text-sm text-muted-foreground font-mono">v1.0</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="border-2 border-black hover:bg-black hover:text-white"
                >
                  <Bell className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3 bg-white border-2 border-black p-4">
                <div className="flex justify-between font-mono text-sm">
                  <span>ПРОГРЕСС ПО КУРСУ</span>
                  <span className="font-bold">35%</span>
                </div>
                <div className="relative h-2 bg-white border border-black">
                  <div 
                    className="absolute top-0 left-0 h-full transition-all"
                    style={{ 
                      backgroundColor: '#000000',
                      width: '35%'
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t-2 border-black pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onOpenHandbook}
                  className="flex-1 border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  ХЕНДБУК
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-2 border-black hover:bg-black hover:text-white font-mono tracking-wide"
                >
                  О КУРСЕ
                </Button>
              </div>
            </Card>

            {/* Modules list */}
            <Card className="p-6 border-2 border-black bg-white">
              <div className="bg-black text-white px-3 py-1 inline-block mb-4 font-mono text-sm tracking-wide">
                СПИСОК МОДУЛЕЙ
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {modules.map((module, index) => (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className="border-2 border-black bg-white"
                  >
                    <AccordionTrigger className="hover:no-underline px-4 py-3">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center font-mono font-bold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm font-mono tracking-wide">{module.title.toUpperCase()}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-4 pb-3 space-y-3 border-t-2 border-black pt-3">
                        {module.progress !== undefined && (
                          <div className="flex items-center gap-3">
                            <div className="relative h-2 flex-1 bg-white border border-black">
                              <div 
                                className="absolute top-0 left-0 h-full transition-all"
                                style={{ 
                                  backgroundColor: '#000000',
                                  width: `${module.progress}%`
                                }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold">
                              {module.progress}%
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                          {module.description}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>

            {/* Display options */}
            <Card className="p-6 border-2 border-black bg-white">
              <div className="bg-black text-white px-3 py-1 inline-block mb-4 font-mono text-sm tracking-wide">
                ОТОБРАЖЕНИЕ
              </div>
              <div className="space-y-3 text-sm font-mono">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black hover:text-white p-2 border border-black transition-all">
                  <input 
                    type="radio" 
                    name="view" 
                    checked={viewFilter === 'all'}
                    onChange={() => setViewFilter('all')}
                    className="accent-black" 
                  />
                  <span>ПОЛНАЯ КАРТА</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black hover:text-white p-2 border border-black transition-all">
                  <input 
                    type="radio" 
                    name="view" 
                    checked={viewFilter === 'completed'}
                    onChange={() => setViewFilter('completed')}
                    className="accent-black" 
                  />
                  <span>ТОЛЬКО ПРОЙДЕННОЕ</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-black hover:text-white p-2 border border-black transition-all">
                  <input 
                    type="radio" 
                    name="view" 
                    checked={viewFilter === 'uncompleted'}
                    onChange={() => setViewFilter('uncompleted')}
                    className="accent-black" 
                  />
                  <span>ТОЛЬКО НЕПРОЙДЕННОЕ</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Right panel - Graph */}
          <div className="h-full relative pb-20">
            <KnowledgeGraph 
              nodes={graphNodes}
              edges={graphEdges}
              filter={viewFilter}
              onNodeClick={onNodeClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}