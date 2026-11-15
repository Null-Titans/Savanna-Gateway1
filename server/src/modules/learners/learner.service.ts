import mongoose from 'mongoose';
import { LearnerProfile } from './learner.model.js';
import { User } from '../authentication/user.model.js';
import { NotFoundError } from '../../shared/errors/index.js';

export class LearnerService {
  static async getProfile(userId: string, organizationId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('Learner account not found');

    let profile = await LearnerProfile.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!profile) {
      profile = await LearnerProfile.create({
        userId: user._id,
        organizationId: new mongoose.Types.ObjectId(organizationId),
        displayName: `${user.firstName} ${user.lastName}`.trim(),
      });
    }

    return profile;
  }

  static async updateProfile(
    userId: string,
    organizationId: string,
    updates: {
      displayName?: string;
      preferredLanguage?: 'en' | 'am' | 'om';
      education?: string;
      skills?: string[];
      accessibilityPreferences?: string[];
    }
  ) {
    const profile = await this.getProfile(userId, organizationId);

    Object.assign(profile, updates);
    await profile.save();

    return profile;
  }
}

