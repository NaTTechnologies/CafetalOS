# Compras, acopio y transformación de café

Cafetal OS no asume que toda la materia prima nace en la finca del usuario. Una cooperativa, intermediario, beneficio, tostador o productor integrado puede comprar café a terceros y continuar la cadena desde la recepción.

## Perfil operativo

En **Configuración → Operación cafetalera** se selecciona:

- **Productor:** café originado en finca propia.
- **Comprador / beneficiador:** recepción y transformación de terceros.
- **Mixta:** combina ambos orígenes.

La selección orienta el flujo y la documentación; no elimina datos ni bloquea módulos.

## Estados de café admitidos

- cereza;
- pergamino húmedo;
- pergamino seco;
- verde u oro;
- tostado.

La recepción conserva cantidad en kg y equivalencia interna en quintales. El proyecto usa 46 kg por quintal como convención histórica configurable en una futura migración.

## Flujo de recepción

1. Cree el proveedor.
2. Registre código, fecha, estado del café y peso.
3. Registre precio por kg o por quintal; el sistema calcula la otra unidad y el costo.
4. Documente finca, origen geográfico, lote del proveedor y comprobante.
5. Realice la revisión de humedad y defectos.
6. Decida: pendiente, aprobada, condicionada o rechazada.
7. Una recepción aprobada o condicionada entra al inventario.
8. El café cereza o pergamino húmedo puede enviarse a beneficio.

## Control de calidad

La acción **Revisar calidad** permite completar humedad, defectos, observaciones y decisión. Cuando el control está habilitado:

- una compra aprobada o condicionada requiere porcentaje de defectos;
- café pergamino seco o verde requiere humedad;
- valores de humedad fuera del rango operativo configurado muestran advertencia;
- una recepción que ya creó inventario no puede rechazarse sin una reversión explícita.

El sistema no sustituye un laboratorio, contrato de compra ni protocolo oficial de muestreo.

## Transformación de café comprado

Cereza y pergamino húmedo aprobados pueden enviarse a beneficio. Cafetal OS:

- crea un proceso con `origen_tipo = comprado`;
- vincula `beneficio.compra_id`;
- registra salida de la materia prima;
- registra entrada de pergamino seco;
- conserva el costo de origen;
- impide procesar dos veces la misma compra por error.

El lote técnico `ACOPIO-EXTERNO` permanece oculto de los indicadores agronómicos. Se utiliza solamente para compatibilidad con el modelo actual de beneficio mientras se migra a lotes de proceso nativos.

## Fundamento de diseño

- IHCAFE indica que la comercialización nacional en los distintos eslabones debe realizarse bajo sistema de peso y prohíbe la compraventa en lata.
- La trazabilidad de café verde requiere identificar entradas desde proveedores, procesos y salidas hacia clientes.
- Humedad, defectos, clasificación y rendimiento de transformación son controles relevantes para recepción, almacenamiento y eficiencia.

Fuentes consultadas:

- IHCAFE, comercialización de café: <https://ihcafe.hn/comercializacion-de-cafe/>
- SCA, estándares y Coffee Value Assessment: <https://sca.coffee/research/coffee-standards>
- UNIDO, *Traceability in the Green Coffee Supply Chain*: <https://www.unido.org/publications/ot/9654750/pdf>
- Centro Nacional de Producción Más Limpia de Honduras, guía para beneficios: <https://www.cnpml-honduras.org/wp-content/uploads/2018/02/Guia_de_P_mas_L__para_beneficios_de_cafe.pdf>

## Pendientes de evolución

- contratos y liquidaciones de compra;
- muestreo por sublotes;
- descuentos por humedad, defectos o rendimiento;
- cuentas por pagar al proveedor;
- lotes físicos de recepción y mezclas;
- conversión configurable por unidad comercial;
- integración con básculas.
