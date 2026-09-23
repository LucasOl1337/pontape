/* global Response, URL */
// Worker na frente dos assets estáticos (D019): só redireciona http e www pro endereço canônico.
// Todo o resto é o site estático, servido pelo binding ASSETS com _headers e 404.html.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === 'http:' || url.hostname === 'www.pontape.org') {
      url.protocol = 'https:';
      url.hostname = 'pontape.org';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
