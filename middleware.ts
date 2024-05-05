import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { IUserRequest } from "../utils/interfaces";
require("dotenv").config();

export function validateUserToken(
  request: IUserRequest,
  res: Response,
  next: NextFunction
) {
  const token = request.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication required. Bearer token is missing." });
  }

  jwt.verify(token, process.env.SECRETE_KEY ?? "", (err, decoded: any) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid token. Please log in again." });
    }

    if (decoded?.userType !== "USER" && decoded?.userType !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Invalid token. Please log in again." });
    }

    request.user = decoded;
    next();
  });
}
