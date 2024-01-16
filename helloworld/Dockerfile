FROM oven/bun:alpine

WORKDIR /apps/helloworld

COPY ./ /apps/helloworld

RUN bun install

CMD ["bun", "index.ts"]
