import mongoose from 'mongoose';
import { AccommodationRequest } from './accommodation.model.js';
import { encrypt, decrypt } from '../../shared/utils/crypto.js';

export class AccommodationService {
  static async submit(
    learnerId: string,
    organizationId: string,
    category: string,
    details: string
  ) {
    const request = await AccommodationRequest.create({
      learnerId: new mongoose.Types.ObjectId(learnerId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
      category,
      encryptedDetails: encrypt(details),
    });

    return {
      id: request._id.toString(),
      category: request.category,
      status: request.status,
      createdAt: request.createdAt,
    };
  }

  static async listMine(learnerId: string, organizationId: string) {
    const requests = await AccommodationRequest.find({
      learnerId: new mongoose.Types.ObjectId(learnerId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).select('+encryptedDetails').sort({ createdAt: -1 }).lean();

    return requests.map((request) => ({
      id: request._id.toString(),
      category: request.category,
      details: decrypt(request.encryptedDetails),
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  }
}
