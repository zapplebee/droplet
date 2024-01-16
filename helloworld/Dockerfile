FROM oven/bun:alpine

WORKDIR /apps/helloworld

ADD ./ /apps/helloworld

RUN bun install

CMD ["bun", "index.ts"]
