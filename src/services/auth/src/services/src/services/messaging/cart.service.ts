import { NextFunction, Response } from "express";
import { IUser, IUserRequest } from "../../utils/interfaces";
import { Carts } from "../../models/Carts";
import { appDataSource } from "../../core/data-source";
import { Products } from "../../models/Products";

export async function addToCard(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { id } = request.user as IUser;
    const { productId, quantity } = request.body;

    const check = await appDataSource
      .createQueryBuilder(Carts, "cart")
      .where({ product: productId, user: id })
      .getOne();

    if (quantity === 0) {
      await appDataSource
        .createQueryBuilder()
        .delete()
        .from(Carts)
        .where({ id: check?.id })
        .execute();
      return response.status(200).json({
        message: "Item removed from cart successfully",
      });
    }

    const cart = new Carts();
    cart.product = productId;
    cart.user = id;
    cart.quantity = quantity;
    if (check) cart.id = check.id;

    await appDataSource.manager.save(cart);

    return response.status(200).json({
      message: "Cart updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getCart(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { id } = request.user as IUser;

    const payload = await appDataSource
      .createQueryBuilder(Carts, "cart")
      .select([
        "product.id AS productId",
        "cart.id AS cartId",
        "product.name AS name",
        "product.price AS price",
        "product.currency AS currency",
        "product.primaryImage AS primaryImage",
        "cart.quantity AS quantity",
        "cart.updatedAt AS updatedAt",
      ])
      .innerJoin(Products, "product", "product.id=cart.productId")
      .where("cart.userId=:user", { user: id })
      .execute();

    const totalPrice: number = payload
      .reduce(
        (sum: any, product: any) =>
          sum + parseFloat(product.price) * parseInt(product.quantity),
        0
      )
      .toFixed(2);

    return response.status(200).json({
      message: "Item added to cart successfully",
      payload: payload,
      totalPrice: totalPrice,
    });
  } catch (error) {
    next(error);
  }
}
