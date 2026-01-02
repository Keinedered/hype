"""
Скрипт для исправления ID узлов графа в базе данных
Исправляет узлы курсов, чтобы они имели формат node-{course_id}
"""
import sys
from database import SessionLocal, engine
import models

def fix_graph_nodes():
    """Исправляет ID узлов курсов в графе"""
    db = SessionLocal()
    try:
        # Находим все узлы курсов с неправильным ID (без префикса node-)
        course_nodes = db.query(models.GraphNode).filter(
            models.GraphNode.type == models.NodeType.course
        ).all()
        
        fixed_count = 0
        for node in course_nodes:
            # Если ID не начинается с "node-", исправляем
            if not node.id.startswith("node-"):
                old_id = node.id
                new_id = f"node-{node.entity_id}"
                
                print(f"Исправляю узел курса: {old_id} -> {new_id}")
                
                # Проверяем, нет ли уже узла с новым ID
                existing_new_node = db.query(models.GraphNode).filter(
                    models.GraphNode.id == new_id
                ).first()
                
                if existing_new_node:
                    print(f"  Узел с ID {new_id} уже существует, обновляем edges и удаляем старый")
                    # Обновляем все edges, которые ссылаются на старый узел
                    edges_as_source = db.query(models.GraphEdge).filter(
                        models.GraphEdge.source_id == old_id
                    ).all()
                    for edge in edges_as_source:
                        edge.source_id = new_id
                        print(f"  Обновлен edge: {edge.id} (source_id: {old_id} -> {new_id})")
                    
                    edges_as_target = db.query(models.GraphEdge).filter(
                        models.GraphEdge.target_id == old_id
                    ).all()
                    for edge in edges_as_target:
                        edge.target_id = new_id
                        print(f"  Обновлен edge: {edge.id} (target_id: {old_id} -> {new_id})")
                    
                    # Удаляем старый узел
                    db.delete(node)
                else:
                    # Сначала создаем новый узел с правильным ID
                    new_node = models.GraphNode(
                        id=new_id,
                        type=node.type,
                        entity_id=node.entity_id,
                        title=node.title,
                        x=node.x,
                        y=node.y,
                        status=node.status,
                        size=node.size
                    )
                    db.add(new_node)
                    db.flush()  # Сохраняем новый узел, чтобы он был доступен для foreign keys
                    
                    # Теперь обновляем все edges, которые ссылаются на старый узел
                    edges_as_source = db.query(models.GraphEdge).filter(
                        models.GraphEdge.source_id == old_id
                    ).all()
                    for edge in edges_as_source:
                        edge.source_id = new_id
                        print(f"  Обновлен edge: {edge.id} (source_id: {old_id} -> {new_id})")
                    
                    edges_as_target = db.query(models.GraphEdge).filter(
                        models.GraphEdge.target_id == old_id
                    ).all()
                    for edge in edges_as_target:
                        edge.target_id = new_id
                        print(f"  Обновлен edge: {edge.id} (target_id: {old_id} -> {new_id})")
                    
                    db.flush()  # Сохраняем обновленные edges
                    
                    # Удаляем старый узел (edges уже обновлены)
                    db.delete(node)
                
                fixed_count += 1
        
        if fixed_count > 0:
            db.commit()
            print(f"\n✓ Исправлено {fixed_count} узлов курсов")
        else:
            print("\n✓ Все узлы курсов уже имеют правильный формат ID")
        
        # Проверяем, что все edges между курсами и модулями созданы
        print("\nПроверяю edges между курсами и модулями...")
        course_nodes = db.query(models.GraphNode).filter(
            models.GraphNode.type == models.NodeType.course
        ).all()
        
        edges_created = 0
        for course_node in course_nodes:
            # Находим все модули этого курса
            modules = db.query(models.Module).filter(
                models.Module.course_id == course_node.entity_id
            ).all()
            
            for module in modules:
                # Находим узел модуля
                module_node = db.query(models.GraphNode).filter(
                    models.GraphNode.entity_id == module.id,
                    models.GraphNode.type == models.NodeType.module
                ).first()
                
                if module_node:
                    # Проверяем, есть ли edge между курсом и модулем
                    existing_edge = db.query(models.GraphEdge).filter(
                        models.GraphEdge.source_id == course_node.id,
                        models.GraphEdge.target_id == module_node.id
                    ).first()
                    
                    if not existing_edge:
                        edge = models.GraphEdge(
                            id=f"edge-{course_node.id}-{module_node.id}",
                            source_id=course_node.id,
                            target_id=module_node.id,
                            type=models.EdgeType.required
                        )
                        db.add(edge)
                        edges_created += 1
                        print(f"  Создан edge: {course_node.title} -> {module.title}")
        
        if edges_created > 0:
            db.commit()
            print(f"\n✓ Создано {edges_created} edges между курсами и модулями")
        else:
            print("\n✓ Все edges между курсами и модулями уже существуют")
        
        # Проверяем edges между модулями и уроками
        print("\nПроверяю edges между модулями и уроками...")
        module_nodes = db.query(models.GraphNode).filter(
            models.GraphNode.type == models.NodeType.module
        ).all()
        
        lesson_edges_created = 0
        for module_node in module_nodes:
            # Находим все уроки этого модуля
            lessons = db.query(models.Lesson).filter(
                models.Lesson.module_id == module_node.entity_id
            ).all()
            
            for lesson in lessons:
                # Находим узел урока
                lesson_node = db.query(models.GraphNode).filter(
                    models.GraphNode.entity_id == lesson.id,
                    models.GraphNode.type == models.NodeType.lesson
                ).first()
                
                if lesson_node:
                    # Проверяем, есть ли edge между модулем и уроком
                    existing_edge = db.query(models.GraphEdge).filter(
                        models.GraphEdge.source_id == module_node.id,
                        models.GraphEdge.target_id == lesson_node.id
                    ).first()
                    
                    if not existing_edge:
                        edge = models.GraphEdge(
                            id=f"edge-{module_node.id}-{lesson_node.id}",
                            source_id=module_node.id,
                            target_id=lesson_node.id,
                            type=models.EdgeType.required
                        )
                        db.add(edge)
                        lesson_edges_created += 1
                        print(f"  Создан edge: {module_node.title} -> {lesson.title}")
        
        if lesson_edges_created > 0:
            db.commit()
            print(f"\n✓ Создано {lesson_edges_created} edges между модулями и уроками")
        else:
            print("\n✓ Все edges между модулями и уроками уже существуют")
        
        print("\n" + "=" * 60)
        print("✅ Исправление графа завершено успешно!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Ошибка при исправлении графа: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    fix_graph_nodes()

