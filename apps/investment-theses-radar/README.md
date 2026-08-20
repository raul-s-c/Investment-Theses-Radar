# Investment Theses Radar

PWA mobile-first para monitorizar portfolio y validar tesis de inversion manualmente.

## MVP actual

- Interfaz oscura inspirada en la referencia visual aportada.
- Ocho vistas: watchlist, detalle, informe, tesis, historico, anadir ticker, discovery y ajustes.
- Revision manual bajo demanda.
- Sin revisiones automaticas.
- Sin web search por defecto.
- Sin API financiera de pago.
- Preparada para usar datos locales generados desde Yahoo Finance o una fuente similar.

## Probar localmente

Abre `index.html` en el navegador o sirve esta carpeta con cualquier servidor estatico.

```powershell
python -m http.server 8080
```

Despues abre:

```text
http://127.0.0.1:8080/apps/investment-theses-radar/
```

## GitHub Pages

La carpeta esta pensada para publicarse como artefacto estatico. La app no necesita backend para el MVP.

## Datos financieros gratuitos

Para el siguiente paso, la arquitectura recomendada es:

```text
yfinance / yahoo-finance2
-> genera JSON estatico
-> GitHub Pages consume ese JSON
-> revision manual usa cache local
```

Esto evita APIs financieras de pago y evita llamadas directas desde el navegador a Yahoo, que suelen fallar por CORS o limites.

## Politica de coste IA

- `web search`: desactivado por defecto.
- Revision automatica: fuera del MVP.
- Revision manual: usa tesis, eventos y datos locales.
- ChatGPT API: prevista para resumir y contrastar tesis, no para buscar en web salvo accion explicita del usuario.
