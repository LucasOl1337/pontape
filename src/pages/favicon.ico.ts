import type { APIRoute } from 'astro';
import { faviconSvg, icoFromPngs, renderPng } from '../lib/share/render';

// For browsers and tools that still ask /favicon.ico before reading the <link>.
export const GET: APIRoute = () => new Response(
  icoFromPngs([16, 32, 48].map(size => ({ size, png: renderPng(faviconSvg(), size) }))),
  { headers: { 'Content-Type': 'image/x-icon' } },
);
