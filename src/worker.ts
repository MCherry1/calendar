interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const PREFIX = '/calendar';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(new URL(`${PREFIX}/`, url).toString(), 308);
    }

    if (url.pathname === PREFIX) {
      return Response.redirect(new URL(`${PREFIX}/`, url).toString(), 308);
    }

    if (url.pathname.startsWith(`${PREFIX}/`)) {
      const stripped = url.pathname.slice(PREFIX.length) || '/';
      const rewritten = new URL(stripped + url.search, url);
      return env.ASSETS.fetch(new Request(rewritten, request));
    }

    return env.ASSETS.fetch(request);
  },
};
