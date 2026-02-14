import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../server';
import { AppError } from '../../middleware/errorHandler';
import OpenAI from 'openai';

export const aiRouter = Router();
aiRouter.use(authenticate);

// POST /api/ai/chat - AI chatbot
aiRouter.post('/chat', async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) throw new AppError('Мессеж оруулна уу', 400);

    const settings = await prisma.platformSettings.findFirst();
    if (!settings?.aiEnabled) throw new AppError('AI идэвхгүй', 400);
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AppError('OpenAI API түлхүүр тохируулаагүй байна', 500);

    const openai = new OpenAI({ apiKey });

    // Get user context
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        customerCompanies: { include: { company: true } },
        orders: { take: 5, orderBy: { createdAt: 'desc' }, include: { package: true } },
      },
    });

    const systemPrompt = `Та zamex.app карго платформын AI туслах боллоо. Хэрэглэгчидтэй маш найрсаг, мэргэжлийн түвшинд Монгол хэлээр харилцана.
Хэрэглэгчийн мэдээлэл:
- Нэр: ${user?.firstName}
- Утас: ${user?.phone}
- Каргонууд: ${user?.customerCompanies?.map(cc => `${cc.company.name} (${cc.customerCode})`).join(', ') || 'Бүртгүүлээгүй'}
- Сүүлийн захиалгууд: ${user?.orders?.map(o => `${o.orderCode}: ${o.status}`).join(', ') || 'Байхгүй'}

Чиглүүлэх чадвар:
- Захиалга хэрхэн үүсгэх, баталгаажуулах
- Барааны байршлыг тайлбарлах
- Даатгалын нөхцөлүүд: Basic (3%), Standard (5%), Premium (8%)
- Буцаалтын процесс: Захиалгын хэсгээс "Буцаалт нээх" товч дарна.
- Тээврийн зардал тооцох болон Каргоны үнэлгээ.

Хэрэв хэрэглэгч систем дээрх тодорхой өгөгдлийг асуувал дээрх мэдээлэлд тулгуурлан хариулна уу.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0].message.content || 'Уучлаарай, хариулт үүсгэхэд алдаа гарлаа.';

    // Log AI usage
    await prisma.aiUsageLog.create({
      data: {
        companyId: req.user!.companyId,
        service: 'chatbot',
        model: 'gpt-4o',
        tokensIn: response.usage?.prompt_tokens || 0,
        tokensOut: response.usage?.completion_tokens || 0,
        costUsd: ((response.usage?.prompt_tokens || 0) * 0.005 / 1000) + ((response.usage?.completion_tokens || 0) * 0.015 / 1000),
        endpoint: '/ai/chat',
      },
    });

    res.json({
      success: true,
      data: { response: aiResponse, conversationId: conversationId || `conv_${Date.now()}` },
    });
  } catch (e) { next(e); }
});

// POST /api/ai/translate - Chinese ↔ Mongolian translation
aiRouter.post('/translate', async (req, res, next) => {
  try {
    const { text, from, to } = req.body;
    if (!text) throw new AppError('Текст оруулна уу', 400);

    const settings = await prisma.platformSettings.findFirst();
    const apiKey = settings?.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AppError('OpenAI API түлхүүр тохируулаагүй байна', 500);

    const openai = new OpenAI({ apiKey });

    const prompt = `Translate the following text from ${from === 'cn' ? 'Chinese' : 'Mongolian'} to ${to === 'mn' ? 'Mongolian' : 'Chinese'}. Provide only the translated text.\n\nText: ${text}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const translation = response.choices[0].message.content || text;

    await prisma.aiUsageLog.create({
      data: {
        service: 'translation',
        model: 'gpt-4o-mini',
        tokensIn: response.usage?.prompt_tokens || 0,
        tokensOut: response.usage?.completion_tokens || 0,
        costUsd: ((response.usage?.prompt_tokens || 0) * 0.00015 / 1000) + ((response.usage?.completion_tokens || 0) * 0.0006 / 1000),
        endpoint: '/ai/translate',
      },
    });

    res.json({ success: true, data: { translation, from, to } });
  } catch (e) { next(e); }
});
