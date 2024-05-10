import { NextFunction, Response } from "express";
import { IUser, IUserRequest } from "../../utils/interfaces";
import { Shops } from "../../models/Shops";
import { appDataSource } from "../../core/data-source";
import { CustomError } from "../../core/global-error";

export async function openAShop(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { id } = request.user as IUser;
    const { name, description, logo, categories } = request.body;

    const checkShopOwnerShip = await appDataSource
      .createQueryBuilder(Shops, "shop")
      .where("shop.owner=:owner", { owner: id })
      .getOne();

    if (checkShopOwnerShip) {
      throw new CustomError(
        409,
        "DUPLICATE",
        "You already own a shop on K market, please go to my shop"
      );
    }

    const shop = new Shops();
    shop.name = name;
    shop.description = description;
    shop.logo = logo;
    shop.categories = categories;
    shop.owner = id;

    await appDataSource.manager.save(shop);

    return response.status(200).json({
      message: "Shop opened successfully",
      payload: shop,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyShop(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { id } = request.user as IUser;

    const shop = await appDataSource
      .createQueryBuilder(Shops, "shop")
      .where({ owner: id })
      .getOne();

    return response.status(200).json({
      message: "Shop opened successfully",
      payload: shop,
    });
  } catch (error) {
    next(error);
  }
}

export async function getVerifiedShop(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    let { size = 20, page = 1 }: any = request.query;
    const offset = (page - 1) * size;

    const payLoadBuilder = appDataSource
      .createQueryBuilder(Shops, "shop")
      .select([
        "shop.id AS id",
        "shop.name AS name",
        "shop.logo AS logo",
        "shop.userStatus AS userStatus",
        "shop.description AS description",
      ]);
    let payloadQuery = payLoadBuilder;

    const [payload, totalItems] = await Promise.all([
      payloadQuery.offset(offset).limit(size).execute(),
      payloadQuery.getCount(),
    ]);

    const totalPages: number = Math.ceil(totalItems / parseInt(size));

    return response.status(200).json({
      message: "Shops retrieved successfully",
      payload: payload,
      size,
      page,
      totalItems,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
}
