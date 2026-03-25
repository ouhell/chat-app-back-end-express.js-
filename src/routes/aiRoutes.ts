import { Router } from "express";
import { AIController } from "../controllers/aiController";
import ErrorCatcher from "../error/ErrorCatcher";

const AIRouter = Router();

AIRouter.post("/chat", ErrorCatcher(AIController.generateRandomeGreeting));

export default AIRouter;
