import { JoinRoomClient } from "./join-room-client";

export default async function JoinRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  return <JoinRoomClient roomId={decodeURIComponent(roomId)} />;
}
