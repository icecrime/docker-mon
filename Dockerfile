FROM iojs

RUN npm install moment --save

COPY . /usr/src
WORKDIR /usr/src
RUN npm install && npm link

CMD [ "dstats" ]
