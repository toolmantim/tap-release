FROM    node:8-alpine
WORKDIR /src
ADD     package-lock.json package.json /src/
RUN     npm install
ADD     . /src
EXPOSE  3000
CMD     ["npm", "start"]