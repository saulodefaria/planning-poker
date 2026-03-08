import { Router } from "express";
import type { RoomService } from "../application/room-service.js";
import { AppError } from "../domain/errors.js";
import { buildRoomPath } from "../domain/room.js";

export function createRoomRouter(roomService: RoomService): Router {
  const router = Router();

  router.post("/api/rooms", async (req, res) => {
    try {
      const name = req.body?.name;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        res.status(400).json({ code: "INVALID_NAME", message: "Room name is required" });
        return;
      }
      const { roomId } = await roomService.create(name);
      res.status(201).json({ roomId, roomUrl: buildRoomPath(roomId) });
    } catch (err) {
      handleError(res, err);
    }
  });

  router.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const room = await roomService.get(req.params.roomId);
      res.json(room);
    } catch (err) {
      handleError(res, err);
    }
  });

  return router;
}

function handleError(res: import("express").Response, err: unknown) {
  if (err instanceof AppError) {
    const status = err.code === "ROOM_NOT_FOUND" ? 404 : 400;
    res.status(status).json({ code: err.code, message: err.message });
  } else {
    console.error("[API] Unexpected error:", err);
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
  }
}
