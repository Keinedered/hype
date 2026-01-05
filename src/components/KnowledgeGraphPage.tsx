import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { KnowledgeGraph } from './KnowledgeGraph';
import { graphAPI, modulesAPI } from '../api/client';
import { GraphNode, GraphEdge } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { BookOpen, Bell } from 'lucide-react';

// Алгоритм автоматического расположения узлов
// modulesData - опциональный параметр для загрузки модулей через API, если edges не содержат связей
interface ModuleData {
  id: string;
  course_id: string;
  title: string;
  description?: string;
}

function generateNodeLayout(nodes: GraphNode[], edges: GraphEdge[], modulesData?: ModuleData[]): GraphNode[] {
  // Константы для позиционирования
  const START_X = 0;
  const START_Y = 0;
  const MIN_DISTANCE = 1000; // Минимальное расстояние между узлами
  const IDEAL_DISTANCE = 1200; // Идеальное расстояние между связанными узлами
  const MIN_ANGLE = Math.PI / 12; // Минимальный угол между линиями (15 градусов)
  const CHAOS_FACTOR = 0.1; // Коэффициент хаотичности (уменьшен для более строгой кластеризации)

  // Размеры узлов для проверки коллизий (увеличены для больших меток)
  const NODE_SIZES = {
    concept: { width: 200, height: 200 },
    course: { width: 300, height: 250 },
    module: { width: 350, height: 300 },
    lesson: { width: 200, height: 200 },
  };

  // Генератор псевдослучайных чисел с seed для детерминированности
  let seed = 12345;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Функция для проверки пересечения двух прямоугольников
  const checkCollision = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean => {
    const padding = MIN_DISTANCE;
    return !(
      x1 + w1/2 + padding < x2 - w2/2 ||
      x2 + w2/2 + padding < x1 - w1/2 ||
      y1 + h1/2 + padding < y2 - h2/2 ||
      y2 + h2/2 + padding < y1 - h1/2
    );
  };

  // Функция для поиска позиции без коллизий (с хаотичностью)
  const findNonCollidingPosition = (
    desiredX: number,
    desiredY: number,
    nodeWidth: number,
    nodeHeight: number,
    existingNodes: Array<{ x: number; y: number; width: number; height: number }>,
    maxAttempts: number = 100
  ): { x: number; y: number } => {
    let x = desiredX;
    let y = desiredY;
    let attempts = 0;

    while (attempts < maxAttempts) {
      let hasCollision = false;

      for (const existing of existingNodes) {
        if (checkCollision(x, y, nodeWidth, nodeHeight, existing.x, existing.y, existing.width, existing.height)) {
          hasCollision = true;
          break;
        }
      }

      if (!hasCollision) {
        return { x, y };
      }

      // Хаотичное смещение по спирали с случайными отклонениями
      const angle = (attempts * 0.7) * Math.PI + (random() - 0.5) * Math.PI * CHAOS_FACTOR;
      const baseDistance = MIN_DISTANCE + attempts * 50;
      const chaosDistance = (random() - 0.5) * baseDistance * CHAOS_FACTOR;
      const distance = baseDistance + chaosDistance;
      
      x = desiredX + Math.cos(angle) * distance;
      y = desiredY + Math.sin(angle) * distance;
      attempts++;
    }

    return { x: desiredX, y: desiredY };
  };

  // Функция для определения квадранта точки относительно центра
  const getQuadrant = (x: number, y: number): 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom' => {
    if (x < START_X && y < START_Y) return 'left-top';
    if (x < START_X && y >= START_Y) return 'left-bottom';
    if (x >= START_X && y < START_Y) return 'right-top';
    return 'right-bottom';
  };

  // Функция для проверки, находится ли точка в квадранте
  const isInQuadrant = (x: number, y: number, quadrant: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'): boolean => {
    switch (quadrant) {
      case 'left-top':
        return x < START_X && y < START_Y;
      case 'left-bottom':
        return x < START_X && y >= START_Y;
      case 'right-top':
        return x >= START_X && y < START_Y;
      case 'right-bottom':
        return x >= START_X && y >= START_Y;
    }
  };

  // Функция для вычисления угла между двумя точками относительно центра
  const getAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.atan2(y2 - y1, x2 - x1);
  };

  // Функция для нормализации угла в диапазон [0, 2π]
  const normalizeAngle = (angle: number): number => {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
  };

  // Функция для вычисления минимальной разницы между двумя углами
  const getAngleDifference = (angle1: number, angle2: number): number => {
    const diff = Math.abs(angle1 - angle2);
    return Math.min(diff, Math.PI * 2 - diff);
  };

  // Функция для проверки углов между связями из одного узла
  const checkAnglesFromNode = (
    sourceX: number,
    sourceY: number,
    targets: Array<{ x: number; y: number; id: string }>,
    minAngle: number
  ): boolean => {
    if (targets.length < 2) return true;

    const angles = targets.map(target => ({
      id: target.id,
      angle: normalizeAngle(getAngle(sourceX, sourceY, target.x, target.y))
    })).sort((a, b) => a.angle - b.angle);

    // Проверяем углы между соседними связями
    for (let i = 0; i < angles.length; i++) {
      const current = angles[i];
      const next = angles[(i + 1) % angles.length];
      const diff = getAngleDifference(current.angle, next.angle);
      
      if (diff < minAngle) {
        return false;
      }
    }

    return true;
  };

  // Функция для оптимизации позиций узлов с учетом углов и расстояний
  const optimizeNodePositions = (
    nodes: Array<{ x: number; y: number; id: string; width: number; height: number }>,
    edges: Array<{ sourceId: string; targetId: string }>,
    sourceNode: { x: number; y: number; id: string },
    iterations: number = 5
  ): void => {
    for (let iter = 0; iter < iterations; iter++) {
      nodes.forEach(node => {
        if (node.id === sourceNode.id) return;

        let fx = 0;
        let fy = 0;

        // Сила отталкивания от других узлов
        nodes.forEach(other => {
          if (other.id === node.id || other.id === sourceNode.id) return;

          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (node.width + other.width) / 2 + MIN_DISTANCE;

          if (dist < minDist) {
            const force = (minDist - dist) / minDist;
            fx += (dx / dist) * force * 0.5;
            fy += (dy / dist) * force * 0.5;
          }
        });

        // Сила притяжения к связанным узлам (для равномерных расстояний)
        const connectedEdges = edges.filter(
          e => e.sourceId === node.id || e.targetId === node.id
        );

        connectedEdges.forEach(edge => {
          const otherId = edge.sourceId === node.id ? edge.targetId : edge.sourceId;
          const other = nodes.find(n => n.id === otherId);
          if (!other || other.id === sourceNode.id) return;

          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = IDEAL_DISTANCE;

          if (Math.abs(dist - idealDist) > 50) {
            const force = (dist - idealDist) / idealDist * 0.3;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // Применяем силы с затуханием
        const damping = 0.8;
        node.x += fx * damping;
        node.y += fy * damping;
      });
    }
  };

  // Функция для размещения модулей строго в секторе курса (внутри квадранта курса)
  const placeModulesInQuadrant = (
    modules: GraphNode[],
    courseX: number,
    courseY: number,
    courseId: string,
    courseQuadrant: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom',
    nodeWidth: number,
    nodeHeight: number,
    existingNodes: Array<{ x: number; y: number; width: number; height: number }>
  ): void => {
    // Вычисляем направление от центра к курсу (это направление сектора)
    const directionX = courseX - START_X;
    const directionY = courseY - START_Y;
    const directionLength = Math.sqrt(directionX * directionX + directionY * directionY) || 1;
    const directionUnitX = directionX / directionLength;
    const directionUnitY = directionY / directionLength;
    
    // Угол основного направления (от центра к курсу)
    const mainAngle = normalizeAngle(Math.atan2(directionUnitY, directionUnitX));
    
    // Расстояние от центра до курса
    const courseDistance = directionLength;
    
    // Модули размещаем дальше от центра, чем курс - создаем сектор/треугольник
    const MODULE_EXTENSION = 900; // На сколько дальше от центра размещаем модули
    const baseModuleDistance = courseDistance + MODULE_EXTENSION;
    
    // Угол сектора ограничен границами квадранта
    // Определяем границы углов для каждого квадранта
    const quadrantAngles: Record<string, { min: number; max: number }> = {
      'left-top': { min: Math.PI * 0.5, max: Math.PI },      // 90° - 180°
      'left-bottom': { min: Math.PI, max: Math.PI * 1.5 },   // 180° - 270°
      'right-top': { min: 0, max: Math.PI * 0.5 },            // 0° - 90°
      'right-bottom': { min: Math.PI * 1.5, max: Math.PI * 2 } // 270° - 360°
    };
    
    const quadrantBounds = quadrantAngles[courseQuadrant];
    
    // Вычисляем оптимальный угол разброса с учетом минимального угла между модулями
    const minSpreadAngle = modules.length > 1 ? (modules.length - 1) * MIN_ANGLE : 0;
    const maxSpreadAngle = Math.min(Math.PI * 0.5, (quadrantBounds.max - quadrantBounds.min) * 0.9);
    const spreadAngle = Math.max(minSpreadAngle, Math.min(maxSpreadAngle, Math.PI * 0.4));
    
    // Убеждаемся, что mainAngle находится в пределах квадранта
    let normalizedMainAngle = mainAngle;
    if (normalizedMainAngle < quadrantBounds.min || normalizedMainAngle >= quadrantBounds.max) {
      // Если угол вне квадранта, используем центр квадранта
      normalizedMainAngle = normalizeAngle((quadrantBounds.min + quadrantBounds.max) / 2);
    }
    
    // Сначала размещаем модули с равномерными углами
    const modulePositions: Array<{ x: number; y: number; id: string; width: number; height: number }> = [];
    
    modules.forEach((module, index) => {
      let attempts = 0;
      let position: { x: number; y: number } | null = null;
      
      // Пытаемся разместить модуль в секторе курса
      while (attempts < 100 && !position) {
        // Размещаем модули с равномерными углами для обеспечения минимального угла между линиями
        const angleStep = modules.length > 1 ? spreadAngle / (modules.length - 1) : 0;
        const angleOffset = -spreadAngle / 2 + index * angleStep;
        let angle = normalizedMainAngle + angleOffset;
        
        // Нормализуем угол
        angle = normalizeAngle(angle);
        
        // Ограничиваем угол границами квадранта
        if (angle < quadrantBounds.min) {
          angle = quadrantBounds.min + (random() * 0.05);
        } else if (angle >= quadrantBounds.max) {
          // Для right-bottom квадранта (270°-360°), учитываем переход через 0°
          if (courseQuadrant === 'right-bottom' && angle >= Math.PI * 2) {
            angle = Math.PI * 2 - (random() * 0.05);
          } else {
            angle = quadrantBounds.max - (random() * 0.05);
          }
        }
        
        // Добавляем минимальную хаотичность, но в пределах квадранта
        angle += (random() - 0.5) * spreadAngle * 0.1;
        
        // Финальная проверка и корректировка угла
        if (angle < quadrantBounds.min) angle = quadrantBounds.min + 0.01;
        if (angle >= quadrantBounds.max) {
          if (courseQuadrant === 'right-bottom' && angle >= Math.PI * 2) {
            angle = Math.PI * 2 - 0.01;
          } else {
            angle = quadrantBounds.max - 0.01;
          }
        }
        
        // Вычисляем отклонение угла от основного направления к курсу
        let angleDeviation = getAngleDifference(angle, normalizedMainAngle);
        
        // Модули, которые дальше отклоняются от направления курса, размещаются дальше от центра
        const maxDeviation = spreadAngle / 2 || 0.01;
        const distanceMultiplier = maxDeviation > 0.01 
          ? 1 + (angleDeviation / maxDeviation) * 0.6  // До 60% дополнительного расстояния
          : 1;
        const baseModuleDistanceWithDeviation = baseModuleDistance * distanceMultiplier;
        
        // Добавляем небольшую случайную вариацию для более естественного вида
        const distanceVariation = (random() - 0.5) * MODULE_EXTENSION * 0.15;
        const moduleDistance = baseModuleDistanceWithDeviation + distanceVariation;
        
        // Позиция модуля в секторе от центра (дальше от центра, чем курс)
        const desiredX = START_X + Math.cos(angle) * moduleDistance;
        const desiredY = START_Y + Math.sin(angle) * moduleDistance;
        
        // Проверяем, что позиция находится в правильном квадранте
        if (isInQuadrant(desiredX, desiredY, courseQuadrant)) {
          // Создаем специализированную функцию поиска позиции с учетом квадранта
          let foundPosition = findNonCollidingPosition(desiredX, desiredY, nodeWidth, nodeHeight, existingNodes);
          
          // Если найденная позиция вышла за границы квадранта, корректируем её
          if (!isInQuadrant(foundPosition.x, foundPosition.y, courseQuadrant)) {
            // Корректируем позицию, чтобы она была в квадранте
            // Используем простое смещение к центру квадранта
            const quadrantCenterX = courseQuadrant.includes('right') ? START_X + 200 : START_X - 200;
            const quadrantCenterY = courseQuadrant.includes('bottom') ? START_Y + 200 : START_Y - 200;
            const dx = quadrantCenterX - foundPosition.x;
            const dy = quadrantCenterY - foundPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const correctionDistance = Math.min(distance, 300);
            foundPosition.x += (dx / distance) * correctionDistance;
            foundPosition.y += (dy / distance) * correctionDistance;
          }
          
          position = foundPosition;
        }
        
        attempts++;
      }
      
      // Если не удалось найти позицию в квадранте, используем позицию дальше от центра
      if (!position) {
        // Вычисляем направление от центра к курсу для размещения модулей дальше
        const directionX = courseX - START_X;
        const directionY = courseY - START_Y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY) || 1;
        const directionUnitX = directionX / directionLength;
        const directionUnitY = directionY / directionLength;
        
        // Размещаем модуль дальше от центра, чем курс
        const fallbackDistance = directionLength + MODULE_EXTENSION + (random() * 200);
        const angleOffset = (random() - 0.5) * Math.PI * 0.2; // Небольшое отклонение угла
        const fallbackAngle = Math.atan2(directionUnitY, directionUnitX) + angleOffset;
        
        let fallbackX: number, fallbackY: number;
        fallbackX = START_X + Math.cos(fallbackAngle) * fallbackDistance;
        fallbackY = START_Y + Math.sin(fallbackAngle) * fallbackDistance;
        
        position = findNonCollidingPosition(fallbackX, fallbackY, nodeWidth, nodeHeight, existingNodes);
        
        // Принудительно корректируем позицию, если она вышла за границы квадранта
        if (!isInQuadrant(position.x, position.y, courseQuadrant)) {
          // Используем простое смещение к центру квадранта
          const quadrantCenterX = courseQuadrant.includes('right') ? START_X + 200 : START_X - 200;
          const quadrantCenterY = courseQuadrant.includes('bottom') ? START_Y + 200 : START_Y - 200;
          const dx = quadrantCenterX - position.x;
          const dy = quadrantCenterY - position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const correctionDistance = Math.min(distance, 300);
          position.x += (dx / distance) * correctionDistance;
          position.y += (dy / distance) * correctionDistance;
        }
      }
      
      module.x = position.x;
      module.y = position.y;
      modulePositions.push({ 
        x: position.x, 
        y: position.y, 
        id: module.id, 
        width: nodeWidth, 
        height: nodeHeight 
      });
      existingNodes.push({ x: position.x, y: position.y, width: nodeWidth, height: nodeHeight });
    });

    // Оптимизируем позиции модулей для равномерных расстояний и углов
    if (modulePositions.length > 1) {
      // Получаем edges, связывающие курс с модулями
      const courseModuleEdges = edges.filter(edge => {
        return modulePositions.some(m => 
          (edge.sourceId === courseId && edge.targetId === m.id) ||
          (edge.sourceId === m.id && edge.targetId === courseId)
        );
      });

      // Оптимизируем позиции
      if (courseModuleEdges.length > 0) {
        optimizeNodePositions(
          modulePositions,
          courseModuleEdges,
          { x: courseX, y: courseY, id: courseId },
          3
        );
      }

      // Обновляем позиции модулей
      modulePositions.forEach((pos, idx) => {
        if (modules[idx]) {
          modules[idx].x = pos.x;
          modules[idx].y = pos.y;
        }
      });
    }
  };

  // Разделяем узлы по типам
  // Уроки не отображаются на графе - они находятся внутри модулей
  const rootNode = nodes.find(n => n.id === 'root' || (n.type === 'concept' && n.title === 'GRAPH'));
  const courseNodes = nodes.filter(n => n.type === 'course');
  const moduleNodes = nodes.filter(n => n.type === 'module');

  // Создаем карту узлов для быстрого доступа
  const nodeMap = new Map<string, GraphNode>();
  const placedNodes: Array<{ x: number; y: number; width: number; height: number }> = [];

  // Размещаем корневой узел
  if (rootNode) {
    const rootSize = NODE_SIZES.concept;
    rootNode.x = START_X;
    rootNode.y = START_Y;
    nodeMap.set(rootNode.id, rootNode);
    placedNodes.push({ x: START_X, y: START_Y, width: rootSize.width, height: rootSize.height });
  }

  // Размещаем курсы в 4 квадрантах вокруг root с равномерными углами
  if (rootNode && courseNodes.length > 0) {
    const courseSize = NODE_SIZES.course;
    // Расстояние от центра до курсов - распределяем по всей площади поля
    // Используем примерно 40% от минимального размера поля для равномерного распределения
    const COURSE_OFFSET = 1500; // Расстояние от центра до курсов
    
    // Вычисляем углы для равномерного распределения курсов по квадрантам
    const coursesPerQuadrant = Math.ceil(courseNodes.length / 4);
    const coursePositions: Array<{ x: number; y: number; id: string; width: number; height: number }> = [];
    
    courseNodes.forEach((course, index) => {
      const quadrantIndex = Math.floor(index / coursesPerQuadrant);
      const positionInQuadrant = index % coursesPerQuadrant;
      
      // Базовые углы для каждого квадранта (центры квадрантов)
      const quadrantBaseAngles = [
        Math.PI * 0.75,   // left-top: 135°
        Math.PI * 1.25,   // left-bottom: 225°
        Math.PI * 0.25,   // right-top: 45°
        Math.PI * 1.75    // right-bottom: 315°
      ];
      
      const quadrantNames: Array<'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'> = [
        'left-top', 'left-bottom', 'right-top', 'right-bottom'
      ];
      
      const baseAngle = quadrantBaseAngles[quadrantIndex];
      const quadrantName = quadrantNames[quadrantIndex];
      
      // Распределяем курсы внутри квадранта с равномерными углами
      const angleSpread = Math.PI * 0.3; // Разброс углов внутри квадранта
      const angleStep = coursesPerQuadrant > 1 ? angleSpread / (coursesPerQuadrant - 1) : 0;
      const angleOffset = -angleSpread / 2 + positionInQuadrant * angleStep;
      let angle = normalizeAngle(baseAngle + angleOffset);
      
      // Используем одинаковое расстояние от центра для всех курсов (без случайных отклонений)
      const distance = COURSE_OFFSET;
      
      const desiredX = START_X + Math.cos(angle) * distance;
      const desiredY = START_Y + Math.sin(angle) * distance;
      
      // Проверяем коллизии, но сохраняем одинаковое расстояние от центра
      let position = { x: desiredX, y: desiredY };
      let hasCollision = false;
      
      // Проверяем коллизии с уже размещенными узлами
      for (const existing of placedNodes) {
        if (checkCollision(position.x, position.y, courseSize.width, courseSize.height, existing.x, existing.y, existing.width, existing.height)) {
          hasCollision = true;
          break;
        }
      }
      
      // Если есть коллизия, корректируем только угол, сохраняя расстояние
      if (hasCollision) {
        let bestPosition = position;
        let bestAngle = angle;
        let minCollisions = Infinity;
        
        // Пробуем разные углы в пределах квадранта
        for (let angleOffset = -Math.PI * 0.15; angleOffset <= Math.PI * 0.15; angleOffset += Math.PI * 0.05) {
          const testAngle = normalizeAngle(angle + angleOffset);
          
          // Проверяем, что угол в пределах квадранта
          let angleInQuadrant = true;
          if (quadrantName === 'left-top' && (testAngle < Math.PI * 0.5 || testAngle > Math.PI)) angleInQuadrant = false;
          if (quadrantName === 'left-bottom' && (testAngle < Math.PI || testAngle > Math.PI * 1.5)) angleInQuadrant = false;
          if (quadrantName === 'right-top' && (testAngle > Math.PI * 0.5 || testAngle < 0)) angleInQuadrant = false;
          if (quadrantName === 'right-bottom' && (testAngle < Math.PI * 1.5 || testAngle > Math.PI * 2)) angleInQuadrant = false;
          
          if (!angleInQuadrant) continue;
          
          const testX = START_X + Math.cos(testAngle) * COURSE_OFFSET;
          const testY = START_Y + Math.sin(testAngle) * COURSE_OFFSET;
          
          let collisions = 0;
          for (const existing of placedNodes) {
            if (checkCollision(testX, testY, courseSize.width, courseSize.height, existing.x, existing.y, existing.width, existing.height)) {
              collisions++;
            }
          }
          
          if (collisions < minCollisions) {
            minCollisions = collisions;
            bestPosition = { x: testX, y: testY };
            bestAngle = testAngle;
          }
        }
        
        position = bestPosition;
      }
      
      // Финальная нормализация расстояния (на случай небольших погрешностей)
      const actualDistance = Math.sqrt(
        Math.pow(position.x - START_X, 2) + Math.pow(position.y - START_Y, 2)
      );
      if (Math.abs(actualDistance - COURSE_OFFSET) > 1) {
        const angleToPosition = Math.atan2(position.y - START_Y, position.x - START_X);
        position.x = START_X + Math.cos(angleToPosition) * COURSE_OFFSET;
        position.y = START_Y + Math.sin(angleToPosition) * COURSE_OFFSET;
      }
      
      // Убеждаемся, что курс остался в своем квадранте (корректируем только если необходимо)
      if (!isInQuadrant(position.x, position.y, quadrantName)) {
        // Корректируем угол, чтобы остаться в квадранте, сохраняя расстояние
        const angleToPosition = Math.atan2(position.y - START_Y, position.x - START_X);
        let correctedAngle = normalizeAngle(angleToPosition);
        
        // Ограничиваем угол границами квадранта
        const quadrantBounds: Record<string, { min: number; max: number }> = {
          'left-top': { min: Math.PI * 0.5, max: Math.PI },
          'left-bottom': { min: Math.PI, max: Math.PI * 1.5 },
          'right-top': { min: 0, max: Math.PI * 0.5 },
          'right-bottom': { min: Math.PI * 1.5, max: Math.PI * 2 }
        };
        
        const bounds = quadrantBounds[quadrantName];
        if (correctedAngle < bounds.min) correctedAngle = bounds.min + 0.01;
        if (correctedAngle >= bounds.max) {
          if (quadrantName === 'right-bottom') {
            correctedAngle = Math.PI * 2 - 0.01;
          } else {
            correctedAngle = bounds.max - 0.01;
          }
        }
        
        position.x = START_X + Math.cos(correctedAngle) * COURSE_OFFSET;
        position.y = START_Y + Math.sin(correctedAngle) * COURSE_OFFSET;
      }
      
      course.x = position.x;
      course.y = position.y;
      nodeMap.set(course.id, course);
      coursePositions.push({ 
        x: position.x, 
        y: position.y, 
        id: course.id, 
        width: courseSize.width, 
        height: courseSize.height 
      });
      placedNodes.push({ x: position.x, y: position.y, width: courseSize.width, height: courseSize.height });
    });

    // Оптимизируем позиции курсов, сохраняя одинаковое расстояние от центра
    if (coursePositions.length > 1) {
      const rootEdges = edges.filter(edge => {
        const rootId = rootNode.id;
        return coursePositions.some(c => 
          edge.sourceId === rootId && edge.targetId === c.id ||
          edge.sourceId === c.id && edge.targetId === rootId
        );
      });

      // Оптимизируем только углы, сохраняя одинаковое расстояние от центра
      for (let iter = 0; iter < 3; iter++) {
        coursePositions.forEach((pos, idx) => {
          if (idx === 0) return; // Первый курс не двигаем
          
          let fx = 0;
          let fy = 0;
          
          // Сила отталкивания от других курсов
          coursePositions.forEach((other, otherIdx) => {
            if (otherIdx === idx) return;
            
            const dx = pos.x - other.x;
            const dy = pos.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (courseSize.width + courseSize.width) / 2 + MIN_DISTANCE;
            
            if (dist < minDist) {
              const force = (minDist - dist) / minDist;
              fx += (dx / dist) * force * 0.3;
              fy += (dy / dist) * force * 0.3;
            }
          });
          
          // Применяем силу
          pos.x += fx * 0.5;
          pos.y += fy * 0.5;
          
          // Обязательно нормализуем расстояние от центра до COURSE_OFFSET после каждой итерации
          const currentDistance = Math.sqrt(
            Math.pow(pos.x - START_X, 2) + Math.pow(pos.y - START_Y, 2)
          );
          if (Math.abs(currentDistance - COURSE_OFFSET) > 1) {
            const angle = Math.atan2(pos.y - START_Y, pos.x - START_X);
            pos.x = START_X + Math.cos(angle) * COURSE_OFFSET;
            pos.y = START_Y + Math.sin(angle) * COURSE_OFFSET;
          }
        });
      }

      // Финальная нормализация расстояния для всех курсов (гарантируем одинаковое расстояние)
      coursePositions.forEach((pos) => {
        const currentDistance = Math.sqrt(
          Math.pow(pos.x - START_X, 2) + Math.pow(pos.y - START_Y, 2)
        );
        if (Math.abs(currentDistance - COURSE_OFFSET) > 1) {
          const angle = Math.atan2(pos.y - START_Y, pos.x - START_X);
          pos.x = START_X + Math.cos(angle) * COURSE_OFFSET;
          pos.y = START_Y + Math.sin(angle) * COURSE_OFFSET;
        }
      });

      // Обновляем позиции курсов
      coursePositions.forEach((pos, idx) => {
        if (courseNodes[idx]) {
          courseNodes[idx].x = pos.x;
          courseNodes[idx].y = pos.y;
        }
      });
    }
  }

  // Размещаем модули в кластерах вокруг их курсов (в том же квадранте)
  courseNodes.forEach((course) => {
    if (!course.x || !course.y) return;
    
    // Находим модули, связанные с этим курсом через edges
    const courseNodeId = course.id.startsWith('node-') ? course.id : `node-${course.entityId || course.id}`;
    const courseEntityId = course.entityId || (course.id.startsWith('node-') ? course.id.replace('node-', '') : course.id);
    
    const courseModules = moduleNodes.filter(module => {
      const moduleNodeId = module.id.startsWith('node-') ? module.id : `node-${module.entityId || module.id}`;
      const moduleEntityId = module.entityId || (module.id.startsWith('node-') ? module.id.replace('node-', '') : module.id);
      
      // Проверяем связь курс -> модуль через edges
      const hasEdge = edges.some(edge => {
        if (edge.sourceId === courseNodeId && edge.targetId === moduleNodeId) return true;
        if (edge.sourceId === course.id && edge.targetId === module.id) return true;
        if (edge.sourceId === `node-${courseEntityId}` && edge.targetId === `node-${moduleEntityId}`) return true;
        if (edge.sourceId === courseEntityId && edge.targetId === moduleEntityId) return true;
        return false;
      });
      
      // Если связь через edges не найдена, проверяем через modulesData (API)
      if (!hasEdge && modulesData && modulesData.length > 0) {
        const moduleFromAPI = modulesData.find(m => {
          const moduleId = m.id || m.module_id;
          return moduleId === moduleEntityId;
        });
        
        if (moduleFromAPI) {
          const moduleCourseId = moduleFromAPI.course_id || moduleFromAPI.courseId;
          if (moduleCourseId === courseEntityId) {
            return true;
          }
        }
      }
      
      return hasEdge;
    });

    if (courseModules.length > 0) {
      const moduleSize = NODE_SIZES.module;
      
      // Определяем квадрант курса для строгого размещения модулей в этом квадранте
      const courseQuadrant = getQuadrant(course.x, course.y);
      
      placeModulesInQuadrant(
        courseModules,
        course.x,
        course.y,
        course.id,
        courseQuadrant,
        moduleSize.width,
        moduleSize.height,
        placedNodes
      );
      
      courseModules.forEach(module => {
        nodeMap.set(module.id, module);
      });
    }
  });

  // Уроки не размещаются на графе - они находятся внутри модулей
  // Возвращаем только root, курсы и модули с обновленными координатами
  const visibleNodes = [rootNode, ...courseNodes, ...moduleNodes].filter(Boolean) as GraphNode[];
  const finalNodes = visibleNodes.map(node => nodeMap.get(node.id) || node);

  // Финальная оптимизация всех узлов для равномерных расстояний и углов
  if (finalNodes.length > 2) {
    const allNodePositions = finalNodes.map(node => ({
      x: node.x || START_X,
      y: node.y || START_Y,
      id: node.id,
      width: NODE_SIZES[node.type]?.width || NODE_SIZES.concept.width,
      height: NODE_SIZES[node.type]?.height || NODE_SIZES.concept.height
    }));

    // Оптимизируем позиции всех узлов
    optimizeNodePositions(allNodePositions, edges, { x: START_X, y: START_Y, id: 'root' }, 3);

    // Обновляем позиции узлов
    allNodePositions.forEach(pos => {
      const node = finalNodes.find(n => n.id === pos.id);
      if (node) {
        node.x = pos.x;
        node.y = pos.y;
      }
    });

    // Проверяем и корректируем углы между связями из одного узла
    finalNodes.forEach(sourceNode => {
      if (!sourceNode.x || !sourceNode.y) return;

      const sourceEdges = edges.filter(e => 
        e.sourceId === sourceNode.id || e.targetId === sourceNode.id
      );

      if (sourceEdges.length < 2) return;

      const targets = sourceEdges.map(edge => {
        const targetId = edge.sourceId === sourceNode.id ? edge.targetId : edge.sourceId;
        const target = finalNodes.find(n => n.id === targetId);
        return target ? { x: target.x || START_X, y: target.y || START_Y, id: targetId } : null;
      }).filter(Boolean) as Array<{ x: number; y: number; id: string }>;

      if (targets.length < 2) return;

      // Проверяем углы
      let needsCorrection = !checkAnglesFromNode(
        sourceNode.x,
        sourceNode.y,
        targets,
        MIN_ANGLE
      );

      if (needsCorrection) {
        // Вычисляем углы
        const angles = targets.map(target => ({
          id: target.id,
          angle: normalizeAngle(getAngle(sourceNode.x!, sourceNode.y!, target.x, target.y))
        })).sort((a, b) => a.angle - b.angle);

        // Корректируем позиции целевых узлов для увеличения углов
        for (let i = 0; i < angles.length; i++) {
          const current = angles[i];
          const next = angles[(i + 1) % angles.length];
          let diff = getAngleDifference(current.angle, next.angle);

          if (diff < MIN_ANGLE) {
            const correction = (MIN_ANGLE - diff) / 2;
            const target = finalNodes.find(n => n.id === current.id);
            const nextTarget = finalNodes.find(n => n.id === next.id);

            if (target && nextTarget && target.x && target.y && nextTarget.x && nextTarget.y) {
              // Слегка смещаем узлы для увеличения угла
              const dx1 = target.x - sourceNode.x!;
              const dy1 = target.y - sourceNode.y!;
              const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
              
              const newAngle1 = normalizeAngle(current.angle - correction);
              target.x = sourceNode.x! + Math.cos(newAngle1) * dist1;
              target.y = sourceNode.y! + Math.sin(newAngle1) * dist1;

              const dx2 = nextTarget.x - sourceNode.x!;
              const dy2 = nextTarget.y - sourceNode.y!;
              const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
              
              const newAngle2 = normalizeAngle(next.angle + correction);
              nextTarget.x = sourceNode.x! + Math.cos(newAngle2) * dist2;
              nextTarget.y = sourceNode.y! + Math.sin(newAngle2) * dist2;
            }
          }
        }
      }
    });
  }

  return finalNodes;
}

interface KnowledgeGraphPageProps {
  onNodeClick?: (nodeId: string, nodeType?: string) => void;
  onOpenHandbook?: () => void;
}

export function KnowledgeGraphPage({ onNodeClick, onOpenHandbook }: KnowledgeGraphPageProps) {
  const [viewFilter, setViewFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  interface ModuleListItem {
    id: string;
    title: string;
    description: string;
    progress: number;
  }
  const [modules, setModules] = useState<ModuleListItem[]>([]);

  // Загрузка данных графа из API
  const loadGraphData = useCallback(async () => {
      try {
        setIsLoading(true);
        const [nodesData, edgesData] = await Promise.all([
          graphAPI.getNodes(),
          graphAPI.getEdges(),
        ]);

        // Преобразуем данные из API в формат GraphNode с валидацией координат
        interface ApiNode {
          id?: string;
          x?: number;
          y?: number;
          title?: string;
          type?: string;
          status?: string;
          entity_id?: string;
          entityId?: string;
          size?: number;
        }
        const nodes: GraphNode[] = Array.isArray(nodesData)
          ? nodesData
              .map((node: ApiNode) => {
                const x = typeof node.x === 'number' && !isNaN(node.x) && isFinite(node.x) ? node.x : 0;
                const y = typeof node.y === 'number' && !isNaN(node.y) && isFinite(node.y) ? node.y : 0;
                // Для модулей и уроков entityId должен быть равен их реальному ID из базы данных
                const nodeEntityId = node.entity_id || node.entityId || node.id || '';
                return {
                  id: node.id || '',
                  x,
                  y,
                  title: node.title || '',
                  type: (node.type || 'concept') as GraphNode['type'],
                  status: (node.status || 'open') as GraphNode['status'],
                  // Для модулей и уроков используем их ID как entityId, если entityId не указан
                  entityId: (node.type === 'module' || node.type === 'lesson') && !nodeEntityId 
                    ? (node.id || '').replace(/^node-/, '') 
                    : nodeEntityId,
                  size: typeof node.size === 'number' ? node.size : undefined,
                };
              })
              .filter((node: GraphNode) => node.id !== '') // Фильтруем узлы без ID
          : [];

        // Преобразуем данные из API в формат GraphEdge с валидацией
        interface ApiEdge {
          id?: string;
          source_id?: string;
          sourceId?: string;
          target_id?: string;
          targetId?: string;
          type?: string;
        }
        const edges: GraphEdge[] = Array.isArray(edgesData)
          ? edgesData
              .map((edge: ApiEdge) => ({
                id: edge.id || '',
                sourceId: edge.source_id || edge.sourceId || '',
                targetId: edge.target_id || edge.targetId || '',
                type: (edge.type || 'required') as GraphEdge['type'],
              }))
              .filter((edge: GraphEdge) => edge.id && edge.sourceId && edge.targetId) // Фильтруем невалидные связи
          : [];

        // Загружаем модули через API для альтернативного способа поиска связей
        let modulesData: ModuleData[] = [];
        try {
          const courseIds = nodes.filter(n => n.type === 'course').map(n => {
            const entityId = n.entityId || n.id.replace('node-', '');
            return entityId;
          });
          
          const modulesPromises = courseIds.map(async (courseId) => {
            try {
              const modules = await modulesAPI.getByCourseId(courseId);
              return Array.isArray(modules) ? modules.map((m: { id: string; course_id?: string; title: string; description?: string }) => ({
                id: m.id,
                course_id: m.course_id || courseId,
                title: m.title,
                description: m.description
              })) : [];
            } catch (error) {
              return [];
            }
          });
          
          const modulesArrays = await Promise.all(modulesPromises);
          modulesData = modulesArrays.flat().filter(Boolean);
        } catch (error) {
          // Silently fail - modulesData will be empty
        }

        // Фильтруем узлы - убираем уроки, они не отображаются на графе
        const filteredNodes = nodes.filter(node => node.type !== 'lesson');
        
        // Фильтруем edges - убираем связи с уроками
        const filteredEdges = edges.filter(edge => {
          if (!edge.sourceId || !edge.targetId) return false;
          const sourceNode = nodes.find(n => {
            const sourceIdStr = typeof edge.sourceId === 'string' ? edge.sourceId : String(edge.sourceId);
            return n.id === sourceIdStr || n.id === sourceIdStr.replace('node-', '');
          });
          const targetNode = nodes.find(n => {
            const targetIdStr = typeof edge.targetId === 'string' ? edge.targetId : String(edge.targetId);
            return n.id === targetIdStr || n.id === targetIdStr.replace('node-', '');
          });
          // Оставляем только edges между root, курсами и модулями
          return sourceNode && targetNode && 
                 sourceNode.type !== 'lesson' && 
                 targetNode.type !== 'lesson';
        });
        
        // Применяем алгоритм автоматического расположения узлов (только root, курсы и модули)
        const positionedNodes = generateNodeLayout(filteredNodes, filteredEdges, modulesData);

        setGraphNodes(positionedNodes);
        setGraphEdges(filteredEdges);

        // Извлекаем модули из узлов типа 'module' (используем positionedNodes)
        const moduleNodes = positionedNodes.filter((n) => n.type === 'module');
        setModules(
          moduleNodes.map((node) => ({
            id: node.entityId || node.id,
            title: node.title,
            description: '',
            progress: node.status === 'completed' ? 100 : 0,
          }))
        );
      } catch (error: unknown) {
        console.error('Failed to load graph data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки данных графа';
        setError(errorMessage);
        // Устанавливаем пустые данные при ошибке
        setGraphNodes([]);
        setGraphEdges([]);
        setModules([]);
      } finally {
        setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

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

        <div className="grid lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-12rem)]">
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
          <div className="h-full relative">
            {isLoading ? (
              <div className="flex items-center justify-center h-full border-2 border-black bg-white">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent animate-spin rounded-full mx-auto mb-4" />
                  <div className="text-lg font-mono mb-2">Загрузка графа...</div>
                  <div className="text-sm text-muted-foreground">Пожалуйста, подождите</div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full border-2 border-black bg-white p-6">
                <div className="text-center max-w-md">
                  <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                    ОШИБКА
                  </div>
                  <p className="text-foreground font-mono mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      loadGraphData();
                    }}
                    className="border-2 border-black px-4 py-2 font-mono text-sm hover:bg-black hover:text-white transition-colors"
                  >
                    Попробовать снова
                  </button>
                </div>
              </div>
            ) : graphNodes.length === 0 ? (
              <div className="flex items-center justify-center h-full border-2 border-black bg-white">
                <div className="text-center">
                  <div className="bg-black text-white px-6 py-3 inline-block font-mono tracking-wide mb-4">
                    ГРАФ ПУСТ
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Нет данных для отображения</div>
                </div>
              </div>
            ) : (
              <KnowledgeGraph 
                nodes={graphNodes}
                edges={graphEdges}
                filter={viewFilter}
                onNodeClick={onNodeClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}