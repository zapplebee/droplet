FROM oven/bun:1

WORKDIR /apps/helloworld

COPY ./ /apps/helloworld

RUN bun install
EXPOSE 80/tcp
EXPOSE 443/tcp

CMD ["bun", "index.ts"]
