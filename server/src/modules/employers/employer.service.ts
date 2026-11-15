import mongoose, { type Model } from 'mongoose';
import { EmployerProfile } from './employer.model.js';

const EmployerProfileModel = EmployerProfile as Model<any>;

export class EmployerService {
  static async getProfile(userId: string, organizationId: string) {
    return EmployerProfileModel.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      {
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(userId),
          organizationId: new mongoose.Types.ObjectId(organizationId),
          companyName: 'Employer Profile',
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  static async updateProfile(
    userId: string,
    organizationId: string,
    updates: {
      companyName?: string;
      website?: string;
      industry?: string;
      description?: string;
      contactName?: string;
      contactEmail?: string;
      phone?: string;
    }
  ) {
    return EmployerProfileModel.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        organizationId: new mongoose.Types.ObjectId(organizationId),
      },
      {
        $set: updates,
        $setOnInsert: {
          userId: new mongoose.Types.ObjectId(userId),
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }
}

