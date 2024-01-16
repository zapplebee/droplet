FROM oven/bun:alpine

WORKDIR /apps/helloworld

COPY ./ /apps/helloworld

RUN bun install
EXPOSE 80
EXPOSE 443
RUN bun build ./index.ts --compile --outfile webapp

CMD ["./webapp"]
