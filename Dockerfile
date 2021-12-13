FROM node:16

RUN mkdir -p /app
WORKDIR /app

COPY package.json /app
COPY yarn.lock /app/
COPY index.js /app

RUN yarn
RUN yarn build

RUN useradd -u 8877 iwabot
USER iwabot

CMD ["node", "."]