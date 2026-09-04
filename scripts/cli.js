//process.argv es un array que contiene los argumentos de la línea de comandos pasados al script de Node.js. 
// El primer elemento (process.argv[0]) es la ruta del ejecutable de Node.js, 
// el segundo elemento (process.argv[1]) es la ruta del archivo JavaScript que se está ejecutando, y los elementos restantes (process.argv[2] en adelante) son los argumentos adicionales proporcionados por el usuario.

import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
// 1. Recuperar la carpeta a listar
const dir = process.argv[2] ?? "."

// 2. Formatear simple de los tamaños
const formatBytes = (size) => {}

// 3. Leer los nombres, sin info
const files = await readdir(dir)
console.log("Files:", files)

//4. Recuperar la info de cada file
const entries = await Promise.all(
    files.map(async (file) => {
        const fullPath = join(dir, file)
        const info = await stat(fullPath)
        return { file, isDir: info.isDirectory(), size: info.size }
    })
)

for (const entry of entries) {
    //Renderizar la información de cada archivo o directorio
    const icon = entry.isDir ? "📁" : "📄"
    const formattedSize = entry.isDir ? "-" : entry.size
    console.log(`${icon} ${entry.file} ${formattedSize}`)
}

