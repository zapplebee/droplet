# 👋👋👋 hi. this is blog from zac skalko.

 https://twitter.com/zapplebee

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

now it works as expected.