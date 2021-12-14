FROM node:16

RUN apt-get -y update && apt-get install -y libtool-bin && rm -rf /var/lib/apt/lists/*
RUN yarn global add node-gyp

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app
COPY yarn.lock /app
COPY tsconfig.json /app
COPY src /app/src

RUN yarn
RUN yarn build

RUN useradd -u 8877 nomic
USER nomic

CMD ["node", "."]