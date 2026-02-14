import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EbarimtResponse {
    success: boolean;
    billId?: string;
    lottery?: string;
    qrData?: string;
    error?: string;
    errorCode?: string;
}

export class EbarimtService {
    /**
     * Generates a new E-barimt for a paid invoice
     */
    static async createBill(invoiceId: string): Promise<EbarimtResponse> {
        try {
            const settings = await prisma.platformSettings.findFirst();
            if (!settings?.vatEnabled) {
                return { success: false, error: 'VAT is disabled' };
            }

            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: {
                    items: true,
                    customer: true
                }
            });

            if (!invoice) throw new Error('Invoice not found');
            if (invoice.status !== 'PAID') throw new Error('Invoice must be paid to generate e-barimt');

            // Prepare data for E-barimt API
            // Mongolian PosAPI 3.0 standard payload structure
            const payload = {
                amount: invoice.totalAmount.toString(),
                vat: invoice.vatAmount.toString(),
                cashAmount: invoice.totalAmount.toString(),
                nonCashAmount: '0.00',
                cityTax: '0.00',
                districtCode: '00',
                posId: settings.ebarimtPosId,
                merchantId: settings.ebarimtMerchantId,
                customerNo: (invoice as any).ebarimtRegNo || '',
                billType: (invoice as any).ebarimtType || '1', // 1: individual, 3: organization
                stocks: invoice.items.map(item => ({
                    code: (item as any).packageId || 'SERVICE',
                    name: item.description,
                    measureUnit: 'pcs',
                    qty: item.quantity.toString(),
                    unitPrice: item.unitPrice.toString(),
                    totalAmount: item.amount.toString(),
                    vat: (item as any).vatAmount.toString(),
                    cityTax: '0.00'
                }))
            };

            // Mocking the E-barimt API call for now
            console.log('EBARIMT_PAYLOAD:', JSON.stringify(payload, null, 2));

            // MOCK SUCCESS RESPONSE
            const isOrg = payload.billType === '3';
            const mockResponse: EbarimtResponse = {
                success: true,
                billId: `B-${Date.now()}`,
                lottery: isOrg ? undefined : Math.random().toString().slice(2, 10),
                qrData: `https://ebarimt.mn/qr/${Date.now()}_${Math.random().toString(36).substring(7)}`
            };

            // Update invoice with e-barimt data
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    ebarimtBillId: mockResponse.billId,
                    ebarimtLottery: mockResponse.lottery,
                    ebarimtQrData: mockResponse.qrData,
                    ebarimtStatus: 'SUCCESS'
                }
            });

            return mockResponse;
        } catch (error: any) {
            console.error('E-barimt Creation Error:', error);
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { ebarimtStatus: 'FAILED' }
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Revokes (cancels) an existing E-barimt
     */
    static async revokeBill(invoiceId: string): Promise<boolean> {
        try {
            const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
            if (!invoice?.ebarimtBillId) return false;

            // Call E-barimt Revoke API
            console.log(`Revoking E-barimt ${invoice.ebarimtBillId}`);

            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { ebarimtStatus: 'REVOKED' }
            });

            return true;
        } catch (error) {
            console.error('E-barimt Revocation Error:', error);
            return false;
        }
    }
}
