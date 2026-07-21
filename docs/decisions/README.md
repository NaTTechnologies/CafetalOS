# Decisiones de arquitectura

Esta carpeta conserva las decisiones técnicas o funcionales que cambian de forma relevante la arquitectura, el modelo de datos, la seguridad o la compatibilidad de Cafetal OS.

## Cuándo crear una decisión

Cree un documento cuando una propuesta:

- introduzca o sustituya una tecnología central;
- cambie tablas, migraciones o formatos de respaldo;
- modifique el contrato IPC o el modelo de permisos;
- afecte compatibilidad con versiones anteriores;
- determine la estrategia PWA, móvil o sincronización;
- establezca una convención difícil de revertir.

## Formato recomendado

Use nombres como `0001-titulo-breve.md` y documente:

1. contexto;
2. decisión;
3. alternativas consideradas;
4. consecuencias positivas y negativas;
5. plan de migración o reversión;
6. estado: propuesta, aceptada, reemplazada o descartada.

Las discusiones pueden ocurrir en Issues o Discussions, pero la decisión final debe quedar resumida aquí.
