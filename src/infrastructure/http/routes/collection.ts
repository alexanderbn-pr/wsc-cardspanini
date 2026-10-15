import { CollectionController } from "../controllers/collection/collection.controller.js";
import { CollectionService } from "../../../services/collection/collection.service.js";
import { PrismaCollectionRepository } from "../../prisma/collection.repository.js";
import { createProtectedRouter } from "../middlewares/auth.js";
import { AuthService } from "../../../services/auth/auth.service.js";

export default function createCollectionRouter(authService: AuthService) {
  const repository = new PrismaCollectionRepository();
  const service = new CollectionService(repository);
  const controller = new CollectionController(service);

  const router = createProtectedRouter(authService);
  router.get("/", controller.getAll);
  router.get("/:id", controller.getId);

  return router;
}
