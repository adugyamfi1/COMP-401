import { NextFunction, Response } from "express";
import { IUserRequest } from "../../utils/interfaces";
import { appDataSource } from "../../core/data-source";
import { ShopOrders } from "../../models/ShopOrders";
import { Products } from "../../models/Products";
import { Users } from "../../models/Users";

export async function dashboardStatistics(
  request: IUserRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { shopId } = request.params;
    const totalSales = await appDataSource
      .createQueryBuilder(ShopOrders, "orders")
      .select(["SUM(orders.unitPrice*orders.quantity) AS totalSales"])
      .where("orders.shopId=:shopId", { shopId: shopId })
      .execute();
    const totalOrders = await appDataSource
      .createQueryBuilder(ShopOrders, "orders")
      .where("orders.shopId=:shopId", { shopId: shopId })
      .getCount();
    const totalProducts = await appDataSource
      .createQueryBuilder(Products, "products")
      .where("products.shopId=:shopId", { shopId: shopId })
      .getCount();

    const recentOrders = await appDataSource
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
      .where("orders.shopId=:shopId", { shopId: shopId })
      .orderBy("orders.id", "DESC")
      .limit(5)
      .execute();

    const topProducts = await appDataSource
      .createQueryBuilder(Products, "product")
      .innerJoin(ShopOrders, "order", "product.id=order.productId")
      .select(["order.product as productId", "product.name AS name"])
      .addSelect("SUM(order.quantity) as totalQuantitySold")
      .groupBy("product.id")
      .orderBy("totalQuantitySold", "DESC")
      .where("order.shopId=:shopId", { shopId: shopId })
      .limit(5)
      .execute();

    const again: { productId: number; totalQuantitySold: string }[] =
      await appDataSource
        .createQueryBuilder(ShopOrders, "orders")
        .select([
          "orders.productId AS productId",
          "SUM(orders.quantity) AS totalQuantitySold",
        ])
        .groupBy("orders.productId")
        .where("orders.shopId=:shopId", { shopId: shopId })
        .take(5)
        .execute();

    const top5WithName = await Promise.all(
      again.map(async (_d) => {
        const name = await appDataSource
          .createQueryBuilder(Products, "pro")
          .where({ id: _d.productId })
          .getOne();
        return { totalQuantitySold: _d.totalQuantitySold, name: name };
      })
    );

    return response.status(200).json({
      message: "Order status updated successfully",
      payload: {
        totalSales: totalSales?.[0]?.totalSales,
        totalOrders: totalOrders,
        totalProducts: totalProducts,
        recentOrders: recentOrders,
        topProducts: topProducts,
        again: top5WithName,
      },
    });
  } catch (error) {
    next(error);
  }
}
