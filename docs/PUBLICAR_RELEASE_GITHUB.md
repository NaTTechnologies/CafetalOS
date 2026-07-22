# Publicar Cafetal OS en GitHub Releases

Cafetal OS incluye `.github/workflows/release.yml`. Al subir una etiqueta semántica, GitHub Actions compila instaladores en Windows, macOS y Linux y crea una release pública con sumas SHA-256.

## Requisitos

- Repositorio subido a GitHub.
- Rama principal `main` actualizada.
- GitHub Actions habilitado.
- `contents: write` permitido para el workflow.
- Versión sincronizada en `package.json`, `package-lock.json` y `CITATION.cff`.

## Publicar 2.6.0

Ejecute validación local:

```bash
npm ci
npx install-electron --no
npm test
npm run lint
npm run verify
npm run build:app
npm run mcp:inspect
npm run screenshots
```

Cree commit y etiqueta:

```bash
git add .
git commit -m "release: Cafetal OS 2.6.0"
git push origin main
git tag -a v2.6.0 -m "Cafetal OS 2.6.0"
git push origin v2.6.0
```

En Windows puede usar:

```bat
publicar-release.bat 2.6.0
```

El script comprueba versión, estado de Git, remoto y etiqueta antes de publicarla.

## Qué ejecuta GitHub Actions

Para cada sistema:

1. descarga el código de la etiqueta;
2. configura Node.js 22.12;
3. verifica que `v2.6.0` coincida con `package.json`;
4. ejecuta `npm ci`;
5. descarga Electron;
6. ejecuta pruebas, lint y compilación;
7. genera instaladores nativos;
8. guarda artefactos temporales.

El trabajo final:

- reúne `.exe`, `.dmg`, `.zip`, `.AppImage` y `.deb`;
- genera `SHA256SUMS.txt`;
- crea **Cafetal OS 2.6.0** en GitHub Releases;
- adjunta los instaladores;
- usa `docs/RELEASE_NOTES_X.Y.Z.md` cuando existe y, de lo contrario, genera notas automáticas;
- marca la publicación como latest.

## Permisos

Si aparece `Resource not accessible by integration`:

1. abra **Settings → Actions → General**;
2. busque **Workflow permissions**;
3. seleccione **Read and write permissions**;
4. guarde y reejecute.

El workflow también declara:

```yaml
permissions:
  contents: write
```

## Publicación manual

1. Abra **Releases**.
2. Pulse **Draft a new release**.
3. Seleccione o cree `v2.6.0`.
4. Título: `Cafetal OS 2.6.0`.
5. Use `docs/RELEASE_NOTES_2.6.0.md` como base.
6. Adjunte instaladores y `SHA256SUMS.txt`.
7. Publique.

## Siguiente patch

Para 2.6.0:

```bash
npm version patch --no-git-tag-version
# actualizar CHANGELOG.md
git add package.json package-lock.json CHANGELOG.md
git commit -m "release: Cafetal OS 2.6.0"
git push origin main
git tag -a v2.6.0 -m "Cafetal OS 2.6.0"
git push origin v2.6.0
```

## Fallos comunes

- **La etiqueta no coincide:** actualice la versión antes de crearla.
- **La release no aparece:** revise el trabajo `Publicar en GitHub Releases`.
- **No hay instaladores:** revise el job del sistema operativo correspondiente.
- **Tag ya existe:** no reescriba una release publicada; cree un patch nuevo.
- **Mac no compila en Windows:** el workflow usa runner macOS para DMG/ZIP.
