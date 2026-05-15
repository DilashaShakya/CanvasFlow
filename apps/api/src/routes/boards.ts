import { Router } from "express";

import { createBoardSchema, joinBoardSchema, updateBoardSchema } from "@canvasflow/shared";

import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { boardService } from "../services/board-service";

export const boardsRouter = Router();

boardsRouter.use(requireAuth);

boardsRouter.get("/", async (request, response, next) => {
  try {
    response.json({
      boards: await boardService.listForUser(request.authUser!.id),
    });
  } catch (error) {
    next(error);
  }
});

boardsRouter.post("/", validateBody(createBoardSchema), async (request, response, next) => {
  try {
    response.status(201).json({
      board: await boardService.create({
        ownerId: request.authUser!.id,
        title: request.body.title,
        visibility: request.body.visibility,
      }),
    });
  } catch (error) {
    next(error);
  }
});

boardsRouter.post("/join", validateBody(joinBoardSchema), async (request, response, next) => {
  try {
    response.json({
      board: await boardService.joinByRoom(request.body.roomId, request.authUser!),
    });
  } catch (error) {
    next(error);
  }
});

boardsRouter.get("/:boardId/bootstrap", async (request, response, next) => {
  try {
    response.json(await boardService.getBootstrap(String(request.params.boardId), request.authUser!));
  } catch (error) {
    next(error);
  }
});

boardsRouter.patch("/:boardId", validateBody(updateBoardSchema), async (request, response, next) => {
  try {
    response.json({
      board: await boardService.update(String(request.params.boardId), request.authUser!, request.body),
    });
  } catch (error) {
    next(error);
  }
});
