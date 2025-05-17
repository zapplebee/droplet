FROM oven/bun:1

WORKDIR /apps/helloworld

COPY ./ /apps/helloworld

RUN bun install
EXPOSE 3000/tcp

CMD ["bun", "index.ts"]
