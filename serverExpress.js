// Express es lo que utiliza por debajo el framework NextJs de React
// Como se puede ver express es mucho mas sencillo crear un servidor con peticiones respecto nodeJs nativo
import express from "express";
import { randomUUID } from "node:crypto";
import { DEFAULTS, ACCEPTED_ORIGINS } from "./src/config/config";
// Libreria de cors para permitir peticiones desde otros dominios, por ejemplo si tenemos un frontend en otro dominio y queremos hacer peticiones a nuestro backend
import cors from "cors";
//Forma de importar archivos json en nodeJs nativo
import teams from "./scripts/teams.json" with { type: "json" };

const PORT = process.env.PORT ?? 1234;
const players = [];
// Inicializamos la aplicación de express
const app = express();

//Este middleware es necesario para poder parsear el body de las peticiones POST y PUT, ya que express no lo hace por defecto, y si no lo ponemos el body de la petición será undefined
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Utilizando el use passando la libreria de cors y la lista de url filtramos que dominios pueden hacer peticiones a nuestro backend, en caso no no pasar el filtro de origen permitimos a todos los dominios acceder al back es como un *
app.use(cors({  
    origin: ACCEPTED_ORIGINS
}));

app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.path}`);
  // Con el next le decimos que busque la siguiente ruta que coincida con la petición y la ejecute, si no ponemos el next() se queda colgado y no responde
  next();
});

//Tambien se pueden crear funciones middleware para rutas específicas que luego se llaman en la definicion de la ruta
const previousHome = (req, res, next) => {
  console.log("Previous home middleware");
  next();
}

//En primer lugar lo que vemos es que definimos que tipo de consulta va en esta ruta (GET) respecto nodeJs nativo
app.get("/", previousHome, (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send("Hello, World desde express 📁! \n");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(), // tiempo de actividad del proceso en segundos
    os: process.platform,
    arch: process.arch,
    nodeVersion: process.version
  });
});

app.post("/player", (req, res) => {
  console.log("Received body:", req.body);
  const { name, position, number } = req.body;
  if (!name || !position) {
    return res.status(400).json({
      error: "Missing required fields: name and position",
    });
  }

  const player = {
    id: randomUUID(),
    name,
    position,
    number: number || null,
  };

  players.push(player);
  // Si es correcto se devuelve un status 201 (Created) y el objeto creado
  res.status(201).json(player);
});

// Express utiliza path to regexp para poder definir rutas con parametros con expresiones regulares
app.get("/player/:name", (req, res) => {
    // Los parametros los va a entender siempre como cadena de texto, por lo que si queremos buscar por id que es un numero hay que parsearlo a numero
    const { name } = req.params;
    const player = players.find(p => p.name === name);
    if (!player) {
        return res.status(404).json({ error: "Player not found" });
    }
    res.json(player);
})

app.get("/teams/:id", (req, res) => {
    const { id } = req.params;
    const team = teams.teams.find(t => t.id === Number(id));
    if (!team) {
        return res.status(404).json({ error: "Team not found" });
    }
    res.json(team);
})

app.get("/teams", async(req, res) => {
    // Se puede importar un archivo json de forma asincrona y dinamicamente, esto es util si el archivo es muy grande y no queremos cargarlo en memoria al inicio del servidor
    const {default: jsonResponse} = await import("./scripts/teams.json", { with: { type: "json" } });
    res.json(jsonResponse);
});

app.get("/stickers/:id", async(req, res) => {
    const { id } = req.params;
    // En express se puede acceder a los query params de la url de forma sencilla con req.query, no hace falta parsear la url como en nodeJs nativo
    console.log(req.query);
    const {limit = DEFAULTS.LIMIT_PAGINATION, offset = DEFAULTS.OFFSET_PAGINATION, position} = req.query;
    const team = teams.teams.find(t => t.id === Number(id));
    if (!team) {
        return res.status(404).json({ error: "Team not found" });
    }
    let stickers = team.stickers;
    if (position) {
        stickers = stickers.filter(s => s.position.toLocaleLowerCase() === position.toLocaleLowerCase());
    }
   const limitNumber = Number(limit);
   const offsetNumber = Number(offset);
   stickers = stickers.slice(offsetNumber, offsetNumber + limitNumber);
   res.json(stickers);
});

// Opcional --> /acd o /abcd
app.get("/a*cd", (req, res) => {
    res.send("Ruta con comodin * " + req.path);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


// CRUD: Create , Read, Update, Delete
