"""
Кастомные исключения для приложения
"""


class GraphException(Exception):
    """Базовое исключение для приложения"""
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(self.detail)


class ResourceNotFound(GraphException):
    """Ресурс не найден"""
    def __init__(self, resource_type: str, resource_id: str):
        detail = f"{resource_type} with ID '{resource_id}' not found"
        super().__init__(detail, status_code=404)


class UnauthorizedAccess(GraphException):
    """Доступ запрещен"""
    def __init__(self, detail: str = "Unauthorized access"):
        super().__init__(detail, status_code=403)


class ValidationError(GraphException):
    """Ошибка валидации"""
    def __init__(self, detail: str):
        super().__init__(detail, status_code=422)


class DuplicateResource(GraphException):
    """Ресурс уже существует"""
    def __init__(self, resource_type: str, field: str, value: str):
        detail = f"{resource_type} with {field}='{value}' already exists"
        super().__init__(detail, status_code=409)


class InvalidOperation(GraphException):
    """Недопустимая операция"""
    def __init__(self, detail: str):
        super().__init__(detail, status_code=400)


class DatabaseError(GraphException):
    """Ошибка БД"""
    def __init__(self, detail: str = "Database error"):
        super().__init__(detail, status_code=500)
