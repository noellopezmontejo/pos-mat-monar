# Materiales Monar - Punto de Venta Especial (C# .NET Framework 4.0)

Módulo de escritorio de alto rendimiento diseñado específicamente para la captura ágil de **Ventas Especiales (Remisiones y Anticipos)** con selección dinámica de listas de precios (P1 a P6) directamente en el grid.

---

## Características Principales

1. **Control de Acceso y Firma de Cajero (Login Rápido):**
   - Al iniciar la aplicación se despliega la pantalla de autenticación con diseño moderno y verificación de conectividad al servidor en tiempo real.
   - El cajero ingresa su usuario o PIN y presiona `[Enter]` para ingresar de inmediato al POS.
   - El encabezado del POS muestra el nombre y rol del cajero activo (`👤 CAJERO: JUAN PÉREZ (ADMIN)`).
   - **Cambio Rápido de Cajero (`[Ctrl+L]` / `[F9]`):** Permite alternar de cajero en mostrador al instante sin cerrar la aplicación ni perder el estado de la venta.

2. **Captura Directa en Grid (In-Grid Entry):**
   - El cajero o vendedor puede teclear directamente el código o código de barras en la fila activa.
   - **Búsqueda Flotante Ágil:** Conforme se escribe o al presionar `F2`, se despliega una ventana de búsqueda instantánea con filtrado por código, nombre y código de barras.
   - Al seleccionar un artículo, se autocompleta el renglón con Descripción, Unidad, Cantidad inicial (1), Precios disponibles e Importe.

3. **Selector de Precios Dinámico en Cada Renglón:**
   - Cada fila cuenta con un ComboBox desplegable con los 6 niveles de precio configurados en el catálogo (`P1 - Público`, `P2 - Mayoreo`, `P3 - Herrero/Contratista`, `P4 - Especial 1`, `P5 - Especial 2`, `P6 - Distribuidor`).
   - Por defecto selecciona `P1`, pero permite alternar en cualquier momento y recalcula subtotales e impuestos en tiempo real.
   - Atajo `[F4]` para ciclar ágilmente entre los precios disponibles de la partida seleccionada.

3. **Atajos de Teclado y Ergonomía de Mostrador (100% Operable con Teclado):**
   - **Multiplicador de Cantidad:** Teclea `5*CODIGO` (ej. `10*MAL-6610` o `3*7501001`) en la barra de captura rápida para insertar directamente esa cantidad de piezas.
   - **`[1]` a `[6]` en el Grid:** Cambia instantáneamente la lista de precios a `P1`, `P2`, `P3`, `P4`, `P5` o `P6` en el renglón seleccionado sin necesidad de abrir el menú desplegable.
   - **`[+]` y `[-]` en el Grid:** Incrementa o decrementa en 1 la cantidad del artículo seleccionado en tiempo real.
   - **`[F1]` / `[Ctrl+C]`:** Vincular / Buscar Cliente (Mostrador por defecto).
   - **`[F2]` / `[Insert]` / `[Ctrl+B]`:** Abrir Catálogo Predictivo de Productos.
   - **`[F3]`:** Alternar entre tipo de venta **Remisión** y **Anticipo**.
   - **`[F4]`:** Ciclar al siguiente nivel de precio disponible.
   - **`[F5]` / `[Ctrl+N]`:** Limpiar venta y comenzar una **Nueva Venta**.
   - **`[F6]` / `[Ctrl+Q]`:** Editar directamente la cantidad del renglón activo.
   - **`[F12]` / `[Ctrl+Enter]`:** Cobrar y Finalizar Venta.
   - **`[Supr / Delete]`:** Eliminar partida activa del grid.
   - **`[↑]` y `[↓]` en Buscadores:** Navegan la lista de resultados sin salir del cuadro de texto de búsqueda; presiona `[Enter]` para seleccionar.
   - **`[Esc]`:** Regresa el foco a la barra de captura rápida o cierra modales.
   - **En Modal de Cobro (`FormCheckout`):**
     - `[F1]` Pago en Caja
     - `[F2]` Contra Entrega
     - `[F3]` Crédito
     - `[F8]` Solicitar Envío / Flete
     - Teclea el monto en efectivo directamente y presiona `[Enter]` para confirmar.

4. **Diseño Visual Premium:**
   - Paleta corporativa Dark Navy (`#0F172A`), Slate y Azul Real (`#1E3A8A` / `#2563EB`).
   - Badges distintivos de tipo de comprobante: Naranja para **Remisión** y Morado para **Anticipo**.
   - Resumen financiero con desglose automático de Subtotal (sin IVA), IVA (16%), Total Neto destacado en verde esmeralda y conversión a Importe con Letra en español.

5. **Modal de Checkout & Entrega:**
   - Métodos de Pago: *Pago en Caja*, *Contra Entrega*, *Crédito*.
   - Módulo de flete y entrega a domicilio (dirección del cliente o personalizada).
   - Cálculo instantáneo de cambio en efectivo.

6. **Integración con Backend REST + Modo Offline:**
   - Consume los servicios de `http://localhost:4002/api`.
   - Incluye catálogo offline de contingencia con productos típicos (Malla, Cemento, Varilla, Piso, Farol, etc.) para pruebas y operación sin conexión.

---

## Compilación y Ejecución

### Opción 1: Ejecutar directamente el binario
Doble clic en `PosVentasEspeciales.exe` dentro de esta carpeta.

### Opción 2: Compilar desde la línea de comandos
Ejecutar `build.bat` o compilar con el compilador nativo de .NET 4.0:
```cmd
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:PosVentasEspeciales.exe /r:System.dll,System.Core.dll,System.Data.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Web.Extensions.dll,System.Xml.dll Program.cs Models\*.cs Services\*.cs Forms\*.cs
```

### Opción 3: Abrir en Visual Studio
Abrir el archivo de proyecto `PosVentasEspeciales.csproj` en Visual Studio 2010, 2012, 2015, 2019 o 2022.
