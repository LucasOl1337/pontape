import type { APIRoute } from 'astro';
import { faviconSvg, renderPng } from '../lib/share/render';

export const GET: APIRoute = () => new Response(renderPng(faviconSvg(), 180), { headers: { 'Content-Type': 'image/png' } });
