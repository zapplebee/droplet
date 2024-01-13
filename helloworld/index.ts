Bun.serve({
  port: 443,
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response(Bun.file("/mnt/volume_sfo3_01/apps/notes/setting-up-the-droplet.md"), {
      headers: {
        'Content-type': 'text/markdown; charset=utf-8'
      }
    });
  },
  tls: {
    cert: Bun.file(
      "/etc/letsencrypt/live/zapplebee.prettybirdserver.com/cert.pem",
    ),
    key: Bun.file(
      "/etc/letsencrypt/live/zapplebee.prettybirdserver.com/privkey.pem",
    ),
  },
});

Bun.serve({
  port: 80,
  hostname: "0.0.0.0",
  fetch(req) {
    return Response.redirect(`${req.url.replace(/^http:/gi, "https:")}`, 302);
  },
});
