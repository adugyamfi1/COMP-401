import { NextFunction, Request, Response } from "express";
import fs from "fs";
import PublitioAPI from "publitio_js_sdk";
import { CustomError, errorHandler } from "../core/global-error";
import { FilesRecord } from "../models/FilesRecord";
import { appDataSource } from "../core/data-source";
import { IUser, IUserRequest } from "../utils/interfaces";
require("dotenv").config();

export async function uploadFile(
  request: any, // IUserRequest,
  response: Response,
  next: NextFunction
) {
  const { location } = request.body;
  const user = request.user as IUser;

  const possibleLocations = ["products", "others"];

  if (!possibleLocations.includes(location)) {
    const myError = new CustomError(
      400,
      "BAD_REQUEST",
      "Please upload location can be only one of the following: products,others"
    );
    return errorHandler(myError, request, response, next);
  }

  try {
    const publitio = new PublitioAPI(
      process.env.PUBLITIO_KEY ?? "MY_API_KEY",
      process.env.PUBLITIO_SECRETE ?? "MY_API_SECRET"
    );

    const file = request.file;
    if (!file) {
      return response
        .status(400)
        .json({ errors: [{ msg: "Please upload a file" }] });
    }

    const fileToUpload = fs.readFileSync(file.path);
    const data = await publitio.uploadFile(fileToUpload, "file", {
      folder: location,
      public_id: file.filename.replace(/ /g, "_"),
      title: file.filename,
    });

    if (request.file)
      fs.unlink(request.file.path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    // console.log(data);
    if (data?.success === false) {
      throw new Error(data.error?.message);
    }

    const url_short = data.url_short;
    const url_thumbnail = data.url_thumbnail;
    const type = data.type;

    const fileRecord = new FilesRecord();
    fileRecord.image = data;
    fileRecord.creator = user.id;

    await appDataSource
      .createQueryBuilder()
      .insert()
      .into(FilesRecord)
      .values(fileRecord)
      .execute();

    response.json({
      message: "File uploaded successfully",
      payload: {
        url_short,
        url_thumbnail,
        type: type,
      },
    });
  } catch (error: any) {
    response
      .status(500)
      .json({ message: "File upload failed", error: error.message });
  }
}
