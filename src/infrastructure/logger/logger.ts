import pino from "pino";

// `pino-pretty` es una devDependency: NO viaja en el bundle de la function
// de Vercel, donde solo se instalan las dependencies.
//
// El ternario original (`NODE_ENV !== "production" ? {target:"pino-pretty"} : undefined`)
// se evalúa en RUNTIME — tsup no inlinea NODE_ENV — y Vercel no garantiza que
// sea "production" en el runtime de la function. Cuando no lo es, pino intenta
// cargar el transport y lanza `unable to determine transport target for
// "pino-pretty"` de forma SÍNCRONA dentro del constructor (pino/pino.js:91),
// es decir al importar este módulo. Como logger.ts se importa en top-level de
// app.ts, eso mataba la función ENTERA antes de atender un solo request:
// 500 FUNCTION_INVOCATION_FAILED en todas las rutas.
//
// Un logger nunca debe poder tumbar el arranque: si el transport no está
// disponible, caemos a JSON plano. El nivel de detalle se pierde, el servicio no.
function createLogger() {
  const level = process.env.LOG_LEVEL ?? "debug";

  if (process.env.NODE_ENV === "production") {
    return pino({ level });
  }

  try {
    return pino({ level, transport: { target: "pino-pretty" } });
  } catch {
    // pino-pretty ausente en este entorno → JSON sin colorear.
    return pino({ level });
  }
}

export const logger = createLogger();
