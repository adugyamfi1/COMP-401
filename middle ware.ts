import { appDataSource } from "../core/data-source";
import { Users } from "../models/Users";
import { ISocket } from "../utils/interfaces";

export default async function verifyTokenConnection(
  socket: ISocket,
  next: any
) {
  try {
    const userId = socket.request.headers?.user;
    const user = await appDataSource
      .createQueryBuilder(Users, "user")
      .where({ id: userId })
      .getOne();

    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error("Error during authorization:", error);
    socket.disconnect(true);
  }
}
