import { Router} from 'express';
import { TeamController } from '../controllers/teams.js';

const router = Router();

router.get("/", TeamController.getAll);
router.get("/:id", TeamController.getId);

export default router;