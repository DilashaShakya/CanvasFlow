"use client";

import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

let socketSingleton: Socket | null = null;

export function getSocket(token: string, sessionId?: string) {
  if (!socketSingleton) {
    socketSingleton = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  socketSingleton.auth = {
    token,
    sessionId,
  };

  return socketSingleton;
}
