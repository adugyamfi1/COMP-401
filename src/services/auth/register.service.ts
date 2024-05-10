import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { appDataSource } from "../../core/data-source";
import { CustomError } from "../../core/global-error";
import { Users } from "../../models/Users";
import { generatePrivateToken } from "../../utils/generateToken";
import sendEmail from "../../utils/mailer";
import sendSms from "../../utils/sms";
import { IAdminRequest, IUser } from "../../utils/interfaces";
import { Shops } from "../../models/Shops";

export async function signup(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const { email, phone, title, firstName, lastName, password } = request.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    const salt = await bcrypt.genSalt(15);
    const hashedPassword = await bcrypt.hash(password, salt);

    let check: number = 0;
    if (email) {
      check = await appDataSource.manager.countBy(Users, {
        email: email,
      });
    }
    if (phone) {
      check = await appDataSource.manager.countBy(Users, {
        phone: phone,
      });
    }

    if (check > 0) {
      let errMessage = `This phone number is associated to an account, please login`;
      if (email) {
        errMessage = `This email is associated to an account, please login`;
      }
      throw new CustomError(409, "DUPLICATE_RESOURCE", errMessage);
    }

    const user = new Users();
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    user.email = email;
    user.otp = otp;
    user.userType = "USER";
    user.password = hashedPassword;
    if (title) user.title = title;

    await appDataSource
      .createQueryBuilder()
      .insert()
      .into(Users)
      .values(user)
      .execute();

    let otpSendStatus: boolean = false;
    if (email) {
      otpSendStatus = await sendEmail(
        "default",
        email,
        `You've received this message because your email address has been registered with our site. If you did not register with us, please disregard this email. Once confirmed, this email will be uniquely associated with your account. Your OTP is : ${otp}`,
        "Confirm Your Email",
        "John Emil"
      );
    }
    if (phone) {
      otpSendStatus = await sendSms(
        `You've received this message because your phone number has been registered with our site. If you did not register with us, please disregard this message. Your OTP is : ${otp}`,
        [phone]
      );
    }

    return response.status(200).json({
      message: `Account created successfully`,
      otpSendStatus: otpSendStatus,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const { email, phone, password, fcmToken } = request.body;

    const user = await appDataSource
      .createQueryBuilder(Users, "user")
      .select(["user.id", "user.password"])
      .where("user.email = :email OR user.phone = :phone", {
        email: email,
        phone: phone,
      })
      .getOne();

    if (!user) {
      const error = new CustomError(400, "BAD_REQUEST", "Account not found");
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new CustomError(
        400,
        "UNAUTHORIZED",
        "You entered a wrong password"
      );
      throw error;
    }

    const userPayload = await appDataSource.manager
      .createQueryBuilder(Users, "user")
      .select([
        "user.id",
        "user.email",
        "user.phone",
        "user.firstName",
        "user.lastName",
        "user.lastLogin",
        "user.userType",
        "user.userStatus",
      ])
      .where("user.id = :id", {
        id: user.id,
      })
      .getOne();

    const token = generatePrivateToken(JSON.parse(JSON.stringify(userPayload)));

    await appDataSource
      .createQueryBuilder()
      .update(Users)
      .set({ lastLogin: new Date() })
      .where("id = :id", { id: user.id })
      .execute();

    const shop = await appDataSource
      .createQueryBuilder(Shops, "shop")
      .where({ owner: user.id })
      .getOne();

    if (fcmToken) {
      await appDataSource
        .createQueryBuilder()
        .update(Users)
        .set({ fcmToken: fcmToken })
        .where({ id: user.id })
        .execute();
    }

    return response.status(200).json({
      message: `Login successful`,
      token: token,
      payload: userPayload,
      shop: shop,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAccountInfo(
  request: IAdminRequest,
  response: Response,
  next: NextFunction
) {
  try {
    const { firstName, lastName, phone, title, password } = request.body;
    const user = request.user as IUser;

    const userUpdate = new Users();
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (phone) userUpdate.phone = phone;
    if (title) userUpdate.title = title;

    if (password) {
      const salt = await bcrypt.genSalt(15);
      const hashedPassword = await bcrypt.hash(password, salt);
      userUpdate.password = hashedPassword;
    }

    await appDataSource
      .createQueryBuilder()
      .update(Users)
      .set(userUpdate)
      .where({ id: user.id })
      .execute();

    return response.status(200).json({
      message: "User account updated successfully",
    });
  } catch (error) {
    next(error);
  }
}
