import { NextResponse } from 'next/server';
import { generateCaptchaChallenge } from '@/lib/captcha';

export async function GET() {
  try {
    const challenge = generateCaptchaChallenge();
    return NextResponse.json({
      captchaToken: challenge.captchaToken,
      prompt: challenge.prompt,
      svgDataUrl: challenge.svgDataUrl,
    });
  } catch (error: any) {
    console.error('Error generating CAPTCHA:', error);
    return NextResponse.json({ error: 'Failed to generate CAPTCHA challenge.' }, { status: 500 });
  }
}
