import { appDataSource } from "../../core/data-source";
import { Messages } from "../../models/Messages";
import { ISocket } from "../../utils/interfaces";

export async function getMessages(receiverId: number, socket: ISocket) {
  try {
    let senderId = socket.user?.id;

    // console.log("Her", receiverId);
    // console.log("Me", senderId);

    if (senderId === receiverId) {
      return {
        message: "Self messages",
        payload: [],
      };
    }

    await appDataSource
      .createQueryBuilder()
      .update(Messages)
      .set({ isRead: true })
      .where({ sender: receiverId })
      .andWhere({ receiver: senderId })
      .execute();

    const messages = await appDataSource
      .createQueryBuilder(Messages, "msg")
      .select([
        "msg.id AS id",
        "msg.senderId AS senderId",
        "msg.receiverId AS receiverId",
        "msg.message AS message",
        "msg.isRead AS isRead",
        "msg.createdAt AS createdAt",
        "msg.updatedAt AS updatedAt",
      ])
      .where(
        "(msg.senderId = :sender AND msg.receiverId = :receiver) OR (msg.senderId = :receiver AND msg.receiverId = :sender)",
        {
          sender: senderId,
          receiver: receiverId,
        }
      )
      .orderBy("msg.id", "DESC")
      .limit(50)
      .execute();
    // console.log(messages);

    return {
      message: `Here is a history of all your chats with ${receiverId}`,
      payload: messages,
    };
  } catch (error: any) {
    return {
      message: "There was an error getting chats" + error.message,
      payload: [],
    };
  }
}
