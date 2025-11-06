import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../schemas";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async getUser(userId: string): Promise<User> {
    let user = await this.userModel.findOne({ userId }).exec();

    // Create default user record if not exists
    if (!user) {
      user = new this.userModel({
        userId,
        email: null,
        displayName: null,
        emailNotifications: true,
      });
      await user.save();
    }

    return user;
  }

  async upsertUser(
    userId: string,
    email: string,
    displayName?: string,
  ): Promise<User> {
    let user = await this.userModel.findOne({ userId }).exec();

    if (!user) {
      user = new this.userModel({
        userId,
        email,
        displayName: displayName || null,
        emailNotifications: true,
      });
    } else {
      // Update email and displayName if provided
      user.email = email;
      if (displayName !== undefined) {
        user.displayName = displayName;
      }
    }

    return await user.save();
  }

  async updateDisplayName(userId: string, displayName: string): Promise<User> {
    let user = await this.userModel.findOne({ userId }).exec();

    if (!user) {
      user = new this.userModel({
        userId,
        email: null,
        displayName,
        emailNotifications: true,
      });
    } else {
      user.displayName = displayName;
    }

    return await user.save();
  }

  async updateEmailNotifications(
    userId: string,
    enabled: boolean,
  ): Promise<User> {
    let user = await this.userModel.findOne({ userId }).exec();

    if (!user) {
      user = new this.userModel({
        userId,
        email: null,
        displayName: null,
        emailNotifications: enabled,
      });
    } else {
      user.emailNotifications = enabled;
    }

    return await user.save();
  }

  async isEmailNotificationEnabled(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user.emailNotifications;
  }
}
