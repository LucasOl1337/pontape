import type { APIRoute } from 'astro';
import { renderPng, shareCardSvg } from '../lib/share/render';
import { SHARE } from '../data/site/share';

export const GET: APIRoute = () => new Response(renderPng(shareCardSvg(SHARE.transparencia)), { headers: { 'Content-Type': 'image/png' } });
