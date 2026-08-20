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
- Portfolio vacio por defecto: sin tickers, precios, graficos ni scores inventados.
- Alta manual de tickers reales.
- Informes con OpenAI bajo demanda usando la API key que pegues en Ajustes.
- Sincronizacion opcional movil/PC con Supabase en modo solo.
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

## Sincronizacion y cache comunitaria

La app funciona con `localStorage`, pero ya permite sincronizar movil y PC con Supabase.

Para probarlo ya:

1. Crea un proyecto en Supabase.
2. Abre SQL Editor.
3. Ejecuta `supabase/solo_sync.sql`.
4. En la app, ve a Ajustes y pega:
   - Project URL
   - anon public key
   - deja el `Sync key` generado o usa el mismo en movil y PC.
5. En un dispositivo pulsa `Subir estado`; en el otro pulsa `Descargar`.

El esquema completo futuro esta en `supabase/schema.sql`.

Objetivo futuro:

- Sincronizar portfolio entre movil y PC sin repetir configuracion.
- Guardar cache diaria por ticker para reutilizar precios, eventos y fundamentales.
- Evitar gasto duplicado de tokens: si una tesis/ticker ya se reviso hoy con el mismo input, se reutiliza el resultado.
- Mantener interes agregado semi-anonimo: numero de instalaciones que siguen una empresa, sin exponer posiciones personales.
- Dejar usuarios reales para mas adelante. Primero puede funcionar con una `installation_key` local anonima.

Separacion de datos prevista:

- Privado: portfolio, posiciones, tesis propias, coste medio y notas.
- Compartible: cache diaria de ticker, eventos publicos, fundamentals normalizados, conteo agregado de seguidores.
- IA: revisiones cacheadas por `ticker + fecha + hash del input`, sin web search salvo accion explicita.

Cuando activemos Supabase, GitHub Pages no debe guardar claves privadas. Opciones seguras:

- Cliente Supabase con anon key y RLS bien definido para datos publicos/agregados.
- Mini API/proxy para operaciones privadas, llamadas a OpenAI y jobs de datos.
- Service role solo en servidor o GitHub Actions, nunca en el navegador.

Nota sobre el modo `solo_sync.sql`: es un puente temporal para uso personal. Usa anon key y una `sync_key` opaca; no debe ser la arquitectura final multiusuario.

## Politica de coste IA

- `web search`: desactivado por defecto.
- Revision automatica: fuera del MVP.
- Revision manual: usa tesis, eventos y datos reales disponibles.
- ChatGPT API: puedes pegarla en Ajustes para pruebas. Se guarda solo en el navegador y no se sincroniza a Supabase.
- La app llama a OpenAI sin web search y pide al modelo no inventar fundamentales, noticias, dividendos ni precios.
