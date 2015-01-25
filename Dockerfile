FROM iojs

COPY . /usr/src
WORKDIR /usr/src
RUN npm install && npm link

CMD [ "docker-mon" ]
