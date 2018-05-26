FROM    node:8-alpine
WORKDIR /src
ADD     package-lock.json package.json /src/
RUN     npm install
ADD     . /src
CMD     ["npm", "start"]