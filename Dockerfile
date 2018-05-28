FROM    node:8-alpine
ARG     NODE_ENV=production
ENV     NODE_ENV=$NODE_ENV
WORKDIR /src
ADD     package-lock.json package.json /src/
RUN     npm install
ADD     . /src
EXPOSE  3000
CMD     ["npm", "start"]