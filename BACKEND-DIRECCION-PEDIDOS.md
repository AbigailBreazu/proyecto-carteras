# Backend: Agregar Dirección Principal en Pedidos

## Cambio Necesario

El endpoint backend `GET /api/personalizacion/pedidos/:id` debe incluir la dirección principal del usuario en la respuesta.

## Estructura de Respuesta Esperada

```json
{
  "id": "123",
  "userEmail": "usuario@email.com",
  "userName": "Juan Pérez",
  "disenoBase": null,
  "disenoPropio": "http://localhost:3000/uploads/disenos/...",
  "telasSeleccionadas": ["tela1.jpg", "tela2.jpg"],
  "comentarios": "...",
  "estado": "PENDIENTE",
  "fechaCreacion": "2024-01-15T10:30:00Z",
  "fechaActualizacion": "2024-01-15T10:30:00Z",
  "usuario": {
    "nombre": "Juan Pérez",
    "email": "usuario@email.com",
    "direccionPrincipal": {
      "alias": "CASA",
      "provincia": "Córdoba",
      "ciudad": "Córdoba Capital",
      "calle": "Av. Colón",
      "numero": "1234",
      "piso": "5",
      "departamento": "B",
      "codigoPostal": "5000",
      "referencias": "Portón negro, timbre B",
      "latitud": -31.420083,
      "longitud": -64.188776
    }
  }
}
```

## Query SQL Sugerida

```sql
SELECT 
  p.*,
  u.nombre as userName,
  u.email as userEmail,
  d.alias,
  d.provincia,
  d.ciudad,
  d.calle,
  d.numero,
  d.piso,
  d.departamento,
  d.codigoPostal,
  d.referencias,
  d.latitud,
  d.longitud
FROM pedidos_personalizados p
LEFT JOIN usuarios u ON p.userId = u.id
LEFT JOIN direcciones d ON u.id = d.userId AND d.esPrincipal = true
WHERE p.id = ?
```

## Notas Importantes

1. Solo incluir la dirección marcada como `esPrincipal = true`
2. Si el usuario no tiene dirección principal, `direccionPrincipal` debe ser `null`
3. Los campos opcionales (piso, departamento, codigoPostal, referencias, latitud, longitud) pueden ser `null`
4. Los aliases válidos son: CASA, TRABAJO, OTRO
5. Las coordenadas GPS son opcionales pero útiles para calcular envíos

## Verificación

Una vez implementado, verificar que:
- ✅ La dirección principal se muestra en la vista admin del pedido
- ✅ No se rompe si el usuario no tiene dirección
- ✅ Los campos opcionales se manejan correctamente
