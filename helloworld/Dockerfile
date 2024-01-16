FROM oven/bun:alpine

WORKDIR /apps/helloworld

COPY ./ /apps/helloworld

RUN bun install

RUN bun build ./index.ts --compile --outfile webapp

CMD ["./webapp"]
