import { appDataSource } from "../../core/data-source";
import { Messages } from "../../models/Messages";
import { ISocket } from "../../utils/interfaces";

export async function sendMessages(
  receiver_id: number,
  message: string,
  socket: ISocket
) {
  try {
    let senderId = socket.user?.id;

    if (senderId === receiver_id) {
      return {
        message: "Self messages",
        payload: null,
      };
    }

    const msg = new Messages();
    msg.sender = senderId;
    msg.receiver = receiver_id;
    msg.message = message;

    await appDataSource
      .createQueryBuilder()
      .insert()
      .into(Messages)
      .values(msg)
      .execute();

    return {
      message: `Message sent`,
    };
  } catch (error: any) {
    return {
      message: "There was an error getting chats" + error.message,
      payload: null,
    };
  }
}
