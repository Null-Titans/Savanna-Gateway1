import mongoose from 'mongoose';
import { PartnerIntegration } from './partnerIntegration.model.js';

const PartnerIntegrationModel = PartnerIntegration as import('mongoose').Model<any>;

export class PartnerIntegrationService {
  static async list(organizationId: string) {
    return PartnerIntegrationModel.find({
      organizationId: new mongoose.Types.ObjectId(organizationId),
    }).sort({ createdAt: -1 }).lean();
  }

  static async create(
    organizationId: string,
    createdBy: string,
    data: {
      name: string;
      integrationType: string;
      externalOrganizationRef?: string;
      callbackUrl?: string;
    }
  ) {
    return PartnerIntegrationModel.create({
      ...data,
      organizationId: new mongoose.Types.ObjectId(organizationId),
      createdBy: new mongoose.Types.ObjectId(createdBy),
    });
  }

  static async updateStatus(
    organizationId: string,
    integrationId: string,
    status: 'pending' | 'active' | 'suspended'
  ) {
    if (!mongoose.isValidObjectId(integrationId)) return null;

    const integration = await PartnerIntegrationModel.findOne({
      _id: new mongoose.Types.ObjectId(integrationId),
      organizationId: new mongoose.Types.ObjectId(organizationId),
    });

    if (!integration) return null;

    integration.status = status;
    await integration.save();

    return integration;
  }
}

