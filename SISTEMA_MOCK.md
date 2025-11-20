# Sistema de Notificaciones Mock - TiendaApp

## Descripción General

El sistema actualmente utiliza notificaciones **Mock** para simular el envío de códigos de verificación por WhatsApp y notificaciones de compras. Esto permite probar toda la funcionalidad sin necesidad de configurar servicios externos de pago.

## Códigos de Verificación Mock

### Cómo Funciona

1. **Usuario solicita verificación**: Al ingresar un número de teléfono y solicitar verificación, el sistema genera un código aleatorio de 6 dígitos.

2. **El código se muestra en dos lugares**:
   - **Response del API**: El endpoint `/api/requests/verify-phone` devuelve el código en el campo `mock_code`
   - **Logs del servidor**: El código aparece en los logs del backend con el formato:
     ```
     📱 MOCK WHATSAPP: Código de verificación para +52 123 456 7890
        Código: 123456
        ⚠️ Este código solo aparece en los logs del servidor
     ```

3. **Verificación**: El usuario ingresa el código en el formulario y el sistema lo valida contra el código almacenado temporalmente en la base de datos.

### Ejemplo de Uso

```bash
# Solicitar código
curl -X POST "https://emarket-portal.preview.emergentagent.com/api/requests/verify-phone" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+52 123 456 7890"}'

# Respuesta:
{
  "message": "Código enviado",
  "mock_code": "856851"
}
```

## Notificaciones Mock de Solicitudes

### Tipos de Notificaciones

1. **Solicitudes de Compra**: Se registran en logs cuando un usuario solicita un producto con stock
2. **Solicitudes Sin Stock**: Se registran cuando un usuario solicita ser notificado sobre productos agotados
3. **Solicitudes Personalizadas**: Se registran cuando un usuario solicita un producto no existente

### Formato en Logs

```
📧 MOCK EMAIL: Solicitud de compra #abc-123
   Cliente: Juan Pérez (juan@email.com)
   Producto: Laptop Dell XPS 15 x2
   Total: $2599.98
   Teléfono: +52 123 456 7890
```

### Dónde Ver las Notificaciones

Los administradores pueden ver todas las solicitudes en el **Panel de Administración** > pestaña **Solicitudes**.

## Configuración para Producción

### Cuando necesites integrar servicios reales:

1. **Para WhatsApp Business API**:
   - Obtener cuenta de WhatsApp Business API
   - Configurar webhook y token
   - Actualizar endpoint `/api/requests/verify-phone` para enviar códigos reales
   - Mantener el flujo de validación existente

2. **Para Email (SendGrid, Mailgun, etc.)**:
   - Obtener API key del servicio
   - Configurar email remitente verificado
   - Actualizar las funciones de notificación en `server.py`
   - Usar los emails/teléfonos configurados en el panel admin

3. **Configuración Admin**:
   - El panel admin tiene una sección "Configuración" donde puedes establecer:
     - Email para recibir notificaciones
     - Teléfono WhatsApp para notificaciones

### Ventajas del Sistema Mock

- ✅ Prueba completa de flujos sin costos
- ✅ Desarrollo y testing sin APIs externas
- ✅ Fácil transición a servicios reales
- ✅ Misma lógica de negocio y validaciones
- ✅ Los teléfonos verificados se guardan igual que en producción

## Números Verificados

El sistema guarda los números verificados en la colección `verified_phones`. Una vez verificado un número:

1. No se vuelve a solicitar código para ese número
2. Se actualiza `last_used` cada vez que se usa
3. Permite múltiples solicitudes sin reverificación

## Estructura de Datos

### Pending Verifications
```json
{
  "phone": "+52 123 456 7890",
  "code": "123456",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Verified Phones
```json
{
  "phone": "+52 123 456 7890",
  "verified_at": "2024-01-01T00:00:00Z",
  "last_used": "2024-01-01T00:00:00Z"
}
```

## Testing

Para probar el sistema Mock:

```bash
# 1. Solicitar código
RESPONSE=$(curl -s -X POST "https://emarket-portal.preview.emergentagent.com/api/requests/verify-phone" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+52 555 1234"}')

CODE=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['mock_code'])")

# 2. Validar código
curl -X POST "https://emarket-portal.preview.emergentagent.com/api/requests/validate-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"+52 555 1234\", \"code\": \"$CODE\"}"
```
