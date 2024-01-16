FROM oven/bun:alpine

WORKDIR /apps/helloworld

ADD ./ /apps/helloworld

RUN bun install --production

CMD ["bun", "index.ts"]
