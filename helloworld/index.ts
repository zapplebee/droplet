const PRODUCTION_CONFIG = {
  port: 443,
  tls: {
    cert: Bun.file(
      "/etc/letsencrypt/live/zapplebee.prettybirdserver.com/cert.pem",
    ),
    key: Bun.file(
      "/etc/letsencrypt/live/zapplebee.prettybirdserver.com/privkey.pem",
    ),
  },
} as const;

const DEV_CONFIG = {
  port: 3100
} as const;

const IS_PRODUCTON = process.env.NODE_ENV === 'production';

const LIVE_CONFIG = IS_PRODUCTON ? PRODUCTION_CONFIG : DEV_CONFIG;

Bun.serve({

  hostname: "0.0.0.0",
  fetch(req) {
    return new Response(Bun.file("/mnt/volume_sfo3_01/apps/notes/setting-up-the-droplet.md"), {
      headers: {
        'Content-type': 'text/markdown; charset=utf-8'
      }
    });
  },
  ...LIVE_CONFIG
});


if(IS_PRODUCTON) {
  // no need to serve the redirects if we're not in prod
  Bun.serve({
    port: 80,
    hostname: "0.0.0.0",
    fetch(req) {
      return Response.redirect(`${req.url.replace(/^http:/gi, "https:")}`, 302);
    },
  });
  
}
