# Propuesta de Roles y Permisos: PosMatMonar

Esta estructura define las responsabilidades y accesos para el personal de la ferretería, optimizando la seguridad y el flujo operativo.

## Jerarquía de Roles

| Rol | Descripción | Módulos de Acceso | Permisos Clave |
| :--- | :--- | :--- | :--- |
| **Administrador** | Dueño / Soporte Técnico | Todo el Sistema | Borrado, Ajustes de Sistema, Usuarios |
| **Gerente** | Gerencia Operativa | Reportes, Créditos, Compras | Ver Costos, Autorizar Créditos, Reportes |
| **Vendedor Mostrador** | Atención al Cliente | Productos, Carrito | Consulta Existencias, Crear Cotizaciones |
| **Vendedor Cajero** | Punto de Venta | Ventas (POS), Caja | Cobros, Apertura/Cierre de Turno |
| **Facturista** | Gestión Fiscal | Facturación, Clientes | Emitir CFDI, Timbrado, Notas de Crédito |
| **Almacenista** | Logística y Stock | Recepciones, Kardex | Confirmar Entradas, Inventario, Entregas |

## Detalle de los Nuevos Roles de Venta

### 1. Vendedor de Mostrador (Pre-Venta)
- **Función**: Atender al cliente, buscar productos, dar precios y generar un "ticket de preventa" o carrito cargado.
- **Acceso**: Solo lectura de productos y creación temporal de carritos. No puede ver el cajón de dinero ni realizar cobros.

### 2. Vendedor Cajero (Transaccional)
- **Función**: Recibir al cliente con su ticket de preventa, procesar el pago (Efectivo/Tarjeta) y realizar el corte de caja.
- **Acceso**: Punto de Venta, Terminal Bancaria, Manejo de Efectivo.

### 3. Facturista (Administrativo Fiscal)
- **Función**: Generar la factura formal (XML/PDF) una vez que el ticket está pagado, o gestionar facturas globales.
- **Acceso**: Módulo de Facturación, Catálogo de RFCs, Timbrado con el PAC.

---
> [!NOTE]
> Esta estructura permite que un equipo pequeño pueda rotar roles o que un equipo grande tenga segregación de funciones para evitar discrepancias en caja e inventario.
