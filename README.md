# 🔥 Florida Burgers POS

Sistema punto de venta estilo totem para Florida Burgers.

## ▶️ Cómo correr

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:5173
```

## 🖥️ Cómo usar

### Pantalla de Pedido (POS)
- Navegá las categorías por la barra izquierda
- Tocá un producto para agregarlo al carrito
- Si el producto tiene versión **Doble**, aparece un selector
- El carrito está a la derecha — podés ajustar cantidades
- Podés agregar una aclaración al pedido (sin cebolla, etc.)
- Al confirmar, muestra el total y limpia el pedido

### Configuración
- Tocá el botón ⚙️ abajo a la izquierda
- PIN por defecto: **1234**
- Desde ahí podés:
  - **Agregar/editar/eliminar productos** en cada categoría
  - **Subir fotos** a cada producto (se muestran en el totem)
  - **Crear nuevas categorías** con ícono y color propios
  - Eliminar categorías completas

## 💾 Almacenamiento

Todo se guarda automáticamente en el navegador (localStorage).  
Los datos persisten aunque cierres la pestaña.

## 🔧 Personalización

- Para cambiar el PIN de config, editá `src/App.jsx` línea con `CONFIG_PIN`
- Colores de marca en `src/index.css` (variables CSS)
- Menú por defecto en `src/data/menu.js`

## 📦 Build para producción

```bash
npm run build
```
Los archivos van a la carpeta `/dist` — podés servirlos con cualquier servidor web.
