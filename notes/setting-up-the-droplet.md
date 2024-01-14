# 👋👋👋 hi. this is blog from zac skalko.

https://twitter.com/zapplebee

https://github.com/zapplebee/droplet

I have started way too many blogs and got caught up on the making it and not the writing.

this is just plain text for that reason.

---

i started setting up my droplet today.

here's a log.

i created a droplet on digital ocean today.

1 GB Memory / 25 GB Disk + 10 GB / SFO3 - Docker 23.0.6 on Ubuntu 22.04

I mounted the storage seperately because i can easily move to another droplet if i choose.

with docker on it, i can just try a bunch of languages and images.

after getting it set up with ssh by public key from my mac mini at home, i logged in.

the lockfile for apt-get was broken on the first install.

i tried to remove the lock file and retry. no dice. i restarted the machine and it was fine.

the first real tool i installed was vs code server. it made it super easy to just drive this machine like it's my local machine.

after that, opened up http and https with ufw

```
ufw open http
ufw open https

```

i wanted a vert simple way to serve something and make sure i could reach the device from the internet, not just over ssh

i installed bun and made a very simpe http handler.

```
curl -fsSL https://bun.sh/install | bash

```

dang zip was missing. i installed with

```
apt-get install zip
```

i figured i should install build essential too

```
apt-get install build-essential
```

now i could install bun.

and run

```
Bun.serve({
    port: 80, // defaults to $BUN_PORT, $PORT, $NODE_PORT otherwise 3000
    hostname: "0.0.0.0", // defaults to "0.0.0.0"
    fetch(req) {
      return new Response("h e l l o   w o r l d");
    },
  });

```

started it. i couldn't hit it from the internet.

digital ocean required that i also create a firewall rule

so i did. 22, 80, 443

hit it from the internet and got a response 💪

great. now i needed to set up dns.

i went to my trusty https://freedns.afraid.org/

set the old one that was pointing to my home server to the droplet's address

it took some time to propagate.

from chrome though, all i was getting was ERR_CONNECTION_REFUSED

i tried to curl it from my local machine

```
➜  ~ curl zapplebee.prettybirdserver.com
h e l l o   w o r l d%
```

i got back the expected repsonse.

so what is going on with chrome.

i went to the network tab and copied the request as curl.

i decided that it might be something a browser call is enforcing, so i should try all the same everything (cookies headers etc) from another spot.

```
➜  ~ curl 'https://zapplebee.prettybirdserver.com/' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --compressed
curl: (7) Failed to connect to zapplebee.prettybirdserver.com port 443: Connection refused

```

i realized that chrome was trying to reach the https port 443. on which i had nothing running yet

but it was hitting the machine

just not in a way that i could see.

i could now set up certbot.

```
snap install --classic certbot
```

i dont really have a proxy or loadbalancer decided on yet, so i was going to just use certbot without autoconfiguration.

https://www.digitalocean.com/community/tutorials/how-to-use-certbot-standalone-mode-to-retrieve-let-s-encrypt-ssl-certificates-on-ubuntu-20-04

i created the certs manually

```
certbot certonly --standalone -d zapplebee.prettybirdserver.com

...
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/zapplebee.prettybirdserver.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/zapplebee.prettybirdserver.com/privkey.pem
This certificate expires on 2024-04-12.

```

once i set up a service that needs to restart on renewal i can update this line in the conf file, `/etc/letsencrypt/renewal/zapplebee.prettybirdserver.com.conf`

```
renew_hook = systemctl reload your_service
```

now i have to look up how to serve with the certs from bun.

the simplest thing in the world.

```
Bun.serve({
  port: 443,
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response("h e l l o   w o r l d");
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
```

now i just need to handle directing traffic to https

```

Bun.serve({
  port: 443,
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response("h e l l o   w o r l d");
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

```

https://regexr.com/ is my trusty regex helper site.

this was substantially easier than any proxy config i have ever used.

it's alive.

```

➜  ~ curl zapplebee.prettybirdserver.com -L --verbose
*   Trying 159.223.202.91:80...
* Connected to zapplebee.prettybirdserver.com (159.223.202.91) port 80 (#0)
> GET / HTTP/1.1
> Host: zapplebee.prettybirdserver.com
> User-Agent: curl/7.77.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 302 Found
< Location: https://zapplebee.prettybirdserver.com/
< Date: Sat, 13 Jan 2024 03:08:35 GMT
< Content-Length: 0
<
* Connection #0 to host zapplebee.prettybirdserver.com left intact
* Issue another request to this URL: 'https://zapplebee.prettybirdserver.com/'
*   Trying 159.223.202.91:443...
* Connected to zapplebee.prettybirdserver.com (159.223.202.91) port 443 (#1)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*  CAfile: /etc/ssl/cert.pem
*  CApath: none
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
* TLSv1.2 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-ECDSA-CHACHA20-POLY1305
* ALPN, server did not agree to a protocol
* Server certificate:
*  subject: CN=zapplebee.prettybirdserver.com
*  start date: Jan 13 01:40:23 2024 GMT
*  expire date: Apr 12 01:40:22 2024 GMT
*  subjectAltName: host "zapplebee.prettybirdserver.com" matched cert's "zapplebee.prettybirdserver.com"
*  issuer: C=US; O=Let's Encrypt; CN=R3
*  SSL certificate verify ok.
> GET / HTTP/1.1
> Host: zapplebee.prettybirdserver.com
> User-Agent: curl/7.77.0
> Accept: */*
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< content-type: text/plain;charset=utf-8
< Date: Sat, 13 Jan 2024 03:08:35 GMT
< Content-Length: 21
<
* Connection #1 to host zapplebee.prettybirdserver.com left intact
h e l l o   w o r l d%

```

---

the first bug was discovered.

by default, bun did not read the encoding of the file that was read from disk.

i guess i assumed it would.

my good friend Ryan Rampersad https://twitter.com/ryanmr pointed out that the unicode charaters where buggy.

i looked and saw that the server was responding with a `Content-type` header of `text/markdown`.

Bun had identified this but did not automatically set the additional encoding information.

it was changes to `text/markdown; charset=utf-8`

https://github.com/zapplebee/droplet/commit/bb3e0c4b7f4860ed59d7c6789d2ba8752b24614a

now it works as expected.

---

i need a way to run this locally that ignores the certs

the way it will work is based on the NODE_ENV, i'll create the configuration differntly.

though i don't love that i am going to bake this directly into the entrypoint file, the app is still very simple and it's okay. the goal is to make some thing that can be changed.

in the .bashrc file i'll export the NODE_ENV.

```
export NODE_ENV=production
```

that way, anytime i am running something on this machine it will automatically be set.

right now the service is just being run in the background.

```
bun index.ts &
```

While bun does support a watch mode, i dont really want to think about memory leaks yet so i am just going to make a handy alias to stop and restart it.

to find the running process in the background, I'm running

```
ss -lptn 'sport = :80'
State                 Recv-Q                Send-Q                               Local Address:Port                               Peer Address:Port               Process
LISTEN                0                     512                                        0.0.0.0:80                                      0.0.0.0:*                   users:(("bun",pid=1562,fd=14))
```

while this is good, i'm going to need to trim that output so i can get just the process id and kill it

i can use `awk` for this.

```
ss -lptn 'sport = :80' | awk 'NR > 1 {print $6}'
users:(("bun",pid=1562,fd=14))

```

this skips the first line, the table headers, and then takes the sixth column value.

still not quite just the process id.

a couple cuts will do the trick

```
ss -lptn 'sport = :80' | awk 'NR > 1 {print $6}'  | cut -d= -f2 | cut -d, -f1
1562
```

this gives me just the process id of the server that is listening on port 80. i could have used the https port 443 instead but this is fine since it has to serve both for the redirects.

next i have to pass that var into a `kill` command.

I can do that with a command subsitution.

```
kill $(ss -lptn 'sport = :80' | awk 'NR > 1 {print $6}'  | cut -d= -f2 | cut -d, -f1)
```

after that i just need to start the service again.

```

kill $(ss -lptn 'sport = :80' | awk 'NR > 1 {print $6}'  | cut -d= -f2 | cut -d, -f1) & bun /mnt/volume_sfo3_01/apps/helloworld/index.ts &

```

i'll add that as an alias in the `.bashrc` file

```
alias restartbun="kill $(ss -lptn 'sport = :80' | awk 'NR > 1 {print $6}'  | cut -d= -f2 | cut -d, -f1) & bun /mnt/volume_sfo3_01/apps/helloworld/index.ts &"
```

this gives me a couple advantages right now.

1. there's no auto deploy. i have to pull from git or change the files on the server and restart. this will let me make a mess of things and not have an auto watcher restarting the server if it's not in a good state.
2. it's based on what port is exposed, so if i change the actual edge listener to a proxy or something, i can restart it with pretty much the same command.

---

okay, now i can finally set up the application code to serve certs if we're in production mode.

```

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


```

here's the changes

https://github.com/zapplebee/droplet/commit/73933eee9417f10c9139d4875cc6f292696ff9ab

---

after setting this up i realized i dont have prettier installed in the droplet, and since i am doing a lot of authoring directly on it via ssh, i might want to do that in the future.

// TODO set up prettier and git hooks i guess

---

okay now that i have a dev mode i can start to actually add some features to this thing.

first of all, i would prefer some minimal styling...

and i do mean minimal.

and to actually serve this as html

so far i don't have any dependencies and it might be good to keep it that way for a while.

bun gives me a lot out of the box and would like to keep dependencies to a minimum

first, i'll read up all the markdown paths.

```
export async function getFilePaths(): Promise<Array<string>> {
  const glob = new Glob("*.md");

  const filepaths: Array<string> = [];

  for await (const file of glob.scan(NOTES_DIRECTORY)) {
    filepaths.push(`${NOTES_DIRECTORY}${file}`);
  }

  return filepaths;
}

```

then i'll mash em together for now

```
export async function getAsHtml(): Promise<string> {
  const filepaths = await getFilePaths();
  const files = filepaths.map((e) => Bun.file(e));

  const fileContents = await Promise.all(files.map((e) => e.text()));

  const rawBody = fileContents.join("\n---\n");

  return `<!DOCTYPE html>
<html><body><style>* {background-color: black; color: green;}</style><pre>${Bun.escapeHTML(rawBody)}</pre></body></html>`;
}

```

at last i'll import it in the index.

since i want this to fail early, ie at start up, i'll use bun's macro capability to do it.

```
import { getAsHtml } from "./files" with { type: "macro" };
```

this runs the getting and escaping of the files at start up and inlines the result into the AST.

https://bun.sh/docs/bundler/macros

not super useful now since i am not bundling, but an appropriate use of a macro

i also added gzip it was very simple.

```
const HTML_CONTENT = await getAsHtml();

const data = Buffer.from(HTML_CONTENT);
const compressed = Bun.gzipSync(data);

Bun.serve({
  hostname: "0.0.0.0",
  fetch(req) {
    return new Response(compressed, {
      headers: {
        "Content-Encoding": "gzip",
        "Content-type": "text/html; charset=utf-8",
      },
    });
  },
  ...LIVE_CONFIG,
});

```

---

although I do really like this just one long file method,
there's something not quite right about it.

and that's the ability to link to a specific piece of content.

I think that the best course of action is just to create id anchors for every line.

then one can easily deep link directly to a place on the page.

there's a couple things that need to happen in order for that to work as expected.

1. i need to split the file line by line.
2. map those back together with a link at the start of the line.
3. create a line count column on the left site that has a link to the line itself.

as i was doing this i thought i might need to start to tag where i am in the git repo so that if someone (me) wanted to follow along in the future, it would be easy

```
git show-ref
3590fff8df7ecfcebd7f9379637977403549f62e refs/heads/main
3590fff8df7ecfcebd7f9379637977403549f62e refs/remotes/origin/HEAD
3590fff8df7ecfcebd7f9379637977403549f62e refs/remotes/origin/main
```

i sure could just let people do a git blame. but they might just be reading this as plain text.

a few edits to the html file and bang we we have direct links.

i am fighting my a lot of my instincts to not bring in react at this stage as the markup is getting just a bit complex.

as my friend ardeshir (https://hachyderm.io/@sepahsalar) said:

"Yep, you start adding A 🏷️ s and next thing you know, you’ve written a new RSC framework"

```

export async function getAsHtml(): Promise<string> {
  const filepaths = await getFilePaths();
  const files = filepaths.map((e) => Bun.file(e));
  const fileContents = await Promise.all(files.map((e) => e.text()));
  const rawBody = fileContents.join("\n---\n").replaceAll("\r", "");
  const escapedBody = Bun.escapeHTML(rawBody);
  const bodyLines = escapedBody.split("\n");
  const maxCharactersInLineNumber = String(bodyLines.length).length;

  return `<!DOCTYPE html>
<html><body><style>* {background-color: black; color: #4d9c25;} .line-link {color: #2f5c19;} .space, .line-link {  -webkit-user-select: none; -ms-user-select: none; user-select: none;}</style><pre>${bodyLines
    .map((line, index) => {
      const lineNumber = String(index).padStart(maxCharactersInLineNumber, "0");
      const lineId = `line-${lineNumber}`;

      return `<span class="line" id="${lineId}"><a class="line-link" href="#${lineId}">${lineNumber}</a><span class="space">&nbsp;&nbsp;&nbsp;&nbsp;</span><span>${line}</span></span>`;
    })
    .join("\n")}</pre></body></html>`;
}


```
