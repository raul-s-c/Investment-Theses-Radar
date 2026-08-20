# Investment Theses Radar

PWA mobile-first para monitorizar portfolio y validar tesis de inversion manualmente.

## MVP actual

- Interfaz oscura inspirada en la referencia visual aportada.
- Ocho vistas: watchlist, detalle, informe, tesis, historico, anadir ticker, discovery y ajustes.
- Revision manual bajo demanda.
- Sin revisiones automaticas.
- Sin web search por defecto.
- Sin API financiera de pago.
- Actualizacion manual de precios con fuentes gratuitas experimentales: Stooq CSV y Yahoo chart.
- Fallback de simulacion local si el navegador bloquea la fuente externa.
- Alta manual de tickers fuera del catalogo inicial.
- Calendario alimentado por resultados, dividendos y catalizadores editables.

## Probar localmente

Abre `index.html` en el navegador o sirve esta carpeta con cualquier servidor estatico.

```powershell
node -e "const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{const p=path.join(process.cwd(),req.url==='/'?'index.html':req.url.split('?')[0]);fs.readFile(p,(e,d)=>{res.writeHead(e?404:200);res.end(e?'not found':d)})}).listen(8080)"
```

Despues abre:

```text
http://127.0.0.1:8080/
```

## GitHub Pages

La rama `gh-pages` publica la app como artefacto estatico en la raiz del repositorio:

```text
https://raul-s-c.github.io/Investment-Theses-Radar/
```

La app no necesita backend para el MVP.

## Datos financieros gratuitos

La app intenta actualizar precios desde el navegador sin busquedas web. Para fundamentales mas profundos, la arquitectura recomendada es:

```text
yfinance / yahoo-finance2 en una accion/proxy propio
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
