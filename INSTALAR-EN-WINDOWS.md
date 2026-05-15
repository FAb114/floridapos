# 🔥 Florida Burgers POS — Generar instalador Windows

## El error que tuviste

El error `Cannot create symbolic link` ocurre porque electron-builder
intenta firmar el código con certificados, lo cual requiere permisos de administrador.

Para un POS interno no necesitás firma de código — seguí estos pasos:

---

## OPCIÓN A — Ejecutar como Administrador (más rápido)

1. Buscá **PowerShell** o **CMD** en el menú inicio
2. Click derecho → **"Ejecutar como administrador"**
3. Corré:
```powershell
cd C:\Users\Admin\Desktop\florida-pos
npm run build:win
```

---

## OPCIÓN B — Borrar caché corrupta + build normal

Si la opción A no funciona, borrá la caché de electron-builder primero:

```powershell
# Borrar caché corrupta
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"

# Luego correr como administrador
npm run build:win
```

---

## OPCIÓN C — Build portable (SIN instalador, más simple)

Genera un solo `.exe` que no necesita instalación ni permisos:

```powershell
npm run build:win:portable
```

El archivo `FloridaBurgersPOS-portable.exe` queda en `dist-electron/`
→ Lo copiás al totem y lo ejecutás directo, sin instalar nada.

**Esta es la mejor opción para totems.**

---

## Resultado esperado

Después del build vas a encontrar en `dist-electron/`:
- `Florida Burgers POS Setup X.X.X.exe` → instalador
- `FloridaBurgersPOS-portable.exe` → ejecutable directo

---

## Autoarranque en el totem

Una vez instalado, para que arranque solo al encender la PC:
1. Abrí la app → Configuración → Sistema
2. Activá el toggle **"Autoarranque"**

O manualmente: copiá el acceso directo de la app a:
```
C:\Users\[usuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```
