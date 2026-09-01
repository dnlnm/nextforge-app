import { redirect } from "next/navigation";

interface EditRoomPageProperties {
  readonly params: Promise<{ roomId: string }>;
}

const EditRoomPage = async ({ params }: EditRoomPageProperties) => {
  const { roomId } = await params;
  redirect(`/rooms?edit=${roomId}`);
};

export default EditRoomPage;
