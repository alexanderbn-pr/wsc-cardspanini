import { mkdir, readFile, writeFile } from 'node:fs/promises'
// El join nos permite unir rutas de manera segura, evitando problemas con los separadores de directorio por windows o macOS
import { join, basename, extname } from 'node:path'

let content = ''


//node --permission --allow-fs-read="./archivo.txt" --allow-fs-write="./output/*" manage-file.js
//Se pueden ver los permisos que tiene el proceso con process.permission.has('fs.read', 'archivo.txt') y process.permission.has('fs.write', 'output/files/documents')
//Ejecutando la instruccion anterior por terminal se dan los permisos de lectura y escritura al proceso para el archivo y directorio especificados.
if (process.permission.has('fs.read', 'archivo.txt')){
  content = await readFile('archivo.txt', 'utf-8')
  console.log(content)
} else {
  console.log('No tienes permiso para leer el archivo.')
}

if (process.permission.has('fs.write', 'output/files/documents')) {
const outputDir = join('output', 'files', 'documents')
await mkdir(outputDir, { recursive: true })

const uppercaseContent = content.toUpperCase()
const outputFilePath = join(outputDir, 'archivo-uppercase.txt')

console.log('La extensión es: ', extname(outputFilePath))
console.log('El nombre del archivo es: ', basename(outputFilePath))

await writeFile(outputFilePath, uppercaseContent)
console.log('Archivo creado con contenido en mayúsculas')
} else {
  console.log('No tienes permiso para escribir en el directorio especificado.')
}