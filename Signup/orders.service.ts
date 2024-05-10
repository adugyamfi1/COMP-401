import { NextFunction, Response } from "express";
import { IUser, IUserRequest } from "../../utils/interfaces";
import { Carts } from "../../models/Carts";
import { appDataSource } from "../../core/data-source";
import { Products } from "../../models/Products";
import { UserOrders } from "../../models/UserOrders";
import { generateTMKCode } from "../../utils/helpers";
import { ShopOrders } from "../../models/ShopOrders";
import { Shops } from "../../models/Shops";
import { CustomError } from "../../core/global-error";
import { Transactions } from "../../models/Transactions";
import { Users } from "../../models/Users";

const stripe = require("stripe")(
  "sk_test_51OvPkO1RLasRq6FHq1KuEiQHnMh6jv8exBhZ1MoQA7M56YwTFFiGj7JGqg1FSftYPctzyBh4LjoNsa2rP4uBU0H300AGGSY3O5"
);

export async function makeOrder(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { id, email } = request.user as IUser;
    /**
     * 1. Get items from cart
     * 2. Calculate total cost
     * 3. Add items to UserOrders
     * 4. Add items to ShopOrders individually
     */

    const orderProducts: {
      productName: string;
      productId: number;
      shop: number;
      cartId: number;
      currency: string;
      price: number;
      primaryImage: string;
      quantity: string;
    }[] = await appDataSource
      .createQueryBuilder(Carts, "cart")
      .select([
        "product.id AS productId",
        "cart.id AS cartId",
        "product.name AS productName",
        "product.name AS name",
        "product.price AS price",
        "product.currency AS currency",
        "product.shopId AS shop",
        "shop.name AS shopName",
        "shop.ownerId AS ownerId",
        "product.primaryImage AS primaryImage",
        "cart.quantity AS quantity",
      ])
      .innerJoin(Products, "product", "product.id=cart.productId")
      .leftJoin(Shops, "shop", "shop.id=product.shopId")
      .where("cart.userId=:user", { user: id })
      .execute();

    if (orderProducts.length === 0) {
      throw new CustomError(
        503,
        "EMPTY CART",
        "You do not have any items in your cart"
      );
    }

    const totalPrice: number = orderProducts
      .reduce(
        (sum: any, product: any) =>
          sum + parseFloat(product.price) * parseInt(product.quantity),
        0
      )
      .toFixed(2);

    const limeItems = orderProducts.map((_d) => ({
      price_data: {
        currency: "usd",
        product_data: { name: _d.productName, images: [_d.primaryImage] },
        unit_amount: Math.round(_d.price * 100),
      },
      quantity: _d.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: limeItems,
      mode: "payment",
      success_url: "http://localhost:3000/my-orders",
      cancel_url: "http://localhost:3000/my-orders",
    });

    const trackingNumber = generateTMKCode();
    await appDataSource.transaction(async (transactionManager) => {
      const userOrder = new UserOrders();
      userOrder.user = id;
      userOrder.amount = totalPrice;
      userOrder.paymentStatus = "PENDING";
      userOrder.products = orderProducts;
      userOrder.trackingNumber = trackingNumber;

      await transactionManager
        .createQueryBuilder()
        .insert()
        .into(UserOrders)
        .values(userOrder)
        .execute();
      const shopOrders = orderProducts.map((_d) => {
        const shop = new ShopOrders();
        shop.trackingNumber = trackingNumber;
        shop.user = id;
        shop.shop = _d.shop;
        shop.unitPrice = _d.price;
        shop.quantity = _d.quantity;
        shop.product = _d.productId;

        return shop;
      });

      await transactionManager
        .createQueryBuilder()
        .insert()
        .into(ShopOrders)
        .values(shopOrders)
        .execute();

      await transactionManager
        .createQueryBuilder()
        .delete()
        .from(Carts)
        .where({ user: id })
        .execute();

      const transaction = new Transactions();
      transaction.status = "Incomplete";
      transaction.paymentIntent = session;
      transaction.orderId = userOrder.id;
      transaction.reference = session?.id;

      await transactionManager
        .createQueryBuilder()
        .insert()
        .into(Transactions)
        .values(transaction)
        .execute();
    });

    return response.status(200).json({
      message: `Order placed successfully, proceed to make payment`,
      trackingNumber: trackingNumber,
      payment_url: session?.url,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrders(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    let { size = 20, page = 1 }: any = request.query;
    const offset = (page - 1) * size;

    const payLoadBuilder = appDataSource.createQueryBuilder(
      UserOrders,
      "orders"
    );
    let payloadQuery = payLoadBuilder;

    const [payload, totalItems] = await Promise.all([
      payloadQuery.offset(offset).limit(size).getMany(),
      payloadQuery.getCount(),
    ]);

    const totalPages: number = Math.ceil(totalItems / parseInt(size));

    return response.status(200).json({
      message: "Orders retrieved successfully",
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

export async function getShopOrders(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { shopId } = request.params;
    let { size = 20, page = 1 }: any = request.query;
    const offset = (page - 1) * size;

    const payLoadBuilder = appDataSource
      .createQueryBuilder(ShopOrders, "orders")
      .select([
        "orders.id as orderId",
        "user.id as userId",
        "user.firstName as firstName",
        "user.lastName as lastName",
        "orders.trackingNumber as trackingNumber",
        "orders.unitPrice as unitPrice",
        "orders.quantity as quantity",
        "orders.orderStatus as orderStatus",
        "orders.productId as productId",
        "product.name as name",
        "product.primaryImage as primaryImage",
        "orders.createdAt as createdAt",
      ])
      .innerJoin(Users, "user", "user.id=orders.userId")
      .innerJoin(Products, "product", "product.id=orders.productId")
      .where("orders.shopId=:shopId", { shopId: shopId });
    let payloadQuery = payLoadBuilder;

    const [payload, totalItems] = await Promise.all([
      payloadQuery
        .orderBy("orders.id", "DESC")
        .offset(offset)
        .limit(size)
        .execute(),
      payloadQuery.getCount(),
    ]);

    const totalPages: number = Math.ceil(totalItems / parseInt(size));

    return response.status(200).json({
      message: "Orders retrieved successfully",
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

export async function updateOrderStatus(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { orderId } = request.params;
    const { orderStatus } = request.body;

    await appDataSource
      .createQueryBuilder()
      .update(ShopOrders)
      .set({ orderStatus: orderStatus })
      .where({ id: orderId })
      .execute();

    return response.status(200).json({
      message: "Order status updated successfully",
    });
  } catch (error) {
    next(error);
  }
}
