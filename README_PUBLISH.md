Publicar el sitio en GitHub Pages

Pasos rápidos para publicar los cambios y activar el despliegue automático:

1. Confirma los cambios localmente:

```bash
git add .
git commit -m "Mejoras: accesibilidad, meta OG, nav desktop, ajustes JS y workflow de deploy"
```

2. Sube a GitHub (a la rama `main`):

```bash
git push origin main
```

3. El workflow `.github/workflows/deploy.yml` se ejecutará automáticamente y publicará los archivos en la rama `gh-pages` (GitHub Pages).

4. Para asegurarte de que la página está activada en GitHub:
   - Ve a la configuración del repositorio -> Pages.
   - Asegúrate de que la fuente esté configurada en "gh-pages branch" (o la rama que prefieras).

Notas:
- El flujo de trabajo usa los actions oficiales de GitHub para subir y desplegar el contenido del repositorio.
- Si tu rama principal no es `main`, actualiza el disparador `on.push.branches` en `.github/workflows/deploy.yml`.
