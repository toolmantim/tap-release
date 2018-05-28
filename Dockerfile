FROM    node:8-alpine
ARG     NODE_ENV=production
ENV     NODE_ENV=$NODE_ENV
WORKDIR /src
ADD     yarn.lock package.json /src/
RUN     yarn
ADD     . /src
EXPOSE  3000
CMD     ["npm", "start"]